import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import OurStory from "./pages/OurStory";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Sarees from "./pages/Sarees";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerMessages from "./pages/CustomerMessages";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminMessages from "./pages/admin/Messages";
import AdminSarees from "./pages/admin/Sarees";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import Checkout from "@/components/Checkout";
import { useCart } from "@/hooks/useCart";  // ✅ ADDED: Import cart hook

const App = () => {
  const { cart } = useCart();  // ✅ ADDED: Get cart data from hook

  // ✅ ADDED: Prepare cart items in correct format
  const cartItems = cart?.items || [];
  const totalAmount = cart?.total || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <Sonner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sarees" element={<Sarees />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Customer Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/payment" 
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } 
          />

          {/* ✅ ADDED: Checkout Route */}
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout cartItems={cartItems} totalAmount={totalAmount} />
              </ProtectedRoute>
            } 
          />

          {/* ✅ Customer Messages Route */}
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <CustomerMessages />
              </ProtectedRoute>
            } 
          />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/messages" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMessages />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/sarees" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSarees />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/payments" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPayments />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/profile" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProfile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/products" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProducts />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/orders" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminOrders />
              </ProtectedRoute>
            } 
          />

          {/* 404 - Always Last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;