import { InvalidRequestError } from '@atproto/xrpc-server'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { gameToGameView, moveToMoveView } from '#/lib/hydrate'

export default function (server: Server, ctx: AppContext) {
  server.com.atpchess.getMoves({
    handler: async ({ params }) => {
      const { game: gameUri, limit = 50, cursor } = params

      // First, get the game to include in response
      const game = await ctx.db
        .selectFrom('game')
        .selectAll()
        .where('uri', '=', gameUri)
        .executeTakeFirst()

      if (!game) {
        throw new InvalidRequestError('Game not found')
      }

      // Build query for moves
      let query = ctx.db
        .selectFrom('move')
        .selectAll()
        .where('gameUri', '=', gameUri)
        .orderBy('moveNumber', 'asc')
        .limit(limit)

      // Apply cursor for pagination
      if (cursor) {
        const moveNumber = parseInt(cursor, 10)
        if (isNaN(moveNumber)) {
          throw new InvalidRequestError('Invalid cursor format')
        }
        query = query.where('moveNumber', '>', moveNumber)
      }

      const moves = await query.execute()

      // Hydrate move views with player profiles
      const moveViews = await Promise.all(
        moves.map((move) => moveToMoveView(move, ctx)),
      )

      // Hydrate game view
      const gameView = await gameToGameView(game, ctx)

      // Generate next cursor if we have a full page
      let nextCursor: string | undefined
      if (moves.length === limit) {
        const lastMove = moves[moves.length - 1]
        nextCursor = lastMove.moveNumber.toString()
      }

      return {
        encoding: 'application/json',
        body: {
          game: gameView,
          moves: moveViews,
          cursor: nextCursor,
        },
      }
    },
  })
}
