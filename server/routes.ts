import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { geminiService } from "./geminiService";
import { setupAuth } from "./auth";
import { insertDeviceSchema, insertDeviceCategorySchema } from "@shared/schema";

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

  // Admin Routes for Device Management

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  // Get all devices (admin)
  app.get("/api/devices", isAdmin, async (req, res) => {
    try {
      const devices = await storage.getAllDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  // Create a new device
  app.post("/api/devices", isAdmin, async (req, res) => {
    try {
      const result = insertDeviceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid device data", 
          errors: result.error.format() 
        });
      }

      const newDevice = await storage.createDevice(result.data);
      res.status(201).json(newDevice);
    } catch (error) {
      console.error("Create device error:", error);
      res.status(500).json({ 
        message: "Failed to create device",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Update device by ID
  app.patch("/api/devices/:deviceId", isAdmin, async (req, res) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }

      // We use partial to allow updating only some fields
      const validationSchema = insertDeviceSchema.partial();
      const result = validationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid device data", 
          errors: result.error.format() 
        });
      }

      const updatedDevice = await storage.updateDevice(deviceId, result.data);
      if (!updatedDevice) {
        return res.status(404).json({ message: "Device not found" });
      }

      res.json(updatedDevice);
    } catch (error) {
      console.error("Update device error:", error);
      res.status(500).json({ 
        message: "Failed to update device",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Delete device by ID
  app.delete("/api/devices/:deviceId", isAdmin, async (req, res) => {
    try {
      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }

      // Clear any chat messages first
      await storage.clearChatMessages(deviceId);
      
      const success = await storage.deleteDevice(deviceId);
      if (!success) {
        return res.status(404).json({ message: "Device not found" });
      }

      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      console.error("Delete device error:", error);
      res.status(500).json({ 
        message: "Failed to delete device",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Create a new device category
  app.post("/api/device-categories", isAdmin, async (req, res) => {
    try {
      const result = insertDeviceCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid category data", 
          errors: result.error.format() 
        });
      }

      const newCategory = await storage.createDeviceCategory(result.data);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ 
        message: "Failed to create category",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Delete category by ID
  app.delete("/api/device-categories/:categoryId", isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      // Check if there are devices in this category
      const devicesInCategory = await storage.getDevicesByCategory(categoryId);
      if (devicesInCategory.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with existing devices. Remove or reassign devices first." 
        });
      }
      
      // In a real app, we'd add a method to storage interface for this
      // For simplicity, we'll just check if the category exists first
      const category = await storage.getDeviceCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // In a real application, we would add a deleteCategory method to the storage interface
      res.status(501).json({ message: "Category deletion not implemented" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ 
        message: "Failed to delete category",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
