import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchAllDevices, deleteDevice } from "@/lib/api";
import { Device, DeviceCategory } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
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
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import { Loader2 } from "lucide-react";

interface DeviceListProps {
  onEdit: (device: Device) => void;
  selectedCategory: DeviceCategory | null;
}

export default function DeviceList({ onEdit, selectedCategory }: DeviceListProps) {
  const { toast } = useToast();
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);

  // Fetch all devices
  const { data: devices, isLoading } = useQuery({
    queryKey: ["/api/devices"],
    queryFn: fetchAllDevices,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteDevice(id);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      
      // If we had a category selected, invalidate that too
      if (selectedCategory) {
        queryClient.invalidateQueries({
          queryKey: ["/api/categories", selectedCategory.id, "devices"],
        });
      }
      
      toast({
        title: "Device deleted",
        description: "The device has been successfully deleted.",
      });
      
      setDeviceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete device",
        description: error.message,
        variant: "destructive",
      });
      setDeviceToDelete(null);
    },
  });

  // Filter devices by category if one is selected
  const filteredDevices = !selectedCategory 
    ? devices 
    : devices?.filter((device: Device) => device.categoryId === selectedCategory.id);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-medium">No devices found</h3>
        <p className="text-muted-foreground mt-2">
          {selectedCategory
            ? `No devices in the ${selectedCategory.name} category.`
            : "No devices have been added yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices?.map((device: Device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MaterialIcon name={device.icon} className="h-5 w-5" />
                    </div>
                    <span>{device.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {/* Just display category ID until we have a resolver */}
                  {device.categoryId}
                </TableCell>
                <TableCell className="max-w-[400px] truncate">
                  {device.shortDescription}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button size="sm" variant="outline" onClick={() => onEdit(device)}>
                      <MaterialIcon name="edit" className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive" 
                      onClick={() => setDeviceToDelete(device)}
                    >
                      <MaterialIcon name="delete" className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={() => setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deviceToDelete?.name}</strong>. 
              This action cannot be undone and all associated chat history will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deviceToDelete) {
                  deleteMutation.mutate(deviceToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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