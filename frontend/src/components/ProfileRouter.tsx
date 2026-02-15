import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import CustomerProfile from "@/pages/Profile";
import AdminProfilePage  from "@/pages/admin/AdminProfile";

const ProfileRouter = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admins see admin profile (stats, recent orders)
  if (user?.role === "admin") {
    return <AdminProfilePage />;
  }

  // Regular users see shopping profile (cart, orders)
  return <CustomerProfile />;
};

export default ProfileRouter;