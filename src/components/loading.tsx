export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-lg bg-gray-950 text-white flex items-center justify-center text-lg font-bold animate-breathe">
          H
        </div>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="animate-pulse space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
        </div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
