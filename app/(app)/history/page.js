'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'
import { useDataBroker } from '@/lib/hooks/useDataBroker'
import { useAuth } from '@/lib/contexts/AuthContext'

const UpgradeRequired = ({ planLabel }) => (
  <Card className="bg-white dark:bg-gray-800 shadow-sm">
    <CardContent className="py-10 text-center space-y-4">
      <History className="h-12 w-12 text-success-green mx-auto" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upgrade Required</h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Search history is available for paid plans. Your current plan ({planLabel || 'Free Plan'}) does not support history tracking.
      </p>
      <Button
        className="btn-nuclear mx-auto"
        onClick={() => window.open('https://whop.com/', '_blank', 'noopener,noreferrer')}
      >
        Upgrade on Whop
      </Button>
    </CardContent>
  </Card>
)

const SignInRequired = () => (
  <Card className="bg-white dark:bg-gray-800 shadow-sm">
    <CardContent className="py-10 text-center space-y-4">
      <History className="h-12 w-12 text-success-green mx-auto" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sign In Required</h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Please sign in with your Whop-connected account to view your saved search history.
      </p>
      <Button
        className="btn-nuclear mx-auto"
        onClick={() => window.dispatchEvent(new CustomEvent('openAuthDialog'))}
      >
        Sign In
      </Button>
    </CardContent>
  </Card>
)

export default function HistoryPage() {
  const { user, isPaidPlan, planLabel } = useAuth()
  const { searchHistory } = useDataBroker()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search History
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            View your previous searches and results.
          </p>
        </div>

        {!user && <SignInRequired />}

        {user && !isPaidPlan && <UpgradeRequired planLabel={planLabel} />}

        {user && isPaidPlan && (
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Search History
            </CardTitle>
            <CardDescription>
              Your previous searches and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchHistory.length > 0 ? (
              <div className="space-y-4">
                {searchHistory.map((search) => (
                  <div key={search.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{search.full_name}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(search.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {search.phone && `Phone: ${search.phone}`}
                      {search.phone && search.email && ' • '}
                      {search.email && `Email: ${search.email}`}
                    </p>
                    <p className="text-sm">
                      Found on {search.results?.length || 0} data broker sites
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No search history yet. Perform a search to see your history here.
              </p>
            )}
          </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
