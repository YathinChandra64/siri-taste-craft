import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogIn, LogOut, User, Sun, Moon, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import MagneticButton from "@/components/MagneticButton";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Sarees", path: "/sarees" },
    { name: "Sweets", path: "/sweets" },
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
            <MagneticButton>
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <motion.img 
                  src={logo} 
                  alt="Vasthram & Madhuram" 
                  className="h-10 w-10 object-contain"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="text-lg md:text-xl font-bold flex items-center gap-1">
                  <motion.span 
                    className="bg-gradient-saree bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Vasthram
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <Sparkles size={14} className="text-accent-gold" />
                  </motion.span>
                  <motion.span 
                    className="bg-gradient-sweet bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Madhuram
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
                  className={`font-medium transition-colors relative ${
                    isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
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
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-saree rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.span>
              </Link>
            ))}
            
            {/* Theme Toggle */}
            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
            </motion.div>
            
            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors duration-200"
                  >
                    <User size={16} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{user?.name}</span>
                  </motion.div>
                </Link>
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
              <Link to="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-saree text-white gap-2"
                  >
                    <LogIn size={16} />
                    Login
                  </Button>
                </motion.div>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{
            height: isOpen ? "auto" : 0,
            opacity: isOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 border-t border-border">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
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
              </motion.div>
            ))}
            
            {/* Mobile Auth */}
            <div className="mt-4 px-4 space-y-3">
              {/* Theme Toggle */}
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="w-full gap-2 justify-start"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </Button>

              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors duration-200">
                      <User size={18} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">{user?.name}</span>
                    </div>
                  </Link>
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
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar;
