import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Grid3X3,
  ClipboardList,
  Users,
  BarChart3,
  Package,
  LogOut,
  Store,
  Menu,
  X,
} from "lucide-react";

interface Props {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const Layout: React.FC<Props> = ({ children, title, description }) => {
  const { logout, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on outside click / Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await logout();
      if (error) {
        console.error("Logout error:", error);
      } else {
        navigate({ to: "/" });
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() || "U";
  const userRole = user?.role === "admin" ? "Admin" : "Staff";

  const baseLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Package },
    { to: "/orders", label: "Sales", icon: Grid3X3 },
    { to: "/tables", label: "Tables", icon: ClipboardList },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/customers", label: "Customers", icon: Users },
  ];

  const links =
    user?.role === "admin"
      ? [...baseLinks, { to: "/users", label: "Users", icon: Users }]
      : baseLinks;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-[hsl(var(--sidebar-muted))]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-[hsl(var(--sidebar-fg))]">
              Sri Vinayaga Bakes
            </h1>
            <p className="text-xs text-[hsl(var(--sidebar-fg))/0.5]">
              Tiruchengode
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-[hsl(var(--sidebar-fg))/0.7] hover:bg-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))]"
            activeProps={{
              className:
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground",
            }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-muted))]">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-[hsl(var(--sidebar-fg))/0.7] hover:bg-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Slide-in Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72
          bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]
          flex flex-col flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button inside mobile sidebar */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[hsl(var(--sidebar-fg))/0.7] hover:bg-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger – mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-foreground truncate">
                {title}
              </h2>
              {description && (
                <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">{children}</main>

        {/* Mobile Footer */}
        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex items-center justify-around px-4 py-3 z-40">
          <div className="flex items-center justify-around w-full max-w-md mx-auto gap-2">
            {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex-1"
                activeProps={{
                  className:
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-primary bg-primary/10 flex-1",
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
