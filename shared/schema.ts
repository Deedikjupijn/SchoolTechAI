import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define device categories
export const deviceCategories = pgTable("device_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
});

export const insertDeviceCategorySchema = createInsertSchema(deviceCategories).pick({
  name: true,
  icon: true,
});

// Define devices
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  shortDescription: text("short_description").notNull(),
  categoryId: integer("category_id").notNull(),
  specifications: json("specifications").notNull(),
  materials: json("materials").notNull(),
  safetyRequirements: json("safety_requirements").notNull(),
  usageInstructions: json("usage_instructions").notNull(),
  troubleshooting: json("troubleshooting").notNull(),
  mediaItems: json("media_items").default('[]').notNull(),
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  name: true,
  icon: true,
  shortDescription: true,
  categoryId: true,
  specifications: true,
  materials: true,
  safetyRequirements: true,
  usageInstructions: true,
  troubleshooting: true,
  mediaItems: true,
});

// Define chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  isUser: boolean("is_user").notNull(),
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  deviceId: true,
  isUser: true,
  message: true,
  timestamp: true,
});

// Export types
export type DeviceCategory = typeof deviceCategories.$inferSelect;
export type InsertDeviceCategory = z.infer<typeof insertDeviceCategorySchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

// Define users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // This will store hashed passwords
  displayName: text("display_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  isAdmin: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
