import { useQuery } from "@tanstack/react-query";
import { DeviceCategory } from "@/lib/types";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface CategoryListProps {
  onSelect: (category: DeviceCategory) => void;
}

export default function CategoryList({ onSelect }: CategoryListProps) {
  const { toast } = useToast();
  
  // Get all categories
  const { data: categories, isLoading, error } = useQuery<DeviceCategory[]>({
    queryKey: ["/api/device-categories"],
  });

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

  if (error || !categories) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <MaterialIcon name="error" className="h-12 w-12 text-destructive mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Categories</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error ? error.message : "An unexpected error occurred."}
            </p>
            <Button 
              variant="outline" 
              className="mx-auto"
              onClick={() => window.location.reload()}
            >
              <MaterialIcon name="refresh" className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categories && categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <MaterialIcon name="category" className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">No Categories Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new category to get started
            </p>
          </div>
        </CardContent>
      </Card>
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