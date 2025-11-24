'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { useDataBroker } from '@/lib/hooks/useDataBroker'
import { useAuth } from '@/lib/contexts/AuthContext'

const UpgradeNotice = ({ planLabel }) => (
  <Card className="bg-white dark:bg-gray-800 shadow-sm">
    <CardContent className="py-10 text-center space-y-4">
      <FileText className="h-12 w-12 text-warning-yellow mx-auto" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upgrade Required</h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Removal request tracking is unlocked on paid Whop plans. Your current plan ({planLabel || 'Free Plan'}) does not include this feature.
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

const SignInNotice = () => (
  <Card className="bg-white dark:bg-gray-800 shadow-sm">
    <CardContent className="py-10 text-center space-y-4">
      <FileText className="h-12 w-12 text-warning-yellow mx-auto" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sign In Required</h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Please sign in to manage your Whop-linked removal requests.
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

export default function RequestsPage() {
  const { user, isPaidPlan, planLabel } = useAuth()
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

        {!user && <SignInNotice />}

        {user && !isPaidPlan && <UpgradeNotice planLabel={planLabel} />}

        {user && isPaidPlan && (
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
        )}
      </div>
    </div>
  )
}
