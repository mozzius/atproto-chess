import { InvalidRequestError } from '@atproto/xrpc-server'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { gameToGameView } from '#/lib/hydrate'
import { getSessionAgent } from '#/session'

export default function (server: Server, ctx: AppContext) {
  server.com.atpchess.getGames({
    handler: async ({ params, req, res }) => {
      const { player, status, limit = 50, cursor } = params

      // Build query
      let query = ctx.db
        .selectFrom('game')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)

      // Filter by player if provided
      if (player) {
        query = query.where((eb) =>
          eb.or([eb('challenger', '=', player), eb('challenged', '=', player)]),
        )
      }

      // Filter by status if provided
      if (status) {
        query = query.where('status', '=', status)
      }

      // Apply cursor for pagination
      if (cursor) {
        const [timestamp, uri] = cursor.split('::')
        if (!timestamp || !uri) {
          throw new InvalidRequestError('Invalid cursor format')
        }
        query = query.where((eb) =>
          eb.or([
            eb('createdAt', '<', timestamp),
            eb.and([eb('createdAt', '=', timestamp), eb('uri', '<', uri)]),
          ]),
        )
      }

      const games = await query.execute()

      // Hydrate game views with player profiles
      const gameViews = await Promise.all(
        games.map((game) => gameToGameView(game, ctx)),
      )

      // Generate next cursor if we have a full page
      let nextCursor: string | undefined
      if (games.length === limit) {
        const lastGame = games[games.length - 1]
        nextCursor = `${lastGame.createdAt}::${lastGame.uri}`
      }

      return {
        encoding: 'application/json',
        body: {
          games: gameViews,
          cursor: nextCursor,
        },
      }
    },
  })
}
