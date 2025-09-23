import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get agent ID from environment
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_9901k5e65rsjebg8k5f2k3sqyqv6";

  // Initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsConnected(true);
        
        // Add initial greeting message
        const greetingMessage: Message = {
          id: crypto.randomUUID(),
          content: "Hi, I'm Dr. Elisa Song. How can I help you today?",
          sender: "agent",
          timestamp: new Date(),
        };
        setMessages([greetingMessage]);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Send message to agent
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      // Send message to backend API for text-only chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          agentId: agentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add agent response to chat (text only, no voice)
        const agentMessage: Message = {
          id: crypto.randomUUID(),
          content: data.response || "I'm here to help!",
          sender: "agent",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, agentMessage]);
      } else {
        // Fallback response if API fails
        const agentMessage: Message = {
          id: crypto.randomUUID(),
          content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
          sender: "agent",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        content: "I'm sorry, there was an error. Please try again.",
        sender: "agent",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);
    }
  }, [newMessage, agentId]);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dr. Elisa Song
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? "Initializing..." : isConnected ? "Ready to chat" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        id="chat-messages"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400">Initializing chat with Dr. Elisa Song...</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-xs lg:max-w-md">
                <div
                  className={`rounded-lg px-4 py-2 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={!isConnected || isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected || isLoading}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white p-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
