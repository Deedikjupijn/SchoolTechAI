import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { MaterialIcon } from "@/components/icons";
import { DeviceCategory } from "@/lib/types";

export default function Home() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: categories, isLoading } = useQuery<DeviceCategory[]>({
    queryKey: ["/api/device-categories"],
  });

  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Mobile sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
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

        {/* Content */}
        <div className="bg-white p-4 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-medium">MetalWorks Assistant</h2>
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search categories..." 
                  className="pl-10 pr-4 py-2 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <MaterialIcon 
                  name="search" 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" 
                />
              </div>
            </div>

            <p className="text-lg mb-8">
              Welcome to the MetalWorks AI Assistant! Select a device category to get started.
            </p>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="border border-neutral-200">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-4 flex-1">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                  <Link key={category.id} href={`/categories/${category.id}`}>
                    <Card className="border border-neutral-200 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start">
                          <div className="p-3 bg-primary bg-opacity-20 rounded-full">
                            <MaterialIcon name={category.icon} className="text-primary text-2xl" />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium text-lg">{category.name}</h3>
                            <p className="text-sm text-neutral-600">
                              View {category.name.toLowerCase()} devices
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
