"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md animate-fade-up">
          <div className="space-y-2">
            <p className="text-6xl font-bold text-gray-800">Oops</p>
            <h1 className="text-2xl sm:text-3xl font-bold">Something went wrong</h1>
            <p className="text-gray-400 text-lg">
              An unexpected error occurred. Please try again.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              size="lg"
              onClick={reset}
              className="bg-white text-gray-950 hover:bg-gray-200 hover:text-gray-950"
            >
              Try Again
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="text-white border-gray-700 bg-gray-800 hover:bg-gray-700"
              >
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center py-6">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Hyr. Tech skills verification.
        </p>
      </footer>
    </div>
  )
}
