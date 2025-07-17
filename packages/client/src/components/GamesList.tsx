import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ComAtpchessDefs } from '@atpchess/lexicon'

import { useAuth } from '#/hooks/useAuth'
import api from '#/services/api'

interface GamesListProps {
  filterPlayer?: string
  filterStatus?: 'pending' | 'active' | 'completed' | 'abandoned'
}

const GamesList = ({ filterPlayer, filterStatus }: GamesListProps) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentUserDid = user?.did

  const { data, isLoading, error } = useQuery({
    queryKey: ['games', filterPlayer, filterStatus],
    queryFn: () => api.getGames({ player: filterPlayer, status: filterStatus }),
    refetchInterval: filterStatus === 'active' ? 5000 : 30000, // Poll more frequently for active games
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error instanceof Error ? error.message : 'Failed to load games'}
      </div>
    )
  }

  const games = data?.data.games || []

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No games found
      </div>
    )
  }

  const getGameStatus = (game: ComAtpchessDefs.GameView) => {
    if (game.status === 'completed') {
      if (game.result === 'draw' || game.result === 'stalemate') {
        return { text: 'Draw', color: 'text-gray-600 dark:text-gray-400' }
      }
      if (game.winner === currentUserDid) {
        return { text: 'Won', color: 'text-green-600 dark:text-green-400' }
      }
      if (game.winner) {
        return { text: 'Lost', color: 'text-red-600 dark:text-red-400' }
      }
    }

    if (game.status === 'abandoned') {
      return { text: 'Abandoned', color: 'text-gray-500 dark:text-gray-500' }
    }

    if (game.status === 'pending') {
      return { text: 'Pending', color: 'text-yellow-600 dark:text-yellow-400' }
    }

    // Active game - check whose turn
    if (game.status === 'active' && currentUserDid) {
      const isWhite = game.startsFirst === currentUserDid
      const isWhiteTurn = (game.moveCount || 0) % 2 === 0
      const isMyTurn = isWhite === isWhiteTurn

      return {
        text: isMyTurn ? 'Your turn' : 'Their turn',
        color: isMyTurn
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400',
      }
    }

    return { text: 'Active', color: 'text-blue-600 dark:text-blue-400' }
  }

  const getOpponent = (game: ComAtpchessDefs.GameView) => {
    if (currentUserDid === game.challenger.did) {
      return game.challenged
    }
    return game.challenger
  }

  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return ''
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      if (seconds < 60) return 'just now'
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
      return `${Math.floor(seconds / 604800)}w ago`
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const opponent = getOpponent(game)
        const status = getGameStatus(game)
        const isUserWhite = game.startsFirst === currentUserDid

        return (
          <div
            key={game.uri}
            onClick={() => navigate(`/game/${encodeURIComponent(game.uri)}`)}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      {opponent.handle.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {game.status === 'active' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      @{opponent.handle}
                    </h3>
                    {currentUserDid && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {isUserWhite ? 'White' : 'Black'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={status.color}>{status.text}</span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {game.lastMoveAt
                        ? `Last move ${getTimeAgo(game.lastMoveAt)}`
                        : `Started ${getTimeAgo(game.createdAt)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {game.timeControl && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {game.timeControl}
                  </span>
                )}
                {game.rated && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                    Rated
                  </span>
                )}
                <span className="font-medium">{game.moveCount || 0} moves</span>
              </div>
            </div>
          </div>
        )
      })}

      {data?.data.cursor && (
        <div className="text-center py-4">
          <button className="text-blue-500 hover:underline">
            Load more games
          </button>
        </div>
      )}
    </div>
  )
}

export default GamesList
