import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import DeviceSelector from "@/components/DeviceSelector";
import { MaterialIcon } from "@/components/icons";
import { DeviceCategory, Device } from "@/lib/types";

export default function DeviceCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch category details
  const { data: categories } = useQuery<DeviceCategory[]>({
    queryKey: ["/api/device-categories"],
  });

  const category = categories?.find(c => c.id === parseInt(categoryId)) || null;

  // Fetch devices in this category
  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: [`/api/categories/${categoryId}/devices`],
    enabled: !!categoryId,
  });

  const filteredDevices = devices?.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar activeCategory={parseInt(categoryId)} />

      {/* Mobile sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        activeCategory={parseInt(categoryId)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Device Selector */}
        <div className="bg-white border-b border-neutral-100 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="mr-2">
                    <MaterialIcon name="arrow_back" />
                  </Button>
                </Link>
                <h2 className="text-xl font-medium">{category?.name || 'Loading...'}</h2>
              </div>
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search devices..." 
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

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="border border-neutral-200">
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-3 flex-1">
                          <Skeleton className="h-5 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <DeviceSelector devices={filteredDevices} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
