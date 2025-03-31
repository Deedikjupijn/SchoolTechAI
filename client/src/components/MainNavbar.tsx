import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MainNavbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const isAdminPage = location.startsWith('/admin');
  
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          {isMobile && onToggleSidebar && (
            <Button 
              variant="ghost" 
              size="icon"
              className="mr-2" 
              onClick={onToggleSidebar}
            >
              <MaterialIcon name="menu" className="h-6 w-6" />
            </Button>
          )}
          <Link to="/" className="flex items-center space-x-2">
            <MaterialIcon name="build" className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Workshop Assistant</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {!isMobile && (
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" asChild className={location === '/' ? 'bg-muted' : ''}>
                <Link to="/">
                  <MaterialIcon name="home" className="mr-2 h-5 w-5" />
                  Home
                </Link>
              </Button>
              
              {user?.isAdmin && (
                <Button variant="ghost" asChild className={isAdminPage ? 'bg-muted' : ''}>
                  <Link to="/admin">
                    <MaterialIcon name="admin_panel_settings" className="mr-2 h-5 w-5" />
                    Admin
                  </Link>
                </Button>
              )}
            </nav>
          )}
          
          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}