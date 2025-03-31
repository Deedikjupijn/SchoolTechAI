import { Skeleton } from "@/components/ui/skeleton";
import { MaterialIcon } from "@/components/icons";
import { Device } from "@/lib/types";

interface DeviceInfoPanelProps {
  device?: Device;
  isLoading: boolean;
}

export default function DeviceInfoPanel({ device, isLoading }: DeviceInfoPanelProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full overflow-y-auto md:border-r border-neutral-100 p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-64 ml-3" />
        </div>
        
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="w-full h-full overflow-y-auto md:border-r border-neutral-100 p-6 flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <MaterialIcon name="error_outline" className="text-4xl mb-2" />
          <p>Device information not available</p>
        </div>
      </div>
    );
  }

  // Parse JSON fields from device
  const specifications = device.specifications as Record<string, string>;
  const materials = device.materials as Record<string, string>;
  const safetyRequirements = device.safetyRequirements as string[];
  const usageInstructions = device.usageInstructions as Array<{
    title: string;
    description: string;
  }>;
  const troubleshooting = device.troubleshooting as Array<{
    issue: string;
    solutions: string[];
  }>;

  return (
    <div className="w-full h-full overflow-y-auto md:border-r border-neutral-100">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center mb-4">
          <span className="material-icons text-primary p-2 bg-primary bg-opacity-20 rounded-full">
            {device.icon}
          </span>
          <h2 className="text-2xl font-medium ml-3">{device.name}</h2>
        </div>
        
        {/* Safety Information Card */}
        <div className="bg-[#ff5722] bg-opacity-10 border-l-4 border-[#ff5722] p-4 rounded mb-6">
          <h3 className="flex items-center text-lg font-medium text-[#e64a19] mb-2">
            <MaterialIcon name="warning" className="mr-2" />
            Safety Requirements
          </h3>
          <ul className="ml-8 list-disc text-[#e64a19]">
            {safetyRequirements.map((requirement, index) => (
              <li key={index} className="mb-1">{requirement}</li>
            ))}
          </ul>
        </div>
        
        {/* Device Information */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Equipment Overview</h3>
          <p className="mb-4">{device.shortDescription}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <h4 className="font-medium text-primary mb-2">Specifications</h4>
              <ul className="text-sm space-y-2">
                {Object.entries(specifications).map(([key, value], index) => (
                  <li key={index}><span className="font-medium">{key}:</span> {value}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <h4 className="font-medium text-primary mb-2">Material Compatibility</h4>
              <ul className="text-sm space-y-2">
                {Object.entries(materials).map(([key, value], index) => (
                  <li key={index}><span className="font-medium">{key}:</span> {value}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Usage Instructions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Usage Instructions</h3>
          
          <ol className="space-y-4 ml-5 list-decimal">
            {usageInstructions.map((instruction, index) => (
              <li key={index}>
                <h4 className="font-medium">{instruction.title}</h4>
                <p className="text-sm">{instruction.description}</p>
              </li>
            ))}
          </ol>
        </div>
        
        {/* Troubleshooting */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Troubleshooting Common Issues</h3>
          
          <div className="space-y-4">
            {troubleshooting.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="font-medium text-[#f44336] mb-2">{item.issue}</h4>
                <p className="text-sm">
                  If you encounter this issue, check:
                </p>
                <ul className="text-sm list-disc ml-5 mt-2">
                  {item.solutions.map((solution, sIndex) => (
                    <li key={sIndex}>{solution}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
