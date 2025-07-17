import { useState } from 'react'

import CreateGameForm from '#/components/CreateGameForm'
import GamesList from '#/components/GamesList'
import Header from '#/components/Header'
import { useAuth } from '#/hooks/useAuth'

const HomePage = () => {
  const { user, loading, error } = useAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'active'>('all')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-6xl animate-pulse">♟️</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Error
          </h2>
          <p className="text-red-500 mb-4">{error}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Try logging in again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <Header />

      {user && <CreateGameForm />}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Chess Games
          </h2>

          {user && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All Games
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'my'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                My Games
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Active Games
              </button>
            </div>
          )}
        </div>

        <GamesList
          filterPlayer={activeTab === 'my' && user ? user.did : undefined}
          filterStatus={activeTab === 'active' ? 'active' : undefined}
        />
      </div>
    </div>
  )
}

export default HomePage
