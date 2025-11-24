'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { History } from 'lucide-react'
import { useDataBroker } from '@/lib/hooks/useDataBroker'

export default function HistoryPage() {
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
      </div>
    </div>
  )
}
