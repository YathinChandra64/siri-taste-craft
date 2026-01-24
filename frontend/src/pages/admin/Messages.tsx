import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Reply, Trash2, Eye, AlertCircle, CheckCircle } from "lucide-react";
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

  useEffect(() => {
    fetchMessages();
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
          title: "Reply Sent!",
          description: "Your reply has been saved",
        });
        setReplyText("");
        setSelectedMessage(null);
        fetchMessages();
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
    if (!confirm("Are you sure you want to delete this message?")) return;

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
        setSelectedMessage(null);
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      case "read":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case "replied":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle size={16} />;
      case "read":
        return <Eye size={16} />;
      case "replied":
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-200">MESSAGES</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Contact Messages</h1>
          <p className="text-muted-foreground">View and reply to customer messages</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : messages.length === 0 ? (
          <Card className="p-12 text-center">
            <Mail size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No messages yet</p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2 space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedMessage(msg)}
                  className="cursor-pointer"
                >
                  <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{msg.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail size={14} />
                          {msg.email}
                        </p>
                      </div>
                      <Badge className={`flex items-center gap-1 ${getStatusColor(msg.status)}`}>
                        {getStatusIcon(msg.status)}
                        {msg.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {msg.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Message Details */}
            {selectedMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 sticky top-20 h-fit shadow-lg">
                  <h2 className="text-2xl font-bold mb-4">{selectedMessage.name}</h2>
                  
                  <div className="space-y-3 mb-6 pb-6 border-b">
                    <div className="flex items-center gap-2">
                      <Mail size={18} className="text-primary" />
                      <a 
                        href={`mailto:${selectedMessage.email}`} 
                        className="text-primary hover:underline"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold mb-2 text-sm text-muted-foreground">MESSAGE:</h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedMessage.message}
                    </p>
                  </div>

                  {selectedMessage.reply && (
                    <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                        ✓ Your Reply:
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {selectedMessage.reply}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        {new Date(selectedMessage.repliedAt || "").toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}

                  {selectedMessage.status !== "replied" && (
                    <div className="space-y-3 mb-6 pb-6 border-t">
                      <label className="block text-sm font-medium">Reply:</label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full p-3 border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={4}
                        disabled={isReplying}
                      />
                      <Button
                        onClick={() => handleReply(selectedMessage._id)}
                        disabled={isReplying}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isReplying ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <Reply size={16} className="mr-2" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={() => handleDelete(selectedMessage._id)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Message
                  </Button>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;