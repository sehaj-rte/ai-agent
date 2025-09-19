import { Message } from "@shared/schema";
import { User, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return "";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="space-y-4 mb-6 max-h-80 overflow-y-auto" data-testid="message-list">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
            <p>Start a conversation to see messages here</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            data-testid={`message-${message.id}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.sender === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-accent text-accent-foreground'
            }`}>
              {message.sender === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex flex-col max-w-xs ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card border border-border text-foreground rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              
              {/* Timestamp */}
              {message.timestamp && (
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {formatTimestamp(message.timestamp)}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
