import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MainNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const isAdminPage = location.startsWith('/admin');
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <MaterialIcon name="build" className="h-6 w-6 text-primary" />
            <span className="font-bold">Workshop Assistant</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!isMobile && (
            <nav className="flex items-center space-x-2 mr-4">
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
          
          {user ? (
            <UserMenu />
          ) : (
            <Button asChild>
              <Link to="/auth">
                <MaterialIcon name="login" className="mr-2 h-5 w-5" />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}