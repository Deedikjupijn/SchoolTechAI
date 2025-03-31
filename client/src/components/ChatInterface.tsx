import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MaterialIcon } from "@/components/icons";
import { Device, ChatMessage } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { Image, Trash2, X, Upload } from "lucide-react";

interface ChatInterfaceProps {
  device?: Device;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string, imageUrl?: string) => Promise<any>;
  onClearChat: () => Promise<void>;
}

export default function ChatInterface({ 
  device, 
  messages, 
  isLoading, 
  onSendMessage,
  onClearChat 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change or when loading/sending state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending, isLoading]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  // Upload image to server
  const uploadImage = async () => {
    if (!selectedImage) return null;
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    try {
      setIsUploading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);

      // If there's an image, upload it first
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      // Send message with image URL if available
      await onSendMessage(message, imageUrl || undefined);
      
      // Clear form
      setMessage("");
      clearImage();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    try {
      await onClearChat();
      toast({
        title: "Success",
        description: "Chat history has been cleared.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat history.",
        variant: "destructive",
      });
    }
  };

  // Show placeholder when no device is selected
  if (!device) {
    return (
      <div className="w-full flex flex-col h-full bg-neutral-50">
        <div className="p-4 text-center text-neutral-500 flex-1 flex items-center justify-center">
          <div>
            <MaterialIcon name="chat_bubble_outline" className="text-4xl mb-2" />
            <p>Select a device to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  // Display welcome message if there are no user messages
  const hasUserMessage = messages.some(msg => msg.isUser);
  
  // Render the main chat interface
  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      <div className="p-4 bg-white border-b border-neutral-100 flex items-center">
        <div className="flex-1">
          <h3 className="font-medium">{device.name} Assistant</h3>
          <p className="text-sm text-neutral-600">Ask me anything about using the {device.name.toLowerCase()}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClearChat}
          disabled={isLoading || isSending}
        >
          <MaterialIcon name="delete_outline" className="text-neutral-600" />
        </Button>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 h-full relative" id="chat-messages">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-start">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))
        ) : (
          // Chat content
          <div>
            {/* Welcome Message */}
            {!hasUserMessage && (
              <div className="chat-message-ai bg-white rounded-lg p-4 mb-4 shadow-sm border-l-4 border-primary">
                <div className="flex items-start">
                  <div className="p-2 bg-primary bg-opacity-20 rounded-full">
                    <MaterialIcon name="smart_toy" className="text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-600 mb-1">{device.name} Assistant</p>
                    <div>
                      <p className="mb-2">
                        Hello! I'm your {device.name} Assistant, powered by Gemini. I can help you with:
                      </p>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>Safety procedures and requirements</li>
                        <li>Material settings and compatibility</li>
                        <li>Troubleshooting common issues</li>
                        <li>Maintenance requirements</li>
                        <li>Optimizing your work with the {device.name.toLowerCase()}</li>
                      </ul>
                      <p className="mt-2">What would you like to know about the {device.name.toLowerCase()}?</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message history */}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`${
                  msg.isUser 
                    ? "chat-message-user bg-white rounded-lg p-4 mb-4 shadow-sm ml-auto max-w-[85%] sm:max-w-3/4 border-l-4 border-[#009688]" 
                    : "chat-message-ai bg-white rounded-lg p-4 mb-4 shadow-sm border-l-4 border-primary max-w-[90%] sm:max-w-full"
                }`}
              >
                <div className="flex items-start">
                  {!msg.isUser && (
                    <div className="p-2 bg-primary bg-opacity-20 rounded-full">
                      <MaterialIcon name="smart_toy" className="text-primary" />
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-600 mb-1">
                      {msg.isUser ? "You" : `${device.name} Assistant`}
                    </p>
                    
                    {/* Display uploaded image if present */}
                    {msg.isUser && msg.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={msg.imageUrl}
                          alt="Uploaded image" 
                          className="rounded-md max-h-64 max-w-full object-contain border border-neutral-200"
                        />
                      </div>
                    )}
                    
                    <div className="prose prose-sm max-w-none">
                      {msg.isUser ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                      ) : (
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                  {msg.isUser && (
                    <div className="p-2 bg-[#009688] bg-opacity-20 rounded-full ml-3">
                      <MaterialIcon name="person" className="text-[#009688]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Typing indicator */}
        {isSending && (
          <div className="chat-message-ai bg-white rounded-lg p-4 mb-4 shadow-sm border-l-4 border-primary max-w-[90%] sm:max-w-full">
            <div className="flex items-start">
              <div className="p-2 bg-primary bg-opacity-20 rounded-full">
                <MaterialIcon name="smart_toy" className="text-primary" />
              </div>
              <div className="ml-3 flex items-center">
                <div className="typing">
                  <span className="dot bg-primary"></span>
                  <span className="dot bg-primary"></span>
                  <span className="dot bg-primary"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-3 sm:p-4 bg-white border-t border-neutral-100">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative">
            <div className="border border-neutral-200 rounded p-2 bg-neutral-50 relative">
              <div className="absolute top-2 right-2 z-10 flex space-x-1">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={clearImage}
                  disabled={isSending || isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="rounded max-h-48 max-w-full mx-auto"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {selectedImage?.name} 
                ({Math.round(selectedImage ? selectedImage.size / 1024 : 0)}KB)
              </p>
            </div>
          </div>
        )}
      
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageSelect} 
          accept="image/*" 
          className="hidden" 
          disabled={isSending || isUploading || isLoading}
        />
        
        <div className="flex">
          {/* Image upload button */}
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={triggerFileInput}
            disabled={isSending || isUploading || isLoading}
            className="mr-1 border-neutral-200 rounded-l-lg"
            title="Upload image"
          >
            <Image className="h-5 w-5 text-neutral-600" />
          </Button>
          
          <Input 
            type="text" 
            placeholder={`Ask about ${device.name.toLowerCase()}...`}
            className="flex-1 py-2 px-3 border border-neutral-200 focus:outline-none text-sm sm:text-base border-l-0 border-r-0"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending || isLoading}
          />
          <Button 
            className="bg-primary hover:bg-primary-dark text-white px-3 sm:px-4 py-2 rounded-r-lg flex items-center"
            onClick={handleSendMessage}
            disabled={isSending || isLoading || (!message.trim() && !selectedImage)}
          >
            {isUploading ? (
              <span className="flex items-center">
                <MaterialIcon name="cloud_upload" className="animate-pulse mr-1" />
                <span className="text-sm sm:text-base">Uploading...</span>
              </span>
            ) : (
              <>
                <MaterialIcon name="send" className="mr-1 hidden sm:inline" />
                <span className="text-sm sm:text-base">Send</span>
              </>
            )}
          </Button>
        </div>
        <div className="flex justify-between mt-1 sm:mt-2 text-xs text-neutral-500">
          <span>Powered by Gemini</span>
          {selectedImage && (
            <span className="text-primary cursor-pointer" onClick={clearImage}>
              Cancel image
            </span>
          )}
        </div>
      </div>
    </div>
  );
}