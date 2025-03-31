import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MaterialIcon } from "@/components/icons";
import { Device } from "@/lib/types";

interface DeviceSelectorProps {
  devices: Device[];
}

export default function DeviceSelector({ devices }: DeviceSelectorProps) {
  if (devices.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500">
        <MaterialIcon name="search_off" className="text-4xl mb-2 mx-auto" />
        <p>No devices found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device) => (
        <Link key={device.id} href={`/devices/${device.id}`}>
          <Card 
            className="border border-neutral-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer hover:border-primary"
          >
            <CardContent className="p-0">
              <div className="flex items-start">
                <div className="p-2 bg-neutral-100 rounded-full">
                  <MaterialIcon 
                    name={device.icon} 
                    className="text-neutral-600" 
                  />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium">{device.name}</h3>
                  <p className="text-sm text-neutral-600">
                    {device.shortDescription}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
