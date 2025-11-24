'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { useDataBroker } from '@/lib/hooks/useDataBroker'

export default function RequestsPage() {
  const { removalRequests } = useDataBroker()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Removal Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            Track your data removal requests across data brokers.
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Removal Requests
            </CardTitle>
            <CardDescription>
              Track your data removal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {removalRequests.length > 0 ? (
              <div className="space-y-4">
                {removalRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{request.full_name}</h4>
                      <Badge variant={
                        request.status === 'completed' ? 'default' :
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {request.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Data Source: {request.data_sources?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        Notes: {request.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No removal requests yet. Submit a removal request from search results to track them here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
