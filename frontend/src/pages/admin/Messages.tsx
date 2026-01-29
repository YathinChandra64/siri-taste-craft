import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Reply, Trash2, Eye, AlertCircle, CheckCircle, Bell } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useToast } from "@/hooks/use-toast";

type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied";
  reply?: string;
  repliedAt?: string;
  createdAt: string;
};

const AdminMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchMessages();
      fetchUnreadCount();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/contact", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/contact/notification/unread-count?role=admin", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please type a reply message",
        variant: "destructive",
      });
      return;
    }

    setIsReplying(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/api/contact/${messageId}/reply`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reply: replyText })
        }
      );

      if (response.ok) {
        toast({
          title: "Reply Sent! ✅",
          description: "Customer notification sent",
        });
        setReplyText("");
        setSelectedMessage(null);
        fetchMessages();
      } else {
        throw new Error("Failed to send reply");
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/contact/${messageId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Message has been deleted",
        });
        fetchMessages();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleSelectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplyText("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-500/20 text-yellow-700";
      case "read":
        return "bg-blue-500/20 text-blue-700";
      case "replied":
        return "bg-green-500/20 text-green-700";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const newMessagesCount = messages.filter(m => m.status === "new").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header with Notification Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Customer Messages</h1>
            <p className="text-slate-400">Manage and reply to customer inquiries</p>
          </div>
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <span className="font-semibold">{unreadCount} New Notification{unreadCount !== 1 ? 's' : ''}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No messages yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectMessage(message)}
                    className={`cursor-pointer transition-all ${
                      selectedMessage?._id === message._id
                        ? "ring-2 ring-purple-600"
                        : ""
                    }`}
                  >
                    <Card className={`bg-slate-800 border-slate-700 p-4 hover:border-purple-600/50 transition-all ${
                      message.status === "new" ? "border-yellow-500/50" : ""
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold">{message.name}</h3>
                            <Badge className={getStatusColor(message.status)}>
                              {message.status.toUpperCase()}
                            </Badge>
                            {message.status === "new" && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              </motion.div>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-2">{message.email}</p>
                          <p className="text-slate-300 line-clamp-2">{message.message}</p>
                          <p className="text-slate-500 text-xs mt-2">{formatDate(message.createdAt)}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Message Detail and Reply */}
          <div>
            {selectedMessage ? (
              <motion.div
                key={selectedMessage._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4 sticky top-4"
              >
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-white font-bold mb-4">Message Details</h3>

                  {/* Message Info */}
                  <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
                    <div>
                      <p className="text-slate-400 text-sm">From</p>
                      <p className="text-white">{selectedMessage.name}</p>
                      <p className="text-slate-400 text-sm">{selectedMessage.email}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm">Date</p>
                      <p className="text-white">{formatDate(selectedMessage.createdAt)}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm">Status</p>
                      <Badge className={getStatusColor(selectedMessage.status)}>
                        {selectedMessage.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Original Message */}
                  <div className="mb-6 pb-6 border-b border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Message</p>
                    <p className="text-slate-300 bg-slate-700/50 p-3 rounded">
                      {selectedMessage.message}
                    </p>
                  </div>

                  {/* Existing Reply */}
                  {selectedMessage.reply && (
                    <div className="mb-6 pb-6 border-b border-slate-700 bg-green-500/10 p-4 rounded">
                      <p className="text-green-400 text-sm mb-2">Your Reply</p>
                      <p className="text-slate-300">{selectedMessage.reply}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        Sent: {formatDate(selectedMessage.repliedAt || "")}
                      </p>
                    </div>
                  )}

                  {/* Reply Form */}
                  {selectedMessage.status !== "replied" && (
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={4}
                        className="w-full bg-slate-700 text-white placeholder-slate-500 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      <Button
                        onClick={() => handleReply(selectedMessage._id)}
                        disabled={isReplying || !replyText.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        <Reply className="w-4 h-4" />
                        {isReplying ? "Sending..." : "Send Reply"}
                      </Button>
                    </div>
                  )}

                  {/* Delete Button */}
                  <Button
                    onClick={() => handleDelete(selectedMessage._id)}
                    variant="destructive"
                    className="w-full mt-3 gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Message
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-6 text-center">
                <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a message to view details</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;