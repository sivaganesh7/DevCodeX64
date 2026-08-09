import { createBrowserRouter, Navigate } from "react-router-dom"
import { RootLayout } from "../components/layout/RootLayout"
import { DashboardPage } from "../features/dashboard/DashboardPage"
import { NotFoundPage } from "../components/common/NotFoundPage"

/**
 * Application router — Phase 1
 *
 * Only the Dashboard (application shell) is active.
 * Auth routes, repository routes, etc. are added in Phases 2–4.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
