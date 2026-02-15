import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send } from "lucide-react";

interface Message {
  sender: "admin" | "customer";
  senderId: string;
  text: string;
  sentAt: string;
  isRead: boolean;
}

const CustomerChat = () => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/chat/user-conversation", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data);
        setMessages(data?.messages || []);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/chat/send/${conversation._id}`,
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
        await fetchConversation();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-purple-400" />
        Support Chat
      </h2>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Messages Display */}
          <div className="bg-slate-900/50 rounded p-4 h-64 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                No messages yet. Send a message to start a conversation!
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === "customer" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                      msg.sender === "customer"
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

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>

          <p className="text-xs text-slate-400">
            💡 Contact support for any issues or questions about your orders
          </p>
        </div>
      )}
    </Card>
  );
};

export default CustomerChat;