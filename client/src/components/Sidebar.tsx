import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import { DeviceCategory } from "@/lib/types";
import UserMenu from "@/components/UserMenu";

interface SidebarProps {
  activeCategory?: number;
}

export default function Sidebar({ activeCategory }: SidebarProps) {
  const [location, setLocation] = useLocation();
  
  const { data: categories, isLoading } = useQuery<DeviceCategory[]>({
    queryKey: ["/api/device-categories"],
  });

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-neutral-100 h-full">
      <div className="p-4 border-b border-neutral-100">
        <Link href="/">
          <h1 className="text-xl font-medium flex items-center cursor-pointer">
            <MaterialIcon name="school" className="mr-2 text-primary" />
            MetalWorks AI
          </h1>
        </Link>
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
              >
                <MaterialIcon name={category.icon} className="mr-2" />
                {category.name}
              </Button>
            </Link>
          ))
        )}
      </nav>
      
      {/* User Settings & Account */}
      <div className="p-4 border-t border-neutral-100 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <UserMenu />
          <Button variant="ghost" size="sm" className="flex items-center text-neutral-600 hover:text-primary">
            <MaterialIcon name="help_outline" className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
