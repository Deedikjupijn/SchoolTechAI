import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import { DeviceCategory } from "@/lib/types";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/use-auth";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory?: number;
}

export default function MobileSidebar({ isOpen, onClose, activeCategory }: MobileSidebarProps) {
  const { data: categories, isLoading } = useQuery<DeviceCategory[]>({
    queryKey: ["/api/device-categories"],
  });
  const { user } = useAuth();

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sidebarContent = document.getElementById('sidebar-content');
      
      if (isOpen && sidebarContent && !sidebarContent.contains(target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div 
        id="sidebar-content"
        className="bg-white w-64 h-full p-0 transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <Link href="/" onClick={onClose}>
            <h1 className="text-xl font-medium flex items-center cursor-pointer">
              <MaterialIcon name="school" className="mr-2 text-primary" />
              MetalWorks AI
            </h1>
          </Link>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </Button>
        </div>
        
        {/* Device Categories */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <h2 className="text-xs uppercase font-medium text-neutral-500 tracking-wider">DEVICE CATEGORIES</h2>
          </div>
          
          {isLoading ? (
            <div className="px-4 py-2">Loading categories...</div>
          ) : (
            categories?.map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`}>
                <Button 
                  variant="ghost"
                  className={`w-full justify-start px-4 py-2 ${activeCategory === category.id ? 'text-primary' : 'text-neutral-700 hover:text-primary'}`}
                  onClick={onClose}
                >
                  <MaterialIcon name={category.icon} className="mr-2" />
                  {category.name}
                </Button>
              </Link>
            ))
          )}
        </nav>
        
        {/* User Settings & Account */}
        <div className="p-4 border-t border-neutral-100">
          {user ? (
            <div className="flex items-center justify-between">
              <UserMenu />
              <Button variant="ghost" size="sm" className="flex items-center text-neutral-600 hover:text-primary">
                <MaterialIcon name="help_outline" className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/auth" onClick={onClose}>
              <Button className="w-full" size="sm">
                <MaterialIcon name="login" className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
          
          {user?.isAdmin && (
            <Link href="/admin" onClick={onClose}>
              <Button variant="outline" className="w-full mt-3" size="sm">
                <MaterialIcon name="admin_panel_settings" className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
