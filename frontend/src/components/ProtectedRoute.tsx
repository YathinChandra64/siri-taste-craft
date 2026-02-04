import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: "admin" | "customer";
};

export const ProtectedRoute = ({
  children,
  requiredRole = "customer",
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // ✅ 1. Wait for auth check to finish
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // ✅ 2. Not logged in → redirect (NO reload)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ 3. Logged in but wrong role
  if (requiredRole === "admin" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need admin privileges to access this page
          </p>

          {/* ✅ FIXED: Router-safe navigation */}
          <Link to="/" className="text-primary hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  // ✅ 4. Authorized → render page
  return <>{children}</>;
};
