import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MessageNotification {
  _id: string;
  name: string;
  email: string;
  message: string;
  reply: string;
  repliedAt: string;
  status: "new" | "read" | "replied";
}

const NotificationsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        setLoading(false);
        return;
      }

      // ✅ FIXED: Use the new customer notifications endpoint
      const response = await fetch("http://localhost:5000/api/contact/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const messages: MessageNotification[] = await response.json();
        setNotifications(messages);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.length;

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
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
                <h3 className="font-bold text-foreground">Admin Replies</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount} {unreadCount === 1 ? "reply" : "replies"}
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
                  <p>No replies yet</p>
                  <p className="text-xs mt-2">When admin replies to your message, you'll see it here</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border border-primary/50 bg-primary/10 transition-all hover:border-primary/80"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 flex-shrink-0">
                          <MessageCircle size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Your Original Message */}
                          <div className="mb-3">
                            <p className="font-semibold text-sm text-foreground mb-1">
                              Your Message
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded">
                              {notification.message}
                            </p>
                          </div>

                          {/* Admin Reply */}
                          <div>
                            <p className="font-semibold text-sm text-primary mb-1">
                              Admin Reply ✓
                            </p>
                            <p className="text-sm text-foreground line-clamp-3 bg-primary/5 p-2 rounded border-l-2 border-primary">
                              {notification.reply}
                            </p>
                          </div>

                          {/* Reply Date */}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.repliedAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDismiss(notification._id)}
                          className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="sticky bottom-0 bg-muted border-t border-border p-3 text-center">
                <button
                  onClick={() => {
                    setNotifications([]);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
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