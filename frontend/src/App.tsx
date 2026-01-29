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
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminMessages from "./pages/admin/Messages";
import AdminSarees from "./pages/admin/Sarees";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminChat from "./pages/admin/AdminChat"; // ✅ NEW

import Payment from "@/pages/Payment";
   

const App = () => {
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
          <Route path="/payment" element={<Payment />} />

          {/* Protected Customer Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
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

          {/* ✅ NEW: Admin Chat Route */}
          <Route 
            path="/admin/chat" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminChat />
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

          {/* 404 - Always Last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;