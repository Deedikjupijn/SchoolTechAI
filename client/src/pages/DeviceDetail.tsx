import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import DeviceInfoPanel from "@/components/DeviceInfoPanel";
import ChatInterface from "@/components/ChatInterface";
import { MaterialIcon } from "@/components/icons";
import { Device, ChatMessage } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export default function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch device details
  const { data: device, isLoading: isLoadingDevice } = useQuery<Device>({
    queryKey: [`/api/devices/${deviceId}`],
    enabled: !!deviceId,
  });

  // Fetch chat messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/devices/${deviceId}/messages`],
    enabled: !!deviceId,
  });

  // Handle sending chat message
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !deviceId) return;

    try {
      const response = await apiRequest("POST", `/api/devices/${deviceId}/chat`, { message });
      const data = await response.json();
      
      // Invalidate the messages query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/devices/${deviceId}/messages`] });
      
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Handle clearing chat history
  const handleClearChat = async () => {
    if (!deviceId) return;

    try {
      await apiRequest("DELETE", `/api/devices/${deviceId}/chat`);
      
      // Invalidate the messages query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/devices/${deviceId}/messages`] });
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar activeCategory={device?.categoryId} />

      {/* Mobile sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        activeCategory={device?.categoryId}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Button for Sidebar */}
        <div className="md:hidden border-b border-neutral-100 p-2 flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <MaterialIcon name="menu" />
          </Button>
        </div>

        {/* Back button */}
        <div className="bg-white border-b border-neutral-100 p-2 md:hidden">
          <Link href={device ? `/categories/${device.categoryId}` : "/"}>
            <Button variant="ghost" size="sm" className="flex items-center">
              <MaterialIcon name="arrow_back" className="mr-1" />
              Back to devices
            </Button>
          </Link>
        </div>

        {/* Device Information and Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Device Information Panel */}
          <DeviceInfoPanel 
            device={device} 
            isLoading={isLoadingDevice} 
          />
          
          {/* Chat Interface */}
          <ChatInterface 
            device={device}
            messages={messages || []}
            isLoading={isLoadingMessages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
          />
        </div>
      </main>
    </div>
  );
}
