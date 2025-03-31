// Define device category type
export interface DeviceCategory {
  id: number;
  name: string;
  icon: string;
}

// Define device type
export interface Device {
  id: number;
  name: string;
  icon: string;
  shortDescription: string;
  categoryId: number;
  specifications: unknown;
  materials: unknown;
  safetyRequirements: unknown;
  usageInstructions: unknown;
  troubleshooting: unknown;
}

// Define chat message type
export interface ChatMessage {
  id: number;
  deviceId: number;
  isUser: boolean;
  message: string;
  timestamp: string;
}
