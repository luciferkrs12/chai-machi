import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../lib/supabase";
import {
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  getCurrentUser,
  onAuthStateChange,
} from "../lib/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (
    email: string,
    password: string,
    name: string,
    role?: "admin" | "staff"
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser || null);
        console.log('✅ Auth initialized:', currentUser ? 'user found' : 'no user');
      } catch (err) {
        console.error('Auth init error:', err);
        setUser(null);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((updatedUser) => {
      console.log('📡 Auth state changed:', updatedUser ? 'user set' : 'user cleared');
      setUser(updatedUser);
      setIsLoading(false);
    });

    return () => unsubscribe?.();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      console.log('🔐 Login attempt started');
      const { user: loggedInUser, error } = await supabaseSignIn(email, password);
      if (error) {
        console.error('❌ Login failed:', error);
        return { error };
      }

      if (loggedInUser && loggedInUser.role !== "admin") {
        console.warn('⚠️ Non-admin login blocked');
        return { error: "Access restricted to admin users only." };
      }

      console.log('✅ Login successful, setting user...');
      setUser(loggedInUser);
      return { error: null };
    } catch (err) {
      console.error('❌ Login exception:', err);
      return { error: String(err) };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role?: "admin" | "staff"
  ): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      const { user: newUser, error } = await supabaseSignUp(email, password, name, role);
      if (error) {
        return { error };
      }
      setUser(newUser);
      return { error: null };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      const { error } = await supabaseSignOut();
      if (error) {
        return { error };
      }
      setUser(null);
      return { error: null };
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isAuthenticated = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        isAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
