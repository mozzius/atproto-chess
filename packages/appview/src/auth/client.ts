import { NodeOAuthClient } from '@atproto/oauth-client-node'

import type { Database } from '#/db'
import { env } from '#/lib/env'
import { SessionStore, StateStore } from './storage'

export const createClient = async (db: Database) => {
  if (env.isProduction && !env.PUBLIC_URL) {
    throw new Error('PUBLIC_URL is not set')
  }

  const publicUrl = env.PUBLIC_URL
  const url = publicUrl || `http://127.0.0.1:${env.VITE_PORT}`
  const enc = encodeURIComponent

  return new NodeOAuthClient({
    clientMetadata: {
      client_name: 'ATProto Chess',
      client_id: publicUrl
        ? `${url}/oauth-client-metadata.json`
        : `http://localhost?redirect_uri=${enc(`${url}/oauth/callback`)}&scope=${enc('atproto transition:generic')}`,
      client_uri: url,
      redirect_uris: [`${url}/oauth/callback`],
      scope: 'atproto transition:generic',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'none',
      dpop_bound_access_tokens: true,
    },
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
  })
}
