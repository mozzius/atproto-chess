import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ComAtpchessDefs } from '@atpchess/lexicon'

import ChessBoard from '#/components/ChessBoard'
import Header from '#/components/Header'
import { useAuth } from '#/hooks/useAuth'
import api from '#/services/api'

const GamePage = () => {
  const { gameUri } = useParams<{ gameUri: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isConnectedToJetstream, setIsConnectedToJetstream] = useState(false)

  const decodedGameUri = gameUri ? decodeURIComponent(gameUri) : undefined

  // Fetch game data
  const { data: gameData, isLoading: gameLoading } = useQuery({
    queryKey: ['game', decodedGameUri],
    queryFn: () =>
      api.getGames({ limit: 1 }).then((res) => {
        const game = res.data.games.find((g) => g.uri === decodedGameUri)
        if (!game) throw new Error('Game not found')
        return game
      }),
    enabled: !!decodedGameUri,
  })

  // Fetch moves
  const { data: movesData, isLoading: movesLoading } = useQuery({
    queryKey: ['moves', decodedGameUri],
    queryFn: () => api.getMoves({ game: decodedGameUri! }),
    enabled: !!decodedGameUri,
    refetchInterval: 5000, // Poll for new moves
  })

  // Make move mutation
  const makeMoveMutation = useMutation({
    mutationFn: async ({ move, fen }: { move: string; fen: string }) => {
      if (!decodedGameUri || !user?.did) throw new Error('Invalid state')

      const moves = movesData?.data.moves || []
      const lastMove = moves[moves.length - 1]

      return api.makeMove({
        game: decodedGameUri,
        previousMove: lastMove?.uri,
        move,
        fen,
      })
    },
    onSuccess: () => {
      // Refetch moves
      queryClient.invalidateQueries({ queryKey: ['moves', decodedGameUri] })
      queryClient.invalidateQueries({ queryKey: ['game', decodedGameUri] })
    },
  })

  // Connect to Jetstream for real-time updates
  useEffect(() => {
    if (!gameData || !user?.did) return

    // TODO: Implement Jetstream connection
    // This would subscribe to move events from both players
    // For now, we're using polling via refetchInterval

    const connectToJetstream = async () => {
      try {
        // Placeholder for Jetstream connection
        console.log('Would connect to Jetstream for game:', decodedGameUri)
        setIsConnectedToJetstream(true)
      } catch (err) {
        console.error('Failed to connect to Jetstream:', err)
      }
    }

    connectToJetstream()

    return () => {
      // Cleanup Jetstream connection
      setIsConnectedToJetstream(false)
    }
  }, [gameData, user?.did, decodedGameUri])

  if (!decodedGameUri) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <Header />
        <div className="text-center py-16">
          <p className="text-red-500">Invalid game URL</p>
        </div>
      </div>
    )
  }

  if (gameLoading || movesLoading) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <Header />
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!gameData) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <Header />
        <div className="text-center py-16">
          <p className="text-red-500">Game not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-500 hover:underline"
          >
            Back to games
          </button>
        </div>
      </div>
    )
  }

  const moves = movesData?.data.moves || []
  const lastMove = moves[moves.length - 1]
  const currentFen =
    lastMove?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

  const isPlayer =
    user?.did === gameData.challenger.did ||
    user?.did === gameData.challenged.did
  const isWhite = user?.did === gameData.startsFirst
  const isWhiteTurn = (gameData.moveCount || 0) % 2 === 0
  const isMyTurn =
    isPlayer && isWhite === isWhiteTurn && gameData.status === 'active'

  const opponent =
    user?.did === gameData.challenger.did
      ? gameData.challenged
      : gameData.challenger

  const handleMove = async (move: string, fen: string) => {
    try {
      await makeMoveMutation.mutateAsync({ move, fen })
    } catch (err) {
      console.error('Failed to make move:', err)
    }
  }

  const renderMoveList = () => {
    const movePairs: Array<
      [ComAtpchessDefs.MoveView | null, ComAtpchessDefs.MoveView | null]
    > = []

    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push([moves[i] || null, moves[i + 1] || null])
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto">
        <h3 className="font-semibold mb-3">Moves</h3>
        <div className="space-y-1 text-sm">
          {movePairs.map(([white, black], idx) => (
            <div key={idx} className="flex">
              <span className="w-8 text-gray-500">{idx + 1}.</span>
              <span className="w-16">{white?.move || '...'}</span>
              <span className="w-16">{black?.move || ''}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <Header />

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-blue-500 hover:underline"
        >
          ← Back to games
        </button>

        {!isConnectedToJetstream && isPlayer && (
          <div className="text-yellow-600 text-sm">
            ⚠️ Using polling for updates (Jetstream not connected)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game info and board */}
        <div className="lg:col-span-2 space-y-6">
          {/* Players */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {opponent.handle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">@{opponent.handle}</p>
                  <p className="text-sm text-gray-500">
                    {isWhite ? 'Black' : 'White'}
                  </p>
                </div>
              </div>

              {gameData.status === 'completed' && gameData.winner && (
                <div className="text-sm">
                  {gameData.winner === user?.did ? (
                    <span className="text-green-600 font-medium">You won!</span>
                  ) : (
                    <span className="text-red-600 font-medium">You lost</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chess board */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex justify-center">
            <ChessBoard
              fen={currentFen}
              onMove={handleMove}
              isMyTurn={isMyTurn}
              orientation={isWhite ? 'white' : 'black'}
              disabled={
                !isPlayer ||
                gameData.status !== 'active' ||
                makeMoveMutation.isPending
              }
            />
          </div>

          {/* Current player */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  {user?.handle?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium">@{user?.handle || 'You'}</p>
                  <p className="text-sm text-gray-500">
                    {isWhite ? 'White' : 'Black'}
                  </p>
                </div>
              </div>

              {isMyTurn && (
                <div className="text-blue-600 font-medium animate-pulse">
                  Your turn
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Move list and game info */}
        <div className="space-y-6">
          {/* Game status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Game Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="capitalize">{gameData.status}</span>
              </div>
              {gameData.timeControl && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Control:</span>
                  <span>{gameData.timeControl}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Moves:</span>
                <span>{gameData.moveCount || 0}</span>
              </div>
              {gameData.rated && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-yellow-600">Rated</span>
                </div>
              )}
            </div>
          </div>

          {/* Move list */}
          {renderMoveList()}

          {/* Actions */}
          {isPlayer && gameData.status === 'active' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <button className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Offer Draw
              </button>
              <button className="w-full py-2 px-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                Resign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GamePage
