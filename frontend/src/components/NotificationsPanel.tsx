import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle, AlertCircle, Info, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  _id: string;
  type: "payment_received" | "order_confirmed" | "payment_rejected" | "order_shipped" | "order_delivered" | "message_reply" | "general";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

const NotificationsPanel = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/payments/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `http://localhost:5000/api/payments/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        "http://localhost:5000/api/payments/notifications/clear",
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setNotifications([]);
        toast({
          title: "Cleared",
          description: "All notifications cleared",
        });
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Get icon based on notification type
  const getIcon = (type: string) => {
    switch(type) {
      case "order_confirmed":
        return <CheckCircle size={18} className="text-green-600" />;
      case "payment_rejected":
        return <AlertCircle size={18} className="text-red-600" />;
      case "payment_received":
        return <Info size={18} className="text-blue-600" />;
      default:
        return <Bell size={18} className="text-primary" />;
    }
  };

  // Get color based on notification type
  const getColor = (type: string) => {
    switch(type) {
      case "order_confirmed":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "payment_rejected":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "payment_received":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default:
        return "bg-primary/10 border-primary/50";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        title="View notifications"
      >
        <Bell size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0"
          >
            <Badge className="bg-red-500 text-white text-xs px-1.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          </motion.div>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"
                  />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-2">You'll see updates here</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border transition-all ${getColor(notification.type)} ${!notification.isRead ? "ring-2 ring-primary/30" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-foreground">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                          title="Delete"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="sticky bottom-0 bg-muted border-t border-border p-3 text-center">
                <button
                  onClick={handleClearAll}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPanel;