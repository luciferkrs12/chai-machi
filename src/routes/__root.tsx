import { createRootRoute, Outlet } from '@tanstack/react-router'

function RootLayout() {
  return <Outlet />
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-gray-700 font-medium mb-2">Page Not Found</p>
        <p className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist</p>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Try these routes:</p>
          <ul className="text-sm text-blue-600 space-y-1">
            <li><a href="/inventory" className="hover:underline">/inventory</a></li>
            <li><a href="/sales" className="hover:underline">/sales</a></li>
            <li><a href="/" className="hover:underline">/</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})