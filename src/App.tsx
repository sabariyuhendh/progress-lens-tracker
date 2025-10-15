import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import SimpleLogin from "./pages/SimpleLogin";
import SimpleStudentView from "./pages/SimpleStudentView";

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SimpleLogin />} />
            <Route path="/student" element={<SimpleStudentView />} />
            <Route path="*" element={<SimpleLogin />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;