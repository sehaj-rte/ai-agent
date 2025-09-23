import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get signed URL for WebSocket connection (requires agent ID)
  app.get("/api/conversation/signed-url", async (req, res) => {
    try {
      const agentId = (req.query.agent_id as string) || "agent_8001k5ef2qn3fbs92mkp16p0sd88";
      
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY || "sk_475c1be5cf54482b86bf69642792b7e5c4048ffdf8ba2ee4";
      if (!apiKey) {
        return res.status(500).json({ message: "ElevenLabs API key not configured" });
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
        {
          headers: {
            "xi-api-key": apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          message: `Failed to get signed URL: ${errorText}` 
        });
      }

      const body = await response.json();
      res.json({ signedUrl: body.signed_url });
    } catch (error) {
      console.error("Error getting signed URL:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error details:", errorMessage, error instanceof Error ? error.stack : undefined);
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });

  // Get conversation token for WebRTC connection (requires agent ID)
  app.get("/api/conversation/token", async (req, res) => {
    try {
      const agentId = (req.query.agent_id as string) || "agent_8001k5ef2qn3fbs92mkp16p0sd88";
      
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY || "sk_475c1be5cf54482b86bf69642792b7e5c4048ffdf8ba2ee4";
      if (!apiKey) {
        return res.status(500).json({ message: "ElevenLabs API key not configured" });
      }
      
      console.log(`Using agent ID: ${agentId}`);
      console.log(`Using API key: ${apiKey.substring(0, 10)}...`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
        {
          headers: {
            "xi-api-key": apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: Status ${response.status}, Response: ${errorText}`);
        return res.status(response.status).json({ 
          message: `Failed to get conversation token: ${errorText}` 
        });
      }

      const responseText = await response.text();
      console.log(`ElevenLabs API response: ${responseText}`);
      const body = JSON.parse(responseText);
      res.json({ token: body.token });
    } catch (error) {
      console.error("Error getting conversation token:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error details:", errorMessage, error instanceof Error ? error.stack : undefined);
      res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get conversation by ID
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error getting conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update conversation status
  app.patch("/api/conversations/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      await storage.updateConversationStatus(req.params.id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating conversation status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // End conversation
  app.patch("/api/conversations/:id/end", async (req, res) => {
    try {
      await storage.endConversation(req.params.id);
      res.json({ message: "Conversation ended successfully" });
    } catch (error) {
      console.error("Error ending conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
