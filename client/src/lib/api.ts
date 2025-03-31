import { DeviceCategory, Device, ChatMessage } from "./types";
import { apiRequest } from "./queryClient";

// Fetch all device categories
export async function fetchDeviceCategories(): Promise<DeviceCategory[]> {
  const response = await fetch("/api/device-categories");
  if (!response.ok) {
    throw new Error("Failed to fetch device categories");
  }
  return response.json();
}

// Fetch devices by category
export async function fetchDevicesByCategory(categoryId: number): Promise<Device[]> {
  const response = await fetch(`/api/categories/${categoryId}/devices`);
  if (!response.ok) {
    throw new Error("Failed to fetch devices for this category");
  }
  return response.json();
}

// Fetch device by ID
export async function fetchDevice(deviceId: number): Promise<Device> {
  const response = await fetch(`/api/devices/${deviceId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch device details");
  }
  return response.json();
}

// Fetch chat messages for a device
export async function fetchChatMessages(deviceId: number): Promise<ChatMessage[]> {
  const response = await fetch(`/api/devices/${deviceId}/messages`);
  if (!response.ok) {
    throw new Error("Failed to fetch chat messages");
  }
  return response.json();
}

// Send a message to the AI assistant
export async function sendChatMessage(deviceId: number, message: string): Promise<{
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}> {
  const response = await fetch(`/api/devices/${deviceId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to send message");
  }
  
  return response.json();
}

// Clear chat history for a device
export async function clearChatHistory(deviceId: number): Promise<void> {
  const response = await fetch(`/api/devices/${deviceId}/chat`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error("Failed to clear chat history");
  }
}

// Admin API Functions

// Fetch all devices (admin only)
export async function fetchAllDevices(): Promise<Device[]> {
  const response = await apiRequest("GET", "/api/devices");
  return response.json();
}

// Create a new device (admin only)
export async function createDevice(deviceData: Partial<Device>): Promise<Device> {
  const response = await apiRequest("POST", "/api/devices", deviceData);
  return response.json();
}

// Update an existing device (admin only)
export async function updateDevice(deviceId: number, deviceData: Partial<Device>): Promise<Device> {
  const response = await apiRequest("PATCH", `/api/devices/${deviceId}`, deviceData);
  return response.json();
}

// Delete a device (admin only)
export async function deleteDevice(deviceId: number): Promise<void> {
  await apiRequest("DELETE", `/api/devices/${deviceId}`);
}

// Create a new device category (admin only)
export async function createDeviceCategory(categoryData: Partial<DeviceCategory>): Promise<DeviceCategory> {
  const response = await apiRequest("POST", "/api/device-categories", categoryData);
  return response.json();
}

// Delete a device category (admin only)
export async function deleteDeviceCategory(categoryId: number): Promise<void> {
  await apiRequest("DELETE", `/api/device-categories/${categoryId}`);
}
