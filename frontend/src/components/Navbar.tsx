import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogIn, LogOut, User, Sun, Moon, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Fixed import
import { useTheme } from "@/contexts/ThemeContext"; // ✅ FIXED: Import from ThemeContext.tsx
import { Button } from "@/components/ui/button";
import MagneticButton from "@/components/MagneticButton";
import logo from "@/assets/logo.png";
import AdminMenu from "@/components/AdminMenu";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ Added useNavigate
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Sarees", path: "/sarees" },
    { name: "Our Story", path: "/our-story" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <MagneticButton>
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <motion.img 
                  src={logo} 
                  alt="Siri Sarees and Collections" 
                  className="h-10 w-10 object-contain"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="text-lg md:text-xl font-bold flex items-center gap-1">
                  <motion.span 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400"
                    style={{ 
                      WebkitTextStroke: '0.5px rgba(139, 92, 246, 0.3)',
                      textShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Siri Sarees
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <Sparkles size={14} className="text-yellow-500 dark:text-yellow-400" />
                  </motion.span>
                  <motion.span 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400"
                    style={{ 
                      WebkitTextStroke: '0.5px rgba(139, 92, 246, 0.3)',
                      textShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                    }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Collections
                  </motion.span>
                </div>
              </motion.div>
            </MagneticButton>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link, index) => (
              <Link key={link.path} to={link.path}>
                <motion.span
                  className={`font-medium transition-colors relative cursor-pointer ${
                    isActive(link.path)
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.span>
              </Link>
            ))}

            {/* Admin Menu - Only show to admins */}
            {user?.role === "admin" && (
              <>
                <div className="w-px h-6 bg-border" />
                <AdminMenu />
              </>
            )}
            
            {/* Theme Toggle */}
            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
            </motion.div>
            
            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* ✅ FIXED: Use onClick with navigate instead of Link wrapping Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors duration-200 border border-purple-200 dark:border-purple-800"
                >
                  <User size={16} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</span>
                  {user?.role === "admin" && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold">
                      ADMIN
                    </span>
                  )}
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </Button>
                </motion.div>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 shadow-lg"
                >
                  <LogIn size={16} />
                  Login
                </Button>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-gray-700 dark:text-gray-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-gray-200 dark:border-slate-800 py-4 space-y-2 bg-white dark:bg-slate-900"
          >
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}>
                <motion.div
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  }`}
                >
                  {link.name}
                </motion.div>
              </Link>
            ))}

            {/* Mobile Admin Links */}
            {user?.role === "admin" && (
              <>
                <div className="h-px bg-gray-200 dark:bg-slate-800 my-2" />
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 px-4 py-2">
                  Admin Menu
                </div>
                <motion.div
                  onClick={() => {
                    navigate("/admin/dashboard");
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors"
                >
                  Dashboard
                </motion.div>
                <motion.div
                  onClick={() => {
                    navigate("/admin/users");
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors"
                >
                  Users
                </motion.div>
                <motion.div
                  onClick={() => {
                    navigate("/admin/sarees");
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors"
                >
                  Sarees
                </motion.div>
                <motion.div
                  onClick={() => {
                    navigate("/admin/messages");
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors"
                >
                  Messages
                </motion.div>
                <motion.div
                  onClick={() => {
                    navigate("/admin/payments");
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors"
                >
                  Payments
                </motion.div>
              </>
            )}

            {/* Mobile Auth */}
            <div className="h-px bg-gray-200 dark:bg-slate-800 my-2" />
            {isAuthenticated ? (
              <div className="space-y-2">
                <motion.div
                  onClick={() => {
                    navigate("/profile");
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <User size={16} />
                  Profile
                </motion.div>
                <Button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  navigate("/login");
                  setIsOpen(false);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
              >
                <LogIn size={16} />
                Login
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;