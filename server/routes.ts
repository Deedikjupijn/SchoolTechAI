import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { geminiService } from "./geminiService";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Get all device categories
  app.get("/api/device-categories", async (req, res) => {
    try {
      const categories = await storage.getAllDeviceCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch device categories" });
    }
  });

  // Get devices by category
  app.get("/api/categories/:categoryId/devices", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const devices = await storage.getDevicesByCategory(categoryId);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  // Get device by ID
  app.get("/api/devices/:deviceId", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }

      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch device" });
    }
  });

  // Get chat messages for a device
  app.get("/api/devices/:deviceId/messages", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }

      const messages = await storage.getChatMessages(deviceId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send a message to the AI assistant
  app.post("/api/devices/:deviceId/chat", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        message: z.string().min(1),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid message format" });
      }

      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }

      // Get device information to provide context to Gemini
      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Save user message
      const userMessage = {
        deviceId,
        isUser: true,
        message: result.data.message,
        timestamp: new Date().toISOString(),
      };
      await storage.createChatMessage(userMessage);

      // Get response from Gemini
      const aiResponse = await geminiService.getChatResponse(device, result.data.message);

      // Save AI response
      const aiMessage = {
        deviceId,
        isUser: false,
        message: aiResponse,
        timestamp: new Date().toISOString(),
      };
      await storage.createChatMessage(aiMessage);

      // Return both messages
      res.json({
        userMessage,
        aiMessage,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        message: "Failed to process chat message",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Clear chat history for a device
  app.delete("/api/devices/:deviceId/chat", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }

      await storage.clearChatMessages(deviceId);
      res.json({ message: "Chat history cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
