import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, Mic, MicOff, User, Clock, Settings, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

export default function VoiceAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configuration state
  // Get agent ID from environment variable
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_9901k5e65rsjebg8k5f2k3sqyqv6";
  const [volume, setVolume] = useState(80);
  const [micMuted, setMicMuted] = useState(false);
  const [connectionType, setConnectionType] = useState<"webrtc" | "websocket">("webrtc");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState<string>("00:00");
  const [showSettings, setShowSettings] = useState(false);

  // Update call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStartTime) {
      interval = setInterval(() => {
        const duration = Date.now() - callStartTime.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStartTime]);


  // Initialize conversation with ElevenLabs
  const conversation = useConversation({
    volume: volume / 100,
    micMuted,
    onConnect: () => {
      console.log("Conversation connected successfully");
      setCallStartTime(new Date());
      toast({
        title: "Connected",
        description: "Successfully connected to voice agent",
      });
    },
    onDisconnect: () => {
      console.log("Conversation disconnected");
      setCallStartTime(null);
      setCallDuration("00:00");
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
        const messageContent = (message as any)?.message || String(message) || '';
        const newMessage: Message = {
          id: crypto.randomUUID(),
          conversationId: currentConversationId || "",
          content: typeof messageContent === 'string' ? messageContent : String(messageContent),
          sender: message.source === "user" ? "user" : "agent",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Trigger agent speaking animation
        if (message.source === "ai") {
          setIsAgentSpeaking(true);
          // Stop animation after 3 seconds
          setTimeout(() => setIsAgentSpeaking(false), 3000);
        }
        
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

  // Update messages when fetched from backend
  useEffect(() => {
    if (conversationMessages && Array.isArray(conversationMessages)) {
      setMessages(conversationMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })));
    }
  }, [conversationMessages]);

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        agentId,
        status: "disconnected",
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setCurrentConversationId(data.id);
      console.log("Conversation started:", data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error) => {
      console.error("Failed to create conversation:", error);
    },
  });

  // Create new message
  const createMessageMutation = useMutation({
    mutationFn: async (message: Message) => {
      const response = await apiRequest("POST", "/api/messages", message);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", currentConversationId, "messages"] 
      });
    },
  });

  // Update conversation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/conversations/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
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
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      // Create new conversation record
      await createConversationMutation.mutateAsync();

      // Get authentication and start conversation
      const auth = await getConversationAuth();
      await conversation.startSession(auth);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Failed to Start",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive",
      });
    }
  }, [conversation, createConversationMutation, getConversationAuth, requestMicrophonePermission, toast]);

  // End conversation session
  const handleEndSession = useCallback(() => {
    try {
      conversation.endSession();
      setMessages([]);
      setCurrentConversationId(null);
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  }, [conversation]);

  // Toggle microphone mute
  const toggleMute = useCallback(() => {
    setMicMuted(prev => !prev);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "disconnected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Ready";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Header with status */}
          <div className="flex items-center justify-between mb-8">
            <div></div>
            <div className="flex items-center space-x-3">
              {conversation.status === "connected" && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span data-testid="call-duration">{callDuration}</span>
                </div>
              )}
              <div className="relative">
                <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-8 w-8"
                      data-testid="button-settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3 block">
                          Connection Type
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild disabled={conversation.status !== "disconnected"}>
                            <Button 
                              variant="outline" 
                              className="w-full justify-between h-auto p-3"
                              data-testid="connection-type-select"
                            >
                              <div className="text-left">
                                <div className="font-medium">
                                  {connectionType === "webrtc" ? "WebRTC (Recommended)" : "WebSocket"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                                  {connectionType === "webrtc" 
                                    ? "Lower latency, better audio quality" 
                                    : "Alternative connection method"
                                  }
                                </div>
                              </div>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-80" align="start">
                            <DropdownMenuItem 
                              onClick={() => setConnectionType("webrtc")}
                              className="p-3 cursor-pointer"
                            >
                              <div className="flex flex-col space-y-1">
                                <div className="font-medium">WebRTC (Recommended)</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Lower latency, better audio quality
                                </div>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setConnectionType("websocket")}
                              className="p-3 cursor-pointer"
                            >
                              <div className="flex flex-col space-y-1">
                                <div className="font-medium">WebSocket</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Alternative connection method
                                </div>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Agent Profile */}
          <div className="mb-8">
            <div className="relative mb-4">
              <Avatar 
                className={`w-32 h-32 mx-auto mb-4 ring-4 ring-white dark:ring-gray-700 shadow-lg transition-transform duration-200 ${
                  isAgentSpeaking ? 'scale-110' : 'scale-100'
                }`}
              >
                <AvatarImage 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face" 
                  alt="Dr. Elisa Song"
                />
                <AvatarFallback className="text-2xl">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              {/* Professional phone call animations */}
              {conversation.status === "connecting" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Simple rotating ring during connection */}
                  <div className="w-36 h-36 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                </div>
              )}
              
              {isAgentSpeaking && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Subtle pulse rings when speaking - like WhatsApp/FaceTime */}
                  <div className="w-36 h-36 rounded-full border-2 border-green-400 opacity-60 animate-pulse"></div>
                  <div className="absolute w-40 h-40 rounded-full border border-green-300 opacity-40 animate-ping"></div>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Dr. Elisa Song - Trial
            </h1>
            

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-sm mx-auto">
              Integrative Pediatrician, Founder of Healthy Kids Happy Kids
            </p>
          </div>


          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            {conversation.status === "disconnected" ? (
              <Button
                onClick={handleStartSession}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                data-testid="button-start-call"
              >
                <Phone className="w-8 h-8" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant={micMuted ? "destructive" : "outline"}
                  className="w-12 h-12 rounded-full"
                  data-testid="button-toggle-mute"
                >
                  {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                
                <Button
                  onClick={handleEndSession}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                  data-testid="button-end-call"
                >
                  <PhoneOff className="w-8 h-8" />
                </Button>
              </>
            )}
          </div>

          {/* Status Messages */}
          {conversation.status === "connected" && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Listening...
              </p>
            </div>
          )}

          {/* Recent Messages Preview (optional, small preview) */}
          {messages.length > 0 && conversation.status === "connected" && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent:</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {messages[messages.length - 1]?.content}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}