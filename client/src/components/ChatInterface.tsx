import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MaterialIcon } from "@/components/icons";
import { Device, ChatMessage } from "@/lib/types";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  device?: Device;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<any>;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(message);
      setMessage("");
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
      <div className="md:w-1/2 lg:w-2/5 flex flex-col h-full bg-neutral-50">
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
    <div className="md:w-1/2 lg:w-2/5 flex flex-col h-full">
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
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50" id="chat-messages">
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
                    ? "chat-message-user bg-white rounded-lg p-4 mb-4 shadow-sm ml-auto max-w-3/4 border-l-4 border-[#009688]" 
                    : "chat-message-ai bg-white rounded-lg p-4 mb-4 shadow-sm border-l-4 border-primary"
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
          <div className="chat-message-ai bg-white rounded-lg p-4 mb-4 shadow-sm border-l-4 border-primary">
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
      <div className="p-4 bg-white border-t border-neutral-100">
        <div className="flex">
          <Input 
            type="text" 
            placeholder={`Ask about ${device.name.toLowerCase()}...`}
            className="flex-1 py-2 px-4 border border-neutral-200 rounded-l-lg focus:outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending || isLoading}
          />
          <Button 
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-r-lg flex items-center"
            onClick={handleSendMessage}
            disabled={isSending || isLoading || !message.trim()}
          >
            <MaterialIcon name="send" className="mr-1" />
            Send
          </Button>
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-500">
          <span>Powered by Gemini</span>
        </div>
      </div>
    </div>
  );
}