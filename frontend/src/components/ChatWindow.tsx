import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";

const ChatWindow = ({ conversationId, customerName, onClose, isAdmin = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      // Poll for new messages every 2 seconds
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/chat/conversation?id=${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data && data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
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
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 rounded-t-xl flex justify-between items-center">
        <h3 className="text-white font-semibold">{customerName || "Chat"}</h3>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-1 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-750">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === user?.role ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.sender === user?.role
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-700 flex gap-2"
      >
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
        />
        <Button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;