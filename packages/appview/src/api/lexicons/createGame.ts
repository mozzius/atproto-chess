import { ComAtpchessGame } from '@atpchess/lexicon'
import { TID } from '@atproto/common'
import {
  AuthRequiredError,
  InvalidRequestError,
  UpstreamFailureError,
} from '@atproto/xrpc-server'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { gameToGameView } from '#/lib/hydrate'
import { getSessionAgent } from '#/session'

export default function (server: Server, ctx: AppContext) {
  server.com.atpchess.createGame({
    handler: async ({ input, req, res }) => {
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        throw new AuthRequiredError('Authentication required')
      }

      const challengerDid = agent.assertDid
      const {
        challenged: challengedDid,
        startsFirst,
        timeControl,
        rated,
      } = input.body

      // Validate that user isn't challenging themselves
      if (challengerDid === challengedDid) {
        throw new InvalidRequestError(
          'Cannot challenge yourself to a game',
          'ChallengeSelf',
        )
      }

      // Validate that startsFirst is either the challenger or challenged
      if (startsFirst !== challengerDid && startsFirst !== challengedDid) {
        throw new InvalidRequestError(
          'Starting player must be either the challenger or challenged player',
          'InvalidPlayer',
        )
      }

      // TODO: Validate that challenged DID exists and is a valid user

      // Construct the game record
      const rkey = TID.nextStr()
      const record = {
        $type: 'com.atpchess.game',
        challenger: challengerDid,
        challenged: challengedDid,
        startsFirst,
        timeControl,
        rated: rated || false,
        createdAt: new Date().toISOString(),
      }

      const validation = ComAtpchessGame.validateRecord(record)
      if (!validation.success) {
        throw new InvalidRequestError('Invalid game record')
      }

      try {
        // Create the game record in the user's repo
        const response = await agent.com.atproto.repo.putRecord({
          repo: challengerDid,
          collection: 'com.atpchess.game',
          rkey,
          record: validation.value,
          validate: false,
        })

        // Store game in our database (will be picked up by firehose too)
        const gameUri = response.data.uri
        const now = new Date().toISOString()

        await ctx.db
          .insertInto('game')
          .values({
            uri: gameUri,
            challenger: challengerDid,
            challenged: challengedDid,
            startsFirst,
            status: 'pending',
            timeControl,
            rated: rated || false,
            createdAt: record.createdAt,
            indexedAt: now,
            moveCount: 0,
          })
          .execute()

        // Get the game from DB to return as view
        const game = await ctx.db
          .selectFrom('game')
          .selectAll()
          .where('uri', '=', gameUri)
          .executeTakeFirst()

        if (!game) {
          throw new UpstreamFailureError('Failed to create game')
        }

        const gameView = await gameToGameView(game, ctx)

        return {
          encoding: 'application/json',
          body: {
            game: gameView,
          },
        }
      } catch (err) {
        throw new UpstreamFailureError('Failed to create game', err)
      }
    },
  })
}
