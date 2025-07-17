import { InvalidRequestError } from '@atproto/xrpc-server'
import { Request, Response } from 'express'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { getSessionAgent } from '#/session'

export default function (server: Server, ctx: AppContext) {
  // Add a custom endpoint for getting the current user
  server.app.get(
    '/xrpc/com.atpchess.getCurrentUser',
    async (req: Request, res: Response) => {
      try {
        const agent = await getSessionAgent(req, res, ctx)
        if (!agent) {
          res.status(401).json({
            error: 'AuthenticationRequired',
            message: 'Authentication required',
          })
          return
        }

        const did = agent.assertDid

        // Try to resolve the handle
        let handle = did
        let displayName: string | undefined
        let avatar: string | undefined

        try {
          // Resolve DID to handle
          const resolvedHandle = await ctx.resolver.resolveDidToHandle(did)
          if (resolvedHandle && !resolvedHandle.startsWith('did:')) {
            handle = resolvedHandle
          }

          // Try to get profile if available
          const profileResponse = await agent.com.atproto.repo
            .getRecord({
              repo: did,
              collection: 'app.bsky.actor.profile',
              rkey: 'self',
            })
            .catch(() => null)

          if (profileResponse?.data.value) {
            const profile = profileResponse.data.value as any
            displayName = profile.displayName
            if (profile.avatar?.ref?.$link) {
              avatar = `https://atproto.pictures/img/${did}/${profile.avatar.ref.$link}`
            }
          }
        } catch (err) {
          ctx.logger.warn({ err, did }, 'Failed to get user details')
        }

        res.json({
          did,
          handle,
          displayName,
          avatar,
        })
      } catch (err) {
        ctx.logger.error({ err }, 'getCurrentUser failed')
        res.status(500).json({
          error: 'InternalServerError',
          message: 'Failed to get current user',
        })
      }
    },
  )
}
