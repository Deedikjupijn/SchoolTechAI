import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialIcon } from "@/components/icons";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import DeviceList from "@/components/admin/DeviceList";
import DeviceEditor from "@/components/admin/DeviceEditor";
import CategoryList from "@/components/admin/CategoryList";
import { DeviceCategory, Device } from "@/lib/types";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("devices");
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | null>(null);

  // Get categories for selection in device editor
  const { data: categories, isLoading: categoriesLoading } = useQuery<DeviceCategory[]>({
    queryKey: ["/api/device-categories"],
  });

  // If user is not logged in or not an admin, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/">Return to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateDevice = () => {
    setEditingDevice(null);
    setIsCreatingDevice(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setIsCreatingDevice(false);
  };

  const handleCloseEditor = () => {
    setEditingDevice(null);
    setIsCreatingDevice(false);
  };

  // Determine what content to show based on the current state
  const renderContent = () => {
    if (editingDevice || isCreatingDevice) {
      return (
        <DeviceEditor 
          device={editingDevice} 
          isCreating={isCreatingDevice} 
          categories={categories || []}
          onClose={handleCloseEditor}
        />
      );
    }

    if (activeTab === "devices") {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-medium">Manage Devices</h3>
            <Button onClick={handleCreateDevice}>
              <MaterialIcon name="add" className="mr-2 h-4 w-4" />
              Create New Device
            </Button>
          </div>
          <DeviceList onEdit={handleEditDevice} selectedCategory={selectedCategory} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium">Manage Categories</h3>
          <Button>
            <MaterialIcon name="add" className="mr-2 h-4 w-4" />
            Create New Category
          </Button>
        </div>
        <CategoryList 
          onSelect={(category: DeviceCategory) => {
            setSelectedCategory(category);
            setActiveTab("devices");
          }} 
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Admin sidebar */}
      <div className="w-64 border-r border-neutral-200 bg-white p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage workshop devices</p>
        </div>

        <div className="space-y-1">
          <Button 
            variant={activeTab === "devices" ? "default" : "ghost"} 
            className="w-full justify-start"
            onClick={() => {
              setActiveTab("devices");
              setEditingDevice(null);
              setIsCreatingDevice(false);
            }}
          >
            <MaterialIcon name="devices" className="mr-2 h-5 w-5" />
            Devices
          </Button>
          <Button 
            variant={activeTab === "categories" ? "default" : "ghost"} 
            className="w-full justify-start"
            onClick={() => {
              setActiveTab("categories");
              setEditingDevice(null);
              setIsCreatingDevice(false);
              setSelectedCategory(null);
            }}
          >
            <MaterialIcon name="category" className="mr-2 h-5 w-5" />
            Categories
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
}