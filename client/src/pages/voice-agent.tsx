import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConversation } from "@elevenlabs/react";
import { Mic, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Message } from "@shared/schema";
import ConversationArea from "@/components/voice-agent/conversation-area";
import ControlsPanel from "@/components/voice-agent/controls-panel";
import FeedbackSection from "@/components/voice-agent/feedback-section";
import AgentSetup from "@/components/voice-agent/agent-setup";

export default function VoiceAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configuration state
  const [agentId, setAgentId] = useState(import.meta.env.VITE_ELEVENLABS_AGENT_ID || "");
  const [volume, setVolume] = useState(80);
  const [micMuted, setMicMuted] = useState(false);
  const [connectionType, setConnectionType] = useState<"webrtc" | "websocket">("webrtc");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);

  // Initialize conversation with ElevenLabs
  const conversation = useConversation({
    volume: volume / 100,
    micMuted,
    onConnect: () => {
      console.log("Conversation connected successfully");
      toast({
        title: "Connected",
        description: "Successfully connected to voice agent",
      });
    },
    onDisconnect: () => {
      console.log("Conversation disconnected");
      toast({
        title: "Disconnected",
        description: "Voice agent conversation ended",
      });
      // Update conversation status in backend
      if (currentConversationId) {
        updateStatusMutation.mutate({
          id: currentConversationId,
          status: "disconnected",
        });
      }
    },
    onMessage: (message) => {
      console.log("Received message:", message);
      // Handle different message types from ElevenLabs
      if (message.source === "user" || message.source === "ai") {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: currentConversationId || "",
          content: message.message,
          sender: message.source === "user" ? "user" : "agent",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Save message to backend
        createMessageMutation.mutate(newMessage);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      const errorMessage = typeof error === "string" ? error : (error && typeof error === 'object' && 'message' in error) ? String(error.message) : "Unknown connection error";
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Auto-disconnect on error to prevent hanging state
      if (conversation.status === "connected") {
        handleEndSession();
      }
    },
    onStatusChange: (status) => {
      console.log("Conversation status changed:", status);
      if (currentConversationId) {
        updateStatusMutation.mutate({
          id: currentConversationId,
          status: String(status),
        });
      }
    },
    onDebug: (debugInfo) => {
      console.log("Conversation debug:", debugInfo);
    },
    onAudio: (audio) => {
      // Handle audio data for visualization
      try {
        const outputVol = conversation.getOutputVolume ? conversation.getOutputVolume() : 0;
        const inputVol = conversation.getInputVolume ? conversation.getInputVolume() : 0;
        setOutputVolume(outputVol);
        setInputVolume(inputVol);
      } catch (e) {
        // Methods might not be available
      }
    },
  });

  // Fetch conversation messages
  const { data: conversationMessages } = useQuery({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { agentId: string; connectionType: string }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (message: Message) => {
      const response = await apiRequest("POST", "/api/messages", {
        conversationId: message.conversationId,
        content: message.content,
        sender: message.sender,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", currentConversationId, "messages"] 
      });
    },
  });

  // Update conversation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/conversations/${id}/status`, { status });
      return response.json();
    },
  });

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice features",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Get authentication for conversation
  const getConversationAuth = useCallback(async () => {
    try {
      if (!agentId) {
        throw new Error("Agent ID is required");
      }

      if (connectionType === "webrtc") {
        const response = await fetch(`/api/conversation/token?agent_id=${agentId}`);
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Token request failed:", response.status, errorData);
          throw new Error(`Failed to get conversation token: ${response.status} - ${errorData}`);
        }
        const data = await response.json();
        if (!data.token) {
          throw new Error("No token received from ElevenLabs API");
        }
        return { conversationToken: data.token };
      } else {
        const response = await fetch(`/api/conversation/signed-url?agent_id=${agentId}`);
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Signed URL request failed:", response.status, errorData);
          throw new Error(`Failed to get signed URL: ${response.status} - ${errorData}`);
        }
        const data = await response.json();
        if (!data.signedUrl) {
          throw new Error("No signed URL received from ElevenLabs API");
        }
        return { signedUrl: data.signedUrl };
      }
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }, [agentId, connectionType]);

  // Start conversation session
  const handleStartSession = useCallback(async () => {
    try {
      // Request microphone permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      // Create conversation record
      await createConversationMutation.mutateAsync({
        agentId,
        connectionType,
      });

      // Get authentication
      const auth = await getConversationAuth();
      
      // Start ElevenLabs conversation
      const conversationId = await conversation.startSession({
        agentId,
        connectionType,
        ...auth,
      });

      // Update conversation status
      if (currentConversationId) {
        await updateStatusMutation.mutateAsync({
          id: currentConversationId,
          status: "connected",
        });
      }

      console.log("Conversation started:", conversationId);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Failed to Start",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive",
      });
    }
  }, [
    agentId,
    connectionType,
    conversation,
    currentConversationId,
    createConversationMutation,
    getConversationAuth,
    requestMicrophonePermission,
    toast,
    updateStatusMutation,
  ]);

  // End conversation session
  const handleEndSession = useCallback(async () => {
    try {
      await conversation.endSession();
      
      if (currentConversationId) {
        await updateStatusMutation.mutateAsync({
          id: currentConversationId,
          status: "disconnected",
        });
      }
    } catch (error) {
      console.error("Failed to end conversation:", error);
      toast({
        title: "Error",
        description: "Failed to end conversation properly",
        variant: "destructive",
      });
    }
  }, [conversation, currentConversationId, toast, updateStatusMutation]);

  // Handle volume change
  const handleVolumeChange = useCallback(async (newVolume: number) => {
    setVolume(newVolume);
    await conversation.setVolume({ volume: newVolume / 100 });
  }, [conversation]);

  // Toggle microphone
  const handleToggleMic = useCallback(() => {
    setMicMuted(!micMuted);
  }, [micMuted]);

  // Send text message
  const handleSendMessage = useCallback((message: string) => {
    conversation.sendUserMessage(message);
  }, [conversation]);

  // Send user activity
  const handleUserActivity = useCallback(() => {
    conversation.sendUserActivity();
  }, [conversation]);

  // Send feedback
  const handleFeedback = useCallback((positive: boolean) => {
    conversation.sendFeedback(positive);
    toast({
      title: "Feedback Sent",
      description: `Thank you for your ${positive ? "positive" : "negative"} feedback`,
    });
  }, [conversation, toast]);

  // Handle device changes
  const handleInputDeviceChange = useCallback(async (deviceId: string) => {
    try {
      await conversation.changeInputDevice({
        sampleRate: 16000,
        format: 'pcm',
        inputDeviceId: deviceId,
      });
    } catch (error) {
      console.error("Failed to change input device:", error);
    }
  }, [conversation]);

  const handleOutputDeviceChange = useCallback(async (deviceId: string) => {
    try {
      await conversation.changeOutputDevice({
        sampleRate: 16000,
        format: 'pcm',
        outputDeviceId: deviceId,
      });
    } catch (error) {
      console.error("Failed to change output device:", error);
    }
  }, [conversation]);

  // Update messages when conversation messages are fetched
  useEffect(() => {
    if (Array.isArray(conversationMessages)) {
      setMessages(conversationMessages);
    }
  }, [conversationMessages]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Voice Agent</h1>
                <p className="text-sm text-muted-foreground">ElevenLabs Conversation Interface</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    conversation.status === "connected" 
                      ? "bg-accent animate-pulse-slow" 
                      : "bg-muted-foreground"
                  }`}
                  data-testid="connection-indicator"
                />
                <span 
                  className={`text-sm font-medium ${
                    conversation.status === "connected" ? "text-accent" : "text-muted-foreground"
                  }`}
                  data-testid="connection-status"
                >
                  {conversation.status === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
          
          {/* Agent Setup */}
          <AgentSetup 
            agentId={agentId}
            onAgentIdChange={setAgentId}
            isConnected={conversation.status === "connected"}
          />

          {/* Conversation Area */}
          <ConversationArea
            status={conversation.status}
            isSpeaking={conversation.isSpeaking}
            messages={messages}
            inputVolume={inputVolume}
            outputVolume={outputVolume}
          />

          {/* Controls Panel */}
          <ControlsPanel
            status={conversation.status}
            volume={volume}
            micMuted={micMuted}
            connectionType={connectionType}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onToggleMic={handleToggleMic}
            onVolumeChange={handleVolumeChange}
            onConnectionTypeChange={(type) => setConnectionType(type as "webrtc" | "websocket")}
            onInputDeviceChange={handleInputDeviceChange}
            onOutputDeviceChange={handleOutputDeviceChange}
            onSendMessage={handleSendMessage}
            onUserActivity={handleUserActivity}
          />

          {/* Feedback Section */}
          <FeedbackSection
            canSendFeedback={conversation.canSendFeedback}
            onFeedback={handleFeedback}
          />

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Powered by ElevenLabs</span>
              <span className="text-border">•</span>
              <span data-testid="conversation-id">
                ID: {conversation.getId() || "Not connected"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Secure Connection</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
