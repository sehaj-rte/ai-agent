import { useState, useEffect, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Get agent ID from URL params or environment
  const urlParams = new URLSearchParams(window.location.search);
  const agentId = urlParams.get('agentId') || import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_9901k5e65rsjebg8k5f2k3sqyqv6";

  // Initialize conversation with ElevenLabs
  const conversation = useConversation({
    onConnect: () => {
      console.log("Chat conversation connected");
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log("Chat conversation disconnected");
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log("Received message:", message);
      // Handle different message types from ElevenLabs
      if (message.source === "user" || message.source === "ai") {
        const messageContent = (message as any)?.message || String(message) || '';
        const newMessage: Message = {
          id: crypto.randomUUID(),
          content: typeof messageContent === 'string' ? messageContent : String(messageContent),
          sender: message.source === "user" ? "user" : "agent",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
      }
    },
    onError: (error) => {
      console.error("Chat conversation error:", error);
    },
  });

  // Auto-connect when component mounts
  useEffect(() => {
    const connectToAgent = async () => {
      try {
        // For simplicity, using public agent connection
        // In production, you'd want to get auth from your server
        await conversation.startSession({
          agentId: agentId,
          connectionType: 'webrtc',
        });
      } catch (error) {
        console.error("Failed to connect to agent:", error);
      }
    };

    connectToAgent();

    // Cleanup on unmount
    return () => {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
    };
  }, []);

  // Send message to agent
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    if (conversation.status === "connected") {
      // Send to ElevenLabs agent
      conversation.sendUserMessage(newMessage);
    }

    // Add to local state for immediate display
    const message: Message = {
      id: crypto.randomUUID(),
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  }, [newMessage, conversation]);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI DILAN
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? "Online" : "Connecting..."}
            </p>
          </div>
        </div>
        <Button
          onClick={() => window.close()}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial greeting */}
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md">
              <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow-sm">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Hi, I'm AI Dilan. How can I help?
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-xs lg:max-w-md">
              <div
                className={`rounded-lg px-4 py-2 shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
