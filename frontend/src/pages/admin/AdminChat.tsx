import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/useAuth";
import { MessageSquare, Send, X, Bell } from "lucide-react";

interface Message {
  sender: "admin" | "customer";
  senderId: string;
  text: string;
  sentAt: string;
  isRead: boolean;
}

interface Conversation {
  _id: string;
  customer: {
    name: string;
    email: string;
  };
  messages: Message[];
  status: "active" | "closed";
  lastMessage: string;
  lastMessageAt: string;
}

const AdminChatAndNotifications = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchConversations();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchConversations, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/chat/all-conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (conversationId: string) => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/chat/send/${conversationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text: newMessage })
        }
      );

      if (response.ok) {
        setNewMessage("");
        await fetchConversations();
        // Re-select to update
        const updated = (await response.json()).conversation;
        setSelectedConversation(updated);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/chat/close/${conversationId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchConversations();
      setSelectedConversation(null);
    } catch (error) {
      console.error("Error closing conversation:", error);
    }
  };

  if (!user?.role || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-purple-400" />
            Customer Conversations
          </h1>
          <p className="text-slate-400">Manage customer chats and respond to inquiries</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="bg-slate-800 border-slate-700 lg:col-span-1 h-fit">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Active Chats</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-400">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No conversations</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-3 border-b border-slate-700 text-left hover:bg-slate-700/50 transition ${
                      selectedConversation?._id === conv._id ? "bg-slate-700" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-white">{conv.customer.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {conv.status === "active" && (
                        <Bell className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(conv.lastMessageAt).toLocaleTimeString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Chat Window */}
          {selectedConversation ? (
            <Card className="bg-slate-800 border-slate-700 lg:col-span-2 flex flex-col h-96">
              {/* Header */}
              <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">{selectedConversation.customer.name}</h3>
                  <p className="text-xs text-slate-400">{selectedConversation.customer.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.status === "active" && (
                    <Button
                      onClick={() => handleCloseConversation(selectedConversation._id)}
                      size="sm"
                      variant="destructive"
                    >
                      Close Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
                {selectedConversation.messages.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No messages yet</p>
                ) : (
                  selectedConversation.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.sender === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                          msg.sender === "admin"
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.sentAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              {selectedConversation.status === "active" && (
                <div className="p-4 border-t border-slate-700 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage(selectedConversation._id);
                      }
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button
                    onClick={() => handleSendMessage(selectedConversation._id)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="bg-slate-800 border-slate-700 lg:col-span-2 flex items-center justify-center h-96">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a conversation to start chatting</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatAndNotifications;