import { ComAtpchessMove } from '@atpchess/lexicon'
import { TID } from '@atproto/common'
import {
  AuthRequiredError,
  InvalidRequestError,
  UpstreamFailureError,
} from '@atproto/xrpc-server'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { moveToMoveView } from '#/lib/hydrate'
import { getSessionAgent } from '#/session'

export default function (server: Server, ctx: AppContext) {
  server.com.atpchess.makeMove({
    handler: async ({ input, req, res }) => {
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        throw new AuthRequiredError('Authentication required')
      }

      const playerDid = agent.assertDid
      const {
        game: gameUri,
        previousMove: previousMoveUri,
        move,
        fen,
        timeRemaining,
        drawOffer,
        resignation,
      } = input.body

      // Get the game to validate move
      const game = await ctx.db
        .selectFrom('game')
        .selectAll()
        .where('uri', '=', gameUri)
        .executeTakeFirst()

      if (!game) {
        throw new InvalidRequestError('Game not found', 'GameNotFound')
      }

      // Check if game is active
      if (game.status !== 'active' && game.status !== 'pending') {
        throw new InvalidRequestError(
          'Game is not in an active state',
          'GameNotActive',
        )
      }

      // Check if it's the player's turn
      const isChallenger = playerDid === game.challenger
      const isChallenged = playerDid === game.challenged

      if (!isChallenger && !isChallenged) {
        throw new InvalidRequestError(
          'You are not a player in this game',
          'NotYourTurn',
        )
      }

      // Determine whose turn it is based on move count
      const whitePlayer = game.startsFirst
      const blackPlayer =
        whitePlayer === game.challenger ? game.challenged : game.challenger
      const isWhiteTurn = game.moveCount % 2 === 0
      const currentTurnPlayer = isWhiteTurn ? whitePlayer : blackPlayer

      if (playerDid !== currentTurnPlayer) {
        throw new InvalidRequestError(
          'It is not your turn to move',
          'NotYourTurn',
        )
      }

      // Validate previous move reference
      if (game.moveCount > 0 && !previousMoveUri) {
        throw new InvalidRequestError(
          'Previous move reference is required',
          'PreviousMoveRequired',
        )
      }

      if (previousMoveUri) {
        // Get the last move to validate the reference
        const lastMove = await ctx.db
          .selectFrom('move')
          .selectAll()
          .where('gameUri', '=', gameUri)
          .orderBy('moveNumber', 'desc')
          .limit(1)
          .executeTakeFirst()

        if (lastMove && lastMove.uri !== previousMoveUri) {
          throw new InvalidRequestError(
            'Previous move reference does not match the actual last move',
            'InvalidPreviousMove',
          )
        }
      }

      // TODO: Validate the chess move itself (would need a chess library)
      // For now, we'll trust the client to validate moves

      // Construct the move record
      const rkey = TID.nextStr()
      const record = {
        $type: 'com.atpchess.move',
        game: {
          uri: gameUri,
          cid: game.uri.split('/').pop()!, // Extract CID from URI
        },
        previousMove: previousMoveUri
          ? {
              uri: previousMoveUri,
              cid: previousMoveUri.split('/').pop()!,
            }
          : undefined,
        move,
        fen,
        timeRemaining,
        drawOffer: drawOffer || false,
        resignation: resignation || false,
        createdAt: new Date().toISOString(),
      }

      const validation = ComAtpchessMove.validateRecord(record)
      if (!validation.success) {
        throw new InvalidRequestError('Invalid move record')
      }

      try {
        // Create the move record in the player's repo
        const response = await agent.com.atproto.repo.putRecord({
          repo: playerDid,
          collection: 'com.atpchess.move',
          rkey,
          record: validation.value,
          validate: false,
        })

        // Store move in our database (will be picked up by firehose too)
        const moveUri = response.data.uri
        const moveNumber = game.moveCount + 1
        const now = new Date().toISOString()

        await ctx.db
          .insertInto('move')
          .values({
            uri: moveUri,
            gameUri,
            playerDid,
            move,
            fen,
            moveNumber,
            previousMoveUri,
            timeRemaining,
            drawOffer: drawOffer || false,
            resignation: resignation || false,
            createdAt: record.createdAt,
            indexedAt: now,
          })
          .execute()

        // Update game state
        const updates: any = {
          lastMoveAt: record.createdAt,
          moveCount: moveNumber,
          status: game.status === 'pending' ? 'active' : game.status,
          indexedAt: now,
        }

        // Check for game end conditions
        if (resignation) {
          updates.status = 'completed'
          updates.winner =
            playerDid === game.challenger ? game.challenged : game.challenger
          updates.result =
            playerDid === whitePlayer ? 'black-wins' : 'white-wins'
        }

        await ctx.db
          .updateTable('game')
          .set(updates)
          .where('uri', '=', gameUri)
          .execute()

        // Get the move from DB to return as view
        const createdMove = await ctx.db
          .selectFrom('move')
          .selectAll()
          .where('uri', '=', moveUri)
          .executeTakeFirst()

        if (!createdMove) {
          throw new UpstreamFailureError('Failed to create move')
        }

        const moveView = await moveToMoveView(createdMove, ctx)

        return {
          encoding: 'application/json',
          body: {
            move: moveView,
          },
        }
      } catch (err) {
        throw new UpstreamFailureError('Failed to create move', err)
      }
    },
  })
}
