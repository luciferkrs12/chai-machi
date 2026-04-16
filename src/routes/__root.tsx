import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  Package,
  Users,
  Menu,
  X,
  LogOut,
  Bell,
  Search
} from "lucide-react";
import { useState } from "react";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-slate-800">Page not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-[1.02]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

const navItems = [
  { to: "/" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/tables" as const, label: "Tables", icon: UtensilsCrossed },
  { to: "/orders" as const, label: "Orders", icon: ClipboardList },
  { to: "/customers" as const, label: "Customers", icon: Users },
  { to: "/reports" as const, label: "Reports", icon: BarChart3 },
  { to: "/products" as const, label: "Products", icon: Package },
];

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Chai Machi - POS App" },
      { name: "description", content: "Modern bakery billing and order management system" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

// Sidebar component
function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300">
      {/* Logo Section */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <span className="text-xl leading-none">☕</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Chai Machi</h1>
            <p className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase">POS System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClose}
            activeProps={{
              className: "bg-indigo-600/10 text-indigo-400 font-semibold",
            }}
            inactiveProps={{
              className: "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
            }}
            activeOptions={{ exact: item.to === "/" }}
            className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all relative overflow-hidden"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" 
                  />
                )}
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="flex-1 relative z-10">{item.label}</span>
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout at bottom */}
      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800/80 hover:text-red-400 transition-colors">
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full bg-[#f8fafc] font-sans">
        
        {/* Desktop Sidebar - Now in standard flow to naturally take up space without ML/PL hacks */}
        <aside className="hidden lg:flex w-64 flex-col flex-shrink-0 h-screen sticky top-0 z-20 shadow-xl shadow-slate-900/5">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl"
              >
                <div className="absolute right-4 top-4 z-50">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <SidebarContent onClose={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
          
          {/* Top Header */}
          <header className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
            <div className="bg-white px-4 sm:px-6 py-3 shadow-sm flex justify-between items-center rounded-2xl border border-slate-200/60">
              <div className="flex items-center gap-4 w-full max-w-sm">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                
                {/* Search Bar */}
                <div className="hidden sm:flex items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 flex-1 transition-colors focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
                  <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search orders, tables..." 
                    className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 pl-4 shrink-0">
                <button className="relative p-2.5 text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 rounded-full border border-slate-200/60">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-slate-50 shadow-sm"></span>
                </button>
                
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all">
                  CM
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
