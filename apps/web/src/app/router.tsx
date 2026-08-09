import { createBrowserRouter, Navigate } from "react-router-dom"
import { RootLayout } from "../components/layout/RootLayout"
import { DashboardPage } from "../features/dashboard/DashboardPage"
import { NotFoundPage } from "../components/common/NotFoundPage"
import { LoginPage } from "../features/auth/LoginPage"
import { RegisterPage } from "../features/auth/RegisterPage"
import { ProtectedRoute } from "../components/layout/ProtectedRoute"
import { SettingsPage } from "../features/settings/SettingsPage"
import { RepositoriesPage } from "../features/repositories/RepositoriesPage"
import { RepositoryDetailsPage } from "../features/repositories/RepositoryDetailsPage"

/**
 * Application router — Phase 1
 *
 * Only the Dashboard (application shell) is active.
 * Auth routes, repository routes, etc. are added in Phases 2–4.
 */
export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "repositories", element: <RepositoriesPage /> },
          { path: "repositories/:owner/:repo", element: <RepositoryDetailsPage /> },
        ]
      }
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
