import { useState, useEffect } from "react";
import { Play, Square, Mic, MicOff, Volume2, Headphones, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Device {
  deviceId: string;
  label: string;
}

interface ControlsPanelProps {
  status: string;
  volume: number;
  micMuted: boolean;
  connectionType: string;
  onStartSession: () => void;
  onEndSession: () => void;
  onToggleMic: () => void;
  onVolumeChange: (volume: number) => void;
  onConnectionTypeChange: (type: string) => void;
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  onSendMessage: (message: string) => void;
  onUserActivity: () => void;
}

export default function ControlsPanel({
  status,
  volume,
  micMuted,
  connectionType,
  onStartSession,
  onEndSession,
  onToggleMic,
  onVolumeChange,
  onConnectionTypeChange,
  onInputDeviceChange,
  onOutputDeviceChange,
  onSendMessage,
  onUserActivity,
}: ControlsPanelProps) {
  const [textMessage, setTextMessage] = useState("");
  const [inputDevices, setInputDevices] = useState<Device[]>([]);
  const [outputDevices, setOutputDevices] = useState<Device[]>([]);

  useEffect(() => {
    // Enumerate available audio devices
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`
          }));
        const audioOutputs = devices
          .filter(device => device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`
          }));
        
        setInputDevices(audioInputs);
        setOutputDevices(audioOutputs);
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };

    getDevices();
  }, []);

  const handleSendMessage = () => {
    if (textMessage.trim()) {
      onSendMessage(textMessage);
      setTextMessage("");
    }
  };

  const handleTextInputChange = (value: string) => {
    setTextMessage(value);
    onUserActivity();
  };

  const isConnected = status === "connected";

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-6">
        
        {/* Primary Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {/* Start/End Session Button */}
          <Button
            onClick={isConnected ? onEndSession : onStartSession}
            className="flex items-center space-x-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3"
            data-testid="session-toggle"
          >
            {isConnected ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isConnected ? "End Conversation" : "Start Conversation"}</span>
          </Button>
          
          {/* Microphone Toggle */}
          <Button
            onClick={onToggleMic}
            variant="secondary"
            className="flex items-center space-x-2 px-4 py-3"
            disabled={!isConnected}
            data-testid="mic-toggle"
          >
            {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        </div>

        {/* Audio Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Volume Control */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span>Volume</span>
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={[volume]}
                onValueChange={([value]) => onVolumeChange(value)}
                max={100}
                step={1}
                className="flex-1"
                data-testid="volume-slider"
              />
              <span className="text-sm text-muted-foreground w-8" data-testid="volume-display">
                {volume}%
              </span>
            </div>
          </div>

          {/* Connection Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <span>Connection</span>
            </Label>
            <Select value={connectionType} onValueChange={onConnectionTypeChange} disabled={isConnected}>
              <SelectTrigger data-testid="connection-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webrtc">WebRTC (Recommended)</SelectItem>
                <SelectItem value="websocket">WebSocket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Device Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Input Device */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <span>Input Device</span>
            </Label>
            <Select onValueChange={onInputDeviceChange} disabled={isConnected}>
              <SelectTrigger data-testid="input-device-select">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {inputDevices.map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId || "default"}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Output Device */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Headphones className="w-4 h-4 text-muted-foreground" />
              <span>Output Device</span>
            </Label>
            <Select onValueChange={onOutputDeviceChange} disabled={isConnected}>
              <SelectTrigger data-testid="output-device-select">
                <SelectValue placeholder="Select speakers" />
              </SelectTrigger>
              <SelectContent>
                {outputDevices.map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId || "default"}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Text Input Fallback */}
        <div className="border-t border-border pt-6">
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Text Message (Alternative to Voice)
          </Label>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={textMessage}
              onChange={(e) => handleTextInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!isConnected}
              data-testid="text-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !textMessage.trim()}
              data-testid="send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
