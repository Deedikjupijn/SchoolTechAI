import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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

// Create the specifications schema with user-friendly input fields
const specificationSchema = z.object({
  key: z.string().min(1, "Specification name is required"),
  value: z.string().min(1, "Specification value is required")
});

// Create the material schema with user-friendly input fields
const materialSchema = z.object({
  material: z.string().min(1, "Material name is required"),
  compatibility: z.string().min(1, "Compatibility info is required")
});

// Create the usage instruction schema
const usageInstructionSchema = z.object({
  title: z.string().min(1, "Step title is required"),
  description: z.string().min(1, "Step description is required")
});

// Create the troubleshooting schema
const troubleshootingItemSchema = z.object({
  issue: z.string().min(1, "Issue description is required"),
  solutions: z.array(z.string().min(1, "Solution is required")).min(1, "At least one solution is required")
});

// Create a device schema for validation
const deviceFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  icon: z.string().min(1, "Icon name is required"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  specifications: z.array(specificationSchema).min(1, "At least one specification is required"),
  materials: z.array(materialSchema).min(1, "At least one material is required"),
  safetyRequirements: z.array(z.string().min(1, "Safety requirement is required")).min(1, "At least one safety requirement is required"),
  usageInstructions: z.array(usageInstructionSchema).min(1, "At least one usage instruction is required"),
  troubleshooting: z.array(troubleshootingItemSchema).min(1, "At least one troubleshooting item is required"),
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

  // Convert existing JSON data to form array format
  const convertSpecificationsToFormArray = (specs: Record<string, string> | undefined) => {
    if (!specs) return [{ key: "", value: "" }];
    return Object.entries(specs).map(([key, value]) => ({ key, value }));
  };

  const convertMaterialsToFormArray = (materials: Record<string, string> | undefined) => {
    if (!materials) return [{ material: "", compatibility: "" }];
    return Object.entries(materials).map(([material, compatibility]) => ({ material, compatibility }));
  };

  const convertSafetyRequirementsToFormArray = (requirements: string[] | undefined) => {
    if (!requirements || requirements.length === 0) return [{ requirement: "" }];
    return requirements.map(requirement => ({ requirement }));
  };

  const convertTroubleshootingToFormArray = (troubleshooting: any[] | undefined) => {
    if (!troubleshooting || troubleshooting.length === 0) return [{ issue: "", solutions: [""] }];
    return troubleshooting.map(item => ({
      issue: item.issue,
      solutions: item.solutions
    }));
  };

  // Function to convert form data back to the expected server format
  const convertFormDataToServerFormat = (values: DeviceFormValues) => {
    // Convert specifications array to object
    const specificationsObject = values.specifications.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // Convert materials array to object
    const materialsObject = values.materials.reduce((acc, { material, compatibility }) => {
      acc[material] = compatibility;
      return acc;
    }, {} as Record<string, string>);

    return {
      ...values,
      specifications: specificationsObject,
      materials: materialsObject
    };
  };

  // Create form with default values from device or empty values if creating
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: device?.name || "",
      icon: device?.icon || "",
      shortDescription: device?.shortDescription || "",
      categoryId: device?.categoryId || (categories[0]?.id || 0),
      specifications: convertSpecificationsToFormArray(device?.specifications as Record<string, string>),
      materials: convertMaterialsToFormArray(device?.materials as Record<string, string>),
      safetyRequirements: device?.safetyRequirements as string[] || [""],
      usageInstructions: device?.usageInstructions as { title: string, description: string }[] || [{ title: "", description: "" }],
      troubleshooting: convertTroubleshootingToFormArray(device?.troubleshooting),
    },
  });

  // Set up field arrays for dynamic fields
  const {
    fields: specificationFields,
    append: appendSpecification,
    remove: removeSpecification
  } = useFieldArray({
    control: form.control,
    name: "specifications"
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial
  } = useFieldArray({
    control: form.control,
    name: "materials"
  });

  const {
    fields: safetyFields,
    append: appendSafety,
    remove: removeSafety
  } = useFieldArray({
    control: form.control,
    name: "safetyRequirements"
  });

  const {
    fields: usageFields,
    append: appendUsage,
    remove: removeUsage
  } = useFieldArray({
    control: form.control,
    name: "usageInstructions"
  });

  const {
    fields: troubleshootingFields,
    append: appendTroubleshooting,
    remove: removeTroubleshooting
  } = useFieldArray({
    control: form.control,
    name: "troubleshooting"
  });

  // Dynamic field array for troubleshooting solutions
  const getTroubleshootingSolutionsArray = (index: number) => {
    return useFieldArray({
      control: form.control,
      name: `troubleshooting.${index}.solutions`
    });
  };

  // Create mutation to add a new device
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
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
    mutationFn: async (values: any) => {
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
    try {
      // Convert form data to expected server format
      const convertedValues = convertFormDataToServerFormat(values);

      if (isCreating) {
        createMutation.mutate(convertedValues);
      } else {
        updateMutation.mutate(convertedValues);
      }
    } catch (error: any) {
      toast({
        title: "Error processing form data",
        description: error.message || "An unexpected error occurred",
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
              <TabsContent value="specs" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Device Specifications</h3>
                  
                  {specificationFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-3 mb-4">
                      <FormField
                        control={form.control}
                        name={`specifications.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Specification Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Power, Cutting Area" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`specifications.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 400W, 1200mm x 900mm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeSpecification(index)}
                        disabled={specificationFields.length <= 1}
                      >
                        <MaterialIcon name="remove" className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendSpecification({ key: "", value: "" })}
                    className="mt-2"
                  >
                    <MaterialIcon name="add" className="h-4 w-4 mr-2" />
                    Add Specification
                  </Button>
                </div>
                
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Compatible Materials</h3>
                  
                  {materialFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-3 mb-4">
                      <FormField
                        control={form.control}
                        name={`materials.${index}.material`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Material</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Mild Steel, Stainless Steel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`materials.${index}.compatibility`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Compatibility</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Up to 10mm, Up to 8mm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeMaterial(index)}
                        disabled={materialFields.length <= 1}
                      >
                        <MaterialIcon name="remove" className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendMaterial({ material: "", compatibility: "" })}
                    className="mt-2"
                  >
                    <MaterialIcon name="add" className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>
              </TabsContent>
              
              {/* Safety */}
              <TabsContent value="safety" className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Safety Requirements</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  List all safety requirements for using this device. These will be prominently displayed.
                </p>
                
                {safetyFields.map((field, index) => (
                  <div key={index} className="flex items-end gap-3 mb-4">
                    <FormField
                      control={form.control}
                      name={`safetyRequirements.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Safety Requirement {index + 1}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Always wear safety goggles" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeSafety(index)}
                      disabled={safetyFields.length <= 1}
                    >
                      <MaterialIcon name="remove" className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSafety("")}
                >
                  <MaterialIcon name="add" className="h-4 w-4 mr-2" />
                  Add Safety Requirement
                </Button>
              </TabsContent>
              
              {/* Usage Instructions */}
              <TabsContent value="usage" className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Usage Instructions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add step-by-step instructions for using this device. These will be shown in order.
                </p>
                
                {usageFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Step {index + 1}</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeUsage(index)}
                        disabled={usageFields.length <= 1}
                        className="h-8 px-2"
                      >
                        <MaterialIcon name="delete" className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`usageInstructions.${index}.title`}
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel>Step Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Prepare Your Design" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`usageInstructions.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Step Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., Create or import your design using the provided CAD software" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendUsage({ title: "", description: "" })}
                >
                  <MaterialIcon name="add" className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </TabsContent>
              
              {/* Troubleshooting */}
              <TabsContent value="troubleshooting" className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Troubleshooting</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add common issues and their solutions to help users troubleshoot problems.
                </p>
                
                {troubleshootingFields.map((field, index) => {
                  const { fields: solutionFields, append: appendSolution, remove: removeSolution } = getTroubleshootingSolutionsArray(index);
                  
                  return (
                    <div key={field.id} className="p-4 border rounded-md mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Issue {index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeTroubleshooting(index)}
                          disabled={troubleshootingFields.length <= 1}
                          className="h-8 px-2"
                        >
                          <MaterialIcon name="delete" className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`troubleshooting.${index}.issue`}
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormLabel>Issue Description</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Laser Not Cutting Through Material" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mb-2">
                        <FormLabel>Solutions</FormLabel>
                        <FormDescription>List the steps to resolve this issue</FormDescription>
                      </div>
                      
                      {solutionFields.map((solutionField, solutionIndex) => (
                        <div key={solutionField.id} className="flex items-center gap-2 mb-2">
                          <FormField
                            control={form.control}
                            name={`troubleshooting.${index}.solutions.${solutionIndex}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input 
                                    placeholder={`Solution ${solutionIndex + 1}: e.g., Increase power settings`} 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeSolution(solutionIndex)}
                            disabled={solutionFields.length <= 1}
                          >
                            <MaterialIcon name="remove" className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendSolution("")}
                        className="mt-1"
                      >
                        <MaterialIcon name="add" className="h-4 w-4 mr-2" />
                        Add Solution
                      </Button>
                    </div>
                  );
                })}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendTroubleshooting({ issue: "", solutions: [""] })}
                >
                  <MaterialIcon name="add" className="h-4 w-4 mr-2" />
                  Add Issue
                </Button>
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
                  updateMutation.isPending
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