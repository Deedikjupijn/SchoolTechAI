// Define device category type
export interface DeviceCategory {
  id: number;
  name: string;
  icon: string;
}

// Define media item type
export interface MediaItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'image' | 'diagram' | 'pdf' | 'video';
  relatedSection?: 'specifications' | 'materials' | 'safetyRequirements' | 'usageInstructions' | 'troubleshooting';
  relatedInstructionIndex?: number;
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
  mediaItems?: MediaItem[];
}

// Define chat message type
export interface ChatMessage {
  id: number;
  deviceId: number;
  isUser: boolean;
  message: string;
  timestamp: string;
  imageUrl?: string;
}
