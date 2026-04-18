import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";

interface Props {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const Layout: React.FC<Props> = ({ children, title, description }) => {
  const { logout, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const links = user?.role === "admin"
    ? [...baseLinks, { to: "/users", label: "Users", icon: Users }]
    : baseLinks;

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="w-64 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-[hsl(var(--sidebar-muted))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-[hsl(var(--sidebar-fg))]">Sri Vinayaga Bakes</h1>
              <p className="text-xs text-[hsl(var(--sidebar-fg))/0.5]">Tiruchengode</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-[hsl(var(--sidebar-fg))/0.7] hover:bg-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))]"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
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
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-card border-b flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              {userInitial}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
