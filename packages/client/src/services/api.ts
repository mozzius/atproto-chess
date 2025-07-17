import * as Lexicon from '@atpchess/lexicon'
import type {
  ComAtpchessCreateGame,
  ComAtpchessGetGames,
  ComAtpchessGetMoves,
  ComAtpchessMakeMove,
} from '@atpchess/lexicon'

class ChessAgent extends Lexicon.AtpBaseClient {
  constructor() {
    super(ChessAgent.fetchHandler)
  }

  private static fetchHandler: Lexicon.AtpBaseClient['fetchHandler'] = (
    path,
    options,
  ) => {
    return fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
  }
}

const agent = new ChessAgent()

// API service
export const api = {
  // Login
  async login(handle: string) {
    const response = await fetch('/oauth/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ handle }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    return response.json()
  },

  // Logout
  async logout() {
    const response = await fetch('/oauth/logout', {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    return response.json()
  },

  // Get current user
  async getCurrentUser() {
    const response = await fetch('/xrpc/com.atpchess.getCurrentUser', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get current user')
    }

    return response.json()
  },

  // Resolve handle to DID
  async resolveHandle(handle: string) {
    const response = await fetch(
      `/xrpc/com.atpchess.resolveHandle?${new URLSearchParams({ handle })}`,
      {
        method: 'GET',
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to resolve handle')
    }

    return response.json() as Promise<{ did: string; handle: string }>
  },

  // Get games
  getGames(params: ComAtpchessGetGames.QueryParams) {
    return agent.com.atpchess.getGames(params)
  },

  // Get moves for a game
  getMoves(params: ComAtpchessGetMoves.QueryParams) {
    return agent.com.atpchess.getMoves(params)
  },

  // Create a new game
  createGame(params: ComAtpchessCreateGame.InputSchema) {
    return agent.com.atpchess.createGame(params)
  },

  // Make a move
  makeMove(params: ComAtpchessMakeMove.InputSchema) {
    return agent.com.atpchess.makeMove(params)
  },
}

export default api
