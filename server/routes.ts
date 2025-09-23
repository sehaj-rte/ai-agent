import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get signed URL for WebSocket connection (requires agent ID)
  app.get("/api/conversation/signed-url", async (req, res) => {
    try {
      const agentId = req.query.agent_id as string;
      
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
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
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get conversation token for WebRTC connection (requires agent ID)
  app.get("/api/conversation/token", async (req, res) => {
    try {
      const agentId = req.query.agent_id as string;
      
      if (!agentId) {
        return res.status(400).json({ message: "Agent ID is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "ElevenLabs API key not configured" });
      }

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
        return res.status(response.status).json({ 
          message: `Failed to get conversation token: ${errorText}` 
        });
      }

      const body = await response.json();
      res.json({ token: body.token });
    } catch (error) {
      console.error("Error getting conversation token:", error);
      res.status(500).json({ message: "Internal server error" });
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

  // Text-only chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, agentId } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          message: "Message is required",
          details: "A valid message string is required"
        });
      }

      // Generate contextually appropriate responses based on the message
      let response = "";
      const lowerMessage = message.toLowerCase().trim();
      
      // Basic pattern matching for more relevant responses
      if (lowerMessage.includes("hi") || lowerMessage.includes("hello") || lowerMessage.includes("hey")) {
        response = "Hello! I'm Dr. Elisa Song. It's nice to meet you. How can I help you today?";
      } else if (lowerMessage.includes("how are you") || lowerMessage.includes("how do you do")) {
        response = "I'm doing well, thank you for asking! I'm here and ready to help you with any health or wellness questions you might have.";
      } else if (lowerMessage.includes("help") || lowerMessage.includes("assist")) {
        response = "I'm here to help! As an integrative pediatrician, I can assist you with questions about children's health, wellness, and integrative medicine approaches.";
      } else if (lowerMessage.includes("thank")) {
        response = "You're very welcome! I'm glad I could help. Is there anything else you'd like to discuss?";
      } else if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
        response = "Goodbye! Take care, and don't hesitate to reach out if you have any more questions about health and wellness.";
      } else if (lowerMessage.includes("health") || lowerMessage.includes("medical")) {
        response = "I'd be happy to discuss health-related topics with you. As an integrative pediatrician, I focus on combining conventional medicine with holistic approaches. What specific area would you like to explore?";
      } else if (lowerMessage.includes("child") || lowerMessage.includes("kid") || lowerMessage.includes("baby")) {
        response = "Children's health is my specialty! I'm passionate about helping kids thrive through integrative approaches. What questions do you have about your child's health or development?";
      } else if (lowerMessage.length < 10) {
        // Short messages get encouraging responses
        response = "I'd love to help you with that. Could you tell me a bit more about what you're looking for?";
      } else {
        // Default response for other messages
        response = "That's an interesting point. As an integrative pediatrician, I believe in addressing health from multiple angles. Could you share more details so I can provide you with the most helpful guidance?";
      }
      
      res.json({ 
        response: response,
        agentId: agentId 
      });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Ensure conversationId is provided and is a string
      if (!validatedData.conversationId || typeof validatedData.conversationId !== 'string') {
        return res.status(400).json({ 
          message: "Invalid conversation ID",
          details: "A valid conversation ID is required"
        });
      }
      
      // Check if conversation exists
      const conversation = await storage.getConversation(validatedData.conversationId);
      if (!conversation) {
        return res.status(404).json({ 
          message: "Conversation not found",
          details: `No conversation found with id: ${validatedData.conversationId}`
        });
      }
      
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
