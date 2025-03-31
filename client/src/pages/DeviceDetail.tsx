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
  const [showChat, setShowChat] = useState(false);
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

        {/* Mobile Tab Controls */}
        <div className="md:hidden border-b border-gray-200">
          <div className="flex justify-around">
            <button 
              className={`flex-1 py-3 font-medium text-center ${!showChat ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
              onClick={() => setShowChat(false)}
            >
              Device Info
            </button>
            <button 
              className={`flex-1 py-3 font-medium text-center ${showChat ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
              onClick={() => setShowChat(true)}
            >
              Chat Assistant
            </button>
          </div>
        </div>

        {/* Device Information and Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Device Information Panel - Hidden on mobile when chat is active */}
          <div className={`${showChat ? 'hidden' : 'flex'} md:flex md:w-1/2 lg:w-3/5`}>
            <DeviceInfoPanel 
              device={device} 
              isLoading={isLoadingDevice} 
            />
          </div>
          
          {/* Chat Interface - Hidden on mobile when info is active */}
          <div className={`${!showChat ? 'hidden' : 'flex'} md:flex md:w-1/2 lg:w-2/5 flex-1`}>
            <ChatInterface 
              device={device}
              messages={messages || []}
              isLoading={isLoadingMessages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
