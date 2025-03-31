import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createDevice, updateDevice } from "@/lib/api";
import { Device, DeviceCategory } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";

// Create a device schema for validation
const deviceFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  icon: z.string().min(1, "Icon name is required"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  specifications: z.any(),
  materials: z.any(),
  safetyRequirements: z.any(),
  usageInstructions: z.any(),
  troubleshooting: z.any(),
});

type DeviceFormValues = z.infer<typeof deviceFormSchema>;

interface DeviceEditorProps {
  device: Device | null;
  isCreating: boolean;
  categories: DeviceCategory[];
  onClose: () => void;
}

export default function DeviceEditor({ 
  device, 
  isCreating,
  categories,
  onClose,
}: DeviceEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");

  // Function to handle formatted JSON objects for editing
  const formatObjectForEditing = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  // Create form with default values from device or empty values if creating
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: device?.name || "",
      icon: device?.icon || "",
      shortDescription: device?.shortDescription || "",
      categoryId: device?.categoryId || (categories[0]?.id || 0),
      specifications: device?.specifications || {},
      materials: device?.materials || {},
      safetyRequirements: device?.safetyRequirements || [] as string[],
      usageInstructions: device?.usageInstructions || [] as { title: string, description: string }[],
      troubleshooting: device?.troubleshooting || [] as { issue: string, solutions: string[] }[],
    },
  });

  // Create mutation to add a new device
  const createMutation = useMutation({
    mutationFn: async (values: DeviceFormValues) => {
      const res = await createDevice(values);
      return res;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/categories", form.getValues("categoryId"), "devices"] 
      });
      
      toast({
        title: "Device created",
        description: "The device has been successfully created.",
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create device",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation to modify an existing device
  const updateMutation = useMutation({
    mutationFn: async (values: DeviceFormValues) => {
      if (!device) return null;
      const res = await updateDevice(device.id, values);
      return res;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      if (device) {
        queryClient.invalidateQueries({ queryKey: [`/api/devices/${device.id}`] });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/categories", device.categoryId, "devices"] 
        });
        // In case category changed
        queryClient.invalidateQueries({ 
          queryKey: ["/api/categories", form.getValues("categoryId"), "devices"] 
        });
      }
      
      toast({
        title: "Device updated",
        description: "The device has been successfully updated.",
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update device",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: DeviceFormValues) => {
    // Parse JSON string fields into objects
    try {
      // Try to parse the JSON fields
      const parsedValues = {
        ...values,
        specifications: typeof values.specifications === 'string' 
          ? JSON.parse(values.specifications) 
          : values.specifications,
        materials: typeof values.materials === 'string' 
          ? JSON.parse(values.materials) 
          : values.materials,
        safetyRequirements: typeof values.safetyRequirements === 'string' 
          ? JSON.parse(values.safetyRequirements) 
          : values.safetyRequirements,
        usageInstructions: typeof values.usageInstructions === 'string' 
          ? JSON.parse(values.usageInstructions) 
          : values.usageInstructions,
        troubleshooting: typeof values.troubleshooting === 'string' 
          ? JSON.parse(values.troubleshooting) 
          : values.troubleshooting,
      };

      if (isCreating) {
        createMutation.mutate(parsedValues);
      } else {
        updateMutation.mutate(parsedValues);
      }
    } catch (error) {
      toast({
        title: "Invalid JSON format",
        description: "Please check the JSON format in all fields.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {isCreating ? "Create New Device" : `Edit Device: ${device?.name}`}
            </CardTitle>
            <CardDescription>
              {isCreating 
                ? "Add a new device to the workshop"
                : "Update device information and configuration"
              }
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={onClose}>
            <MaterialIcon name="close" className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="specs">Specifications</TabsTrigger>
                <TabsTrigger value="safety">Safety</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
              </TabsList>

              {/* Basic Info */}
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Laser Cutter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., content_cut" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter a Material Icon name. You can find icon names at{" "}
                        <a 
                          href="https://fonts.google.com/icons" 
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="text-primary underline"
                        >
                          Google Fonts Icons
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the device" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose which category this device belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              {/* Specifications */}
              <TabsContent value="specs" className="space-y-4">
                <FormField
                  control={form.control}
                  name="specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specifications</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"Power": "400W", "Cutting Area": "1200mm x 900mm"}' 
                          value={
                            typeof field.value === 'object' 
                              ? formatObjectForEditing(field.value) 
                              : field.value
                          }
                          onChange={(e) => field.onChange(e.target.value)}
                          className="font-mono h-60"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter specifications as a JSON object with key-value pairs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="materials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compatible Materials</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"Mild Steel": "Up to 10mm", "Stainless Steel": "Up to 8mm"}' 
                          value={
                            typeof field.value === 'object' 
                              ? formatObjectForEditing(field.value) 
                              : field.value
                          }
                          onChange={(e) => field.onChange(e.target.value)}
                          className="font-mono h-60"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter materials as a JSON object with material names and compatibility info
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              {/* Safety */}
              <TabsContent value="safety" className="space-y-4">
                <FormField
                  control={form.control}
                  name="safetyRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safety Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='["Always wear safety goggles", "Never leave machine unattended"]' 
                          value={
                            typeof field.value === 'object' 
                              ? formatObjectForEditing(field.value) 
                              : field.value
                          }
                          onChange={(e) => field.onChange(e.target.value)}
                          className="font-mono h-60"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter safety requirements as a JSON array of strings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              {/* Usage Instructions */}
              <TabsContent value="usage" className="space-y-4">
                <FormField
                  control={form.control}
                  name="usageInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={`[
  {
    "title": "Prepare Your Design",
    "description": "Create or import your design using the provided CAD software"
  },
  {
    "title": "Material Setup",
    "description": "Place your metal sheet on the cutting bed"
  }
]`} 
                          value={
                            typeof field.value === 'object' 
                              ? formatObjectForEditing(field.value) 
                              : field.value
                          }
                          onChange={(e) => field.onChange(e.target.value)}
                          className="font-mono h-60"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter usage instructions as a JSON array of objects with title and description
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              {/* Troubleshooting */}
              <TabsContent value="troubleshooting" className="space-y-4">
                <FormField
                  control={form.control}
                  name="troubleshooting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Troubleshooting</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={`[
  {
    "issue": "Laser Not Cutting Through Material",
    "solutions": [
      "Increase power settings",
      "Decrease cutting speed"
    ]
  }
]`} 
                          value={
                            typeof field.value === 'object' 
                              ? formatObjectForEditing(field.value) 
                              : field.value
                          }
                          onChange={(e) => field.onChange(e.target.value)}
                          className="font-mono h-60"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter troubleshooting info as a JSON array of objects with issue and solutions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <CardFooter className="flex justify-between px-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  createMutation.isPending || 
                  updateMutation.isPending || 
                  !form.formState.isValid
                }
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <MaterialIcon name="hourglass_empty" className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCreating ? "Create Device" : "Update Device"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}