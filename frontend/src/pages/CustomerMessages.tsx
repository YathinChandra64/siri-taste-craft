import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useNavigate } from "react-router-dom";

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied";
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

const CustomerMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login");
      return;
    }

    fetchMessages();
  }, [user, navigate]);

  const fetchMessages = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      
      const response = await fetch("http://localhost:5000/api/contact/customer/messages", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        console.log("✅ Messages loaded:", data.length);
      } else if (response.status === 401) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to load your messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "read":
        return <Mail className="w-5 h-5 text-blue-500" />;
      case "replied":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-yellow-500/20 text-yellow-700">New</Badge>;
      case "read":
        return <Badge className="bg-blue-500/20 text-blue-700">Read</Badge>;
      case "replied":
        return <Badge className="bg-green-500/20 text-green-700">Replied</Badge>;
      default:
        return <Badge>Unknown</Badge>;
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">My Messages</h1>
          <p className="text-slate-400">View your inquiries and admin replies</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">You haven't sent any messages yet</p>
              <Button
                onClick={() => navigate("/contact")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Send a Message
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800 border-slate-700 hover:border-purple-600/50 transition-all">
                  {/* Message Header */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === message._id ? null : message._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                          {getStatusIcon(message.status)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-semibold">Message #{message._id.slice(-6)}</h3>
                            {getStatusBadge(message.status)}
                          </div>
                          
                          <p className="text-slate-400 text-sm mb-2">
                            {formatDate(message.createdAt)}
                          </p>
                          
                          <p className="text-slate-300 line-clamp-2">
                            {message.message}
                          </p>
                        </div>
                      </div>
                      
                      <motion.div
                        animate={{ rotate: expandedId === message._id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === message._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-700 p-6 space-y-4"
                    >
                      {/* Your Message */}
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-purple-400 text-sm font-semibold mb-2">Your Message</p>
                        <p className="text-slate-300">{message.message}</p>
                      </div>

                      {/* Admin Reply */}
                      {message.reply ? (
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-green-400 text-sm font-semibold">Admin Reply</p>
                          </div>
                          <p className="text-slate-300 mb-2">{message.reply}</p>
                          <p className="text-slate-400 text-xs">
                            Replied on {formatDate(message.repliedAt || "")}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <p className="text-blue-400 text-sm font-semibold">Waiting for Reply</p>
                          </div>
                          <p className="text-slate-300">
                            The admin will review your message and reply soon.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex gap-4"
          >
            <Button
              onClick={() => navigate("/contact")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Send Another Message
            </Button>
            <Button
              onClick={() => navigate("/profile")}
              variant="outline"
              className="text-slate-300 border-slate-600"
            >
              Back to Account
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CustomerMessages;