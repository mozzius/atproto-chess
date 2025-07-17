import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ComAtpchessDefs } from '@atpchess/lexicon'

import useAuth from '#/hooks/useAuth'
import api from '#/services/api'

const CreateGameForm = () => {
  const [handle, setHandle] = useState('')
  const [startsFirst, setStartsFirst] = useState<'me' | 'them'>('me')
  const [timeControl, setTimeControl] = useState('10+0')
  const [rated, setRated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { user } = useAuth()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.did) throw new Error('Not authenticated')
      if (!handle.trim()) throw new Error('Please enter a handle')

      // Convert handle to DID
      let challengedDid: string
      if (handle.startsWith('did:')) {
        challengedDid = handle
      } else {
        try {
          const resolved = await api.resolveHandle(handle)
          challengedDid = resolved.did
        } catch (err) {
          throw new Error(`Could not find user @${handle}`)
        }
      }

      return api.createGame({
        challenged: challengedDid,
        startsFirst: startsFirst === 'me' ? user.did : challengedDid,
        timeControl,
        rated,
      })
    },
    onSuccess: () => {
      // Reset form
      setHandle('')
      setStartsFirst('me')
      setError(null)

      // Invalidate games list
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to create game'
      setError(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mutation.isPending) return
    setError(null)
    mutation.mutate()
  }

  const timeControls = [
    { value: '1+0', label: 'Bullet (1+0)' },
    { value: '3+0', label: 'Blitz (3+0)' },
    { value: '3+2', label: 'Blitz (3+2)' },
    { value: '5+0', label: 'Blitz (5+0)' },
    { value: '10+0', label: 'Rapid (10+0)' },
    { value: '15+10', label: 'Rapid (15+10)' },
    { value: '30+0', label: 'Classical (30+0)' },
    { value: 'correspondence', label: 'Correspondence' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Challenge a Player</h2>

      {(error || mutation.error) && (
        <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-950 dark:bg-opacity-30 rounded-md">
          {error ||
            (mutation.error instanceof Error
              ? mutation.error.message
              : 'Failed to create game')}
        </div>
      )}

      {mutation.isSuccess && (
        <div className="text-green-600 mb-4 p-3 bg-green-50 dark:bg-green-950 dark:bg-opacity-30 rounded-md">
          Game created successfully! Your opponent will be notified.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="handle" className="block text-sm font-medium mb-2">
            Opponent's Handle
          </label>
          <input
            type="text"
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="alice.bsky.social"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={mutation.isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Who plays White (starts first)?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="me"
                checked={startsFirst === 'me'}
                onChange={(e) =>
                  setStartsFirst(e.target.value as 'me' | 'them')
                }
                className="mr-2"
                disabled={mutation.isPending}
              />
              <span>Me</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="them"
                checked={startsFirst === 'them'}
                onChange={(e) =>
                  setStartsFirst(e.target.value as 'me' | 'them')
                }
                className="mr-2"
                disabled={mutation.isPending}
              />
              <span>Them</span>
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="timeControl"
            className="block text-sm font-medium mb-2"
          >
            Time Control
          </label>
          <select
            id="timeControl"
            value={timeControl}
            onChange={(e) => setTimeControl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={mutation.isPending}
          >
            {timeControls.map((tc) => (
              <option key={tc.value} value={tc.value}>
                {tc.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rated}
              onChange={(e) => setRated(e.target.checked)}
              className="mr-2"
              disabled={mutation.isPending}
            />
            <span className="text-sm">Rated game</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !handle.trim()}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending ? 'Creating game...' : 'Send Challenge'}
        </button>
      </form>
    </div>
  )
}

export default CreateGameForm
