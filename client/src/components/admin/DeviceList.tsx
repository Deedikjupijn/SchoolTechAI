import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllDevices, deleteDevice } from "@/lib/api";
import { DeviceCategory, Device } from "@/lib/types";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { queryClient } from "@/lib/queryClient";

interface DeviceListProps {
  onEdit: (device: Device) => void;
  selectedCategory: DeviceCategory | null;
}

export default function DeviceList({ onEdit, selectedCategory }: DeviceListProps) {
  const { toast } = useToast();
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch all devices
  const { data: devices, isLoading, error } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
    queryFn: fetchAllDevices
  });

  // Handle device deletion
  const handleDeleteDevice = async () => {
    if (!deletingDevice) return;
    
    try {
      setIsDeleting(true);
      await deleteDevice(deletingDevice.id);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/categories", deletingDevice.categoryId, "devices"] 
      });
      
      toast({
        title: "Device deleted",
        description: `${deletingDevice.name} has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete device",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingDevice(null);
    }
  };

  // Filter devices by selected category if needed
  const filteredDevices = selectedCategory && devices
    ? devices.filter((device: Device) => device.categoryId === selectedCategory.id)
    : devices;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <MaterialIcon name="hourglass_empty" className="h-12 w-12 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !devices) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <MaterialIcon name="error" className="h-12 w-12 text-destructive mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Devices</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error ? error.message : "An unexpected error occurred."}
            </p>
            <Button 
              variant="outline" 
              className="mx-auto"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/devices"] })}
            >
              <MaterialIcon name="refresh" className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredDevices?.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <MaterialIcon name="devices" className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">
              {selectedCategory 
                ? `No devices in ${selectedCategory.name} category` 
                : "No devices found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new device to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices?.map((device: Device) => (
          <Card key={device.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MaterialIcon name={device.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {device.shortDescription.length > 60
                        ? `${device.shortDescription.substring(0, 60)}...`
                        : device.shortDescription}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-t border-border">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-none py-2 h-10 border-r border-border"
                  onClick={() => onEdit(device)}
                >
                  <MaterialIcon name="edit" className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-none py-2 h-10 text-destructive hover:text-destructive"
                    onClick={() => setDeletingDevice(device)}
                  >
                    <MaterialIcon name="delete" className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deletingDevice} onOpenChange={(open) => !open && setDeletingDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deletingDevice?.name} and all associated chat history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDevice}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <MaterialIcon name="hourglass_empty" className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}