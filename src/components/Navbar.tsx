import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Sarees", path: "/sarees" },
    { name: "Pickles", path: "/pickles" },
    { name: "Our Story", path: "/our-story" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img src={logo} alt="Siri Collections & Pickles" className="h-10 w-10 object-contain" />
              <div className="text-lg md:text-xl font-bold">
                <span className="bg-gradient-saree bg-clip-text text-transparent">
                  Siri Collections
                </span>
                <span className="text-foreground"> & </span>
                <span className="bg-gradient-pickle bg-clip-text text-transparent">
                  Pickles
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <motion.span
                  className={`font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {link.name}
                </motion.span>
              </Link>
            ))}
            
            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
                  <User size={16} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">{user?.name}</span>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-gradient-saree text-white gap-2"
                >
                  <LogIn size={16} />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden py-4 border-t border-border"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
              >
                <div
                  className={`py-3 px-4 rounded-md transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {link.name}
                </div>
              </Link>
            ))}
            
            {/* Mobile Auth */}
            <div className="mt-4 px-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10">
                    <User size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{user?.name}</span>
                  </div>
                  <Button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="default"
                    className="w-full bg-gradient-saree text-white gap-2"
                  >
                    <LogIn size={16} />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
