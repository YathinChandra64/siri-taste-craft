import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  MessageSquare,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      label: "Manage Users",
      icon: Users,
      path: "/admin/users",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      label: "Manage Sarees",
      icon: ShoppingBag,
      path: "/admin/sarees",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      path: "/admin/messages",
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900",
    },
    {
      label: "Admin Profile",
      icon: Settings,
      path: "/admin/profile",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Menu Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
      >
        <Settings size={20} />
        <span className="font-semibold">Admin Menu</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl z-50"
          >
            <div className="p-2">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-bold text-foreground">Admin Controls</h3>
                <p className="text-xs text-muted-foreground">
                  Manage your store and users
                </p>
              </div>

              {/* Menu Items */}
              <div className="space-y-1 p-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors duration-200"
                    >
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <Icon size={18} className={item.color} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm text-foreground">
                          {item.label}
                        </p>
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground rotate-180" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Admin Dashboard v1.0
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMenu;