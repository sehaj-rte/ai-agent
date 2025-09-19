import { useState } from "react";
import { Settings, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AgentSetupProps {
  agentId: string;
  onAgentIdChange: (agentId: string) => void;
  isConnected: boolean;
}

export default function AgentSetup({ agentId, onAgentIdChange, isConnected }: AgentSetupProps) {
  const [tempAgentId, setTempAgentId] = useState(agentId);
  const [isEditing, setIsEditing] = useState(!agentId);

  const handleSave = () => {
    onAgentIdChange(tempAgentId);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempAgentId(agentId);
    setIsEditing(false);
  };

  if (!isEditing && agentId) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Agent Configured</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              disabled={isConnected}
              data-testid="edit-agent-config"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Agent ID</Label>
            <div className="flex items-center space-x-2">
              <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{agentId}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <CardTitle className="text-blue-900">Agent Configuration Required</CardTitle>
            <CardDescription className="text-blue-800">
              Configure your ElevenLabs Agent to start voice conversations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            <strong>How to get your Agent ID:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to <a href="https://elevenlabs.io/app/agents" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">ElevenLabs Agents <ExternalLink className="w-3 h-3 ml-1" /></a></li>
              <li>Create or select an existing agent</li>
              <li>Copy the Agent ID from the agent settings</li>
              <li>Paste it below and save</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label htmlFor="agent-id" className="text-sm font-medium">
            ElevenLabs Agent ID
          </Label>
          <Input
            id="agent-id"
            type="text"
            placeholder="Enter your Agent ID (e.g., agent_abc123...)"
            value={tempAgentId}
            onChange={(e) => setTempAgentId(e.target.value)}
            data-testid="agent-id-input"
          />
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave}
              disabled={!tempAgentId.trim()}
              data-testid="save-agent-config"
            >
              Save Agent ID
            </Button>
            {agentId && (
              <Button 
                variant="outline" 
                onClick={handleCancel}
                data-testid="cancel-agent-config"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}