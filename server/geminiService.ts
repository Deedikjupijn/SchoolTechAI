import { GoogleGenerativeAI } from "@google/generative-ai";
import { Device } from "@shared/schema";

class GeminiService {
  private api: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set. AI functionality will not work properly.");
    } else {
      this.api = new GoogleGenerativeAI(apiKey);
    }
  }

  async getChatResponse(device: Device, userMessage: string): Promise<string> {
    if (!this.api) {
      return "Sorry, I'm unable to respond because the Gemini API key is not configured. Please contact the administrator.";
    }

    try {
      // Create a simplified context about the device
      const deviceContext = {
        name: device.name,
        description: device.shortDescription,
        specifications: device.specifications,
        materials: device.materials,
        safetyRequirements: device.safetyRequirements,
        usageInstructions: device.usageInstructions,
        troubleshooting: device.troubleshooting
      };

      const model = this.api.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Create the prompt with device information and user message
      const systemPrompt = `
        You are a specialized AI assistant for a school's metalworking shop, specifically knowledgeable about the ${device.name}.
        
        Device Information:
        ${JSON.stringify(deviceContext, null, 2)}
        
        Guidelines:
        1. Always prioritize safety in your responses.
        2. Be specific and direct about how to use the ${device.name}.
        3. If you don't know something specific about this device, acknowledge it and provide general best practices.
        4. Format your responses clearly with bullet points or numbered steps when appropriate.
        5. When discussing materials or settings, be precise about measurements, temperatures, speeds, etc.
        6. Keep responses focused on metalworking and the specific device.

        User Query: ${userMessage}
      `;

      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "Sorry, I encountered an error while generating a response. Please try again later.";
    }
  }
}

export const geminiService = new GeminiService();
