import { isValidHandle } from '@atproto/syntax'
import { InvalidRequestError } from '@atproto/xrpc-server'
import { Request, Response } from 'express'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'

export default function (server: Server, ctx: AppContext) {
  // Add a custom endpoint for resolving handles to DIDs
  server.app.get(
    '/xrpc/com.atpchess.resolveHandle',
    async (req: Request, res: Response) => {
      try {
        const handle = req.query.handle as string

        if (!handle || typeof handle !== 'string') {
          res.status(400).json({
            error: 'InvalidRequest',
            message: 'Handle parameter is required',
          })
          return
        }

        if (!isValidHandle(handle)) {
          res.status(400).json({
            error: 'InvalidRequest',
            message: 'Invalid handle format',
          })
          return
        }

        try {
          // Resolve handle to DID
          const did = await ctx.idResolver.handle.resolve(handle)

          if (!did) {
            res.status(404).json({
              error: 'NotFound',
              message: 'Handle not found',
            })
            return
          }

          res.json({
            did,
            handle,
          })
        } catch (err) {
          ctx.logger.warn({ err, handle }, 'Failed to resolve handle')
          res.status(404).json({
            error: 'NotFound',
            message: 'Handle not found',
          })
        }
      } catch (err) {
        ctx.logger.error({ err }, 'resolveHandle failed')
        res.status(500).json({
          error: 'InternalServerError',
          message: 'Failed to resolve handle',
        })
      }
    },
  )
}
