import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0d0d14]">
      <p className="text-6xl font-bold text-white/10">404</p>
      <p className="text-lg font-medium text-white">Page not found</p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
