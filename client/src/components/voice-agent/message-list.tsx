import { Message } from "@shared/schema";

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto" data-testid="message-list">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Start a conversation to see messages here
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${message.id}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
