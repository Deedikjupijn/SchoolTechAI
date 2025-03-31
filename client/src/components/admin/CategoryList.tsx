import { useQuery } from "@tanstack/react-query";
import { fetchDeviceCategories } from "@/lib/api";
import { DeviceCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { MaterialIcon } from "@/components/icons";
import { Loader2 } from "lucide-react";

interface CategoryListProps {
  onSelect: (category: DeviceCategory) => void;
}

export default function CategoryList({ onSelect }: CategoryListProps) {
  // Fetch all categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: fetchDeviceCategories,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-medium">No Categories</h3>
        <p className="text-muted-foreground mt-2">
          No device categories have been added yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories && categories.map((category: DeviceCategory) => (
        <Card 
          key={category.id} 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => onSelect(category)}
        >
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MaterialIcon name={category.icon} className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">{category.name}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}