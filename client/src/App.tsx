import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DeviceCategory from "@/pages/DeviceCategory";
import DeviceDetail from "@/pages/DeviceDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories/:categoryId" component={DeviceCategory} />
      <Route path="/devices/:deviceId" component={DeviceDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
