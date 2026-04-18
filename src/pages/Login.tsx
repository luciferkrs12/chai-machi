import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Store, Eye, EyeOff, Loader2 } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted');
    setError("");

    if (!email || !password) {
      console.warn('⚠️ Empty fields');
      setError("Please fill all fields");
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Calling login function...');
      const { error: loginError } = await login(email, password);
      if (loginError) {
        console.error('❌ Login error:', loginError);
        setError(loginError);
        setIsLoading(false);
        return;
      }

      console.log('✅ Login succeeded, waiting for auth state to settle...');
      // Auth state will be updated via context, route will handle navigation
    } catch (err) {
      console.error('❌ Exception:', err);
      setError(String(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-xl border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sri Vinayaga Bakes</h1>
            <p className="text-sm text-muted-foreground mt-1">Inventory & Sales Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-10"
                  placeholder="••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  disabled={isLoading}
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
