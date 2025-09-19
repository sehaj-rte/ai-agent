import { Bot } from "lucide-react";
import AudioVisualization from "./audio-visualization";
import MessageList from "./message-list";
import { Message } from "@shared/schema";

interface ConversationAreaProps {
  status: string;
  isSpeaking: boolean;
  messages: Message[];
  inputVolume?: number;
  outputVolume?: number;
}

export default function ConversationArea({ 
  status, 
  isSpeaking, 
  messages, 
  inputVolume, 
  outputVolume 
}: ConversationAreaProps) {
  const getStatusText = () => {
    switch (status) {
      case "connected":
        return isSpeaking ? "Speaking..." : "Listening...";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Ready to start conversation";
      default:
        return "Ready to start conversation";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mb-6">
      <div className="p-6">
        {/* Agent Status Indicator */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Agent Avatar with Speaking Animation */}
            <div 
              className={`w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center relative transition-all duration-300 ${
                isSpeaking ? 'animate-breathing' : ''
              }`}
              data-testid="agent-avatar"
            >
              <Bot className="w-8 h-8 text-white" />
              
              {/* Speaking Indicator Rings */}
              {isSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-accent animate-breathing" />
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-accent animate-breathing"
                    style={{ animationDelay: '0.5s' }}
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Status Text */}
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-foreground mb-1">AI Assistant</h2>
            <p className="text-muted-foreground" data-testid="status-text">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Audio Visualization */}
        <AudioVisualization 
          isActive={status === "connected" && (isSpeaking || Boolean(inputVolume && inputVolume > 0))}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
        />

        {/* Conversation Messages */}
        <MessageList messages={messages} />
      </div>
    </div>
  );
}
