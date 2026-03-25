import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="mx-auto flex max-w-6xl w-full items-center px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Hyr
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <p className="text-7xl sm:text-8xl font-bold text-gray-800">404</p>
            <h1 className="text-2xl sm:text-3xl font-bold">Page not found</h1>
            <p className="text-gray-400 text-lg">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/">
              <Button
                size="lg"
                className="bg-white text-gray-950 hover:bg-gray-200 hover:text-gray-950"
              >
                Go Home
              </Button>
            </Link>
            <Link href="/assessment">
              <Button
                variant="outline"
                size="lg"
                className="text-white border-gray-700 bg-gray-800 hover:bg-gray-700"
              >
                Take Assessment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center py-6">
        <p className="text-xs text-gray-600">
          &copy; 2026 Hyr. DevOps skills verification.
        </p>
      </footer>
    </div>
  )
}
