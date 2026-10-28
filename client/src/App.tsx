import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LogoGenerator from "./pages/LogoGenerator";
import VoiceTool from "./pages/VoiceTool";
import Converter from "./pages/Converter";
import CodingAssistant from "./pages/CodingAssistant";
import AIVideoTest from "./pages/AIVideoTest";
import UserHistory from "./pages/UserHistory";
import AdminDashboard from "./pages/AdminDashboard";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/logo" component={LogoGenerator} />
        <Route path="/voice" component={VoiceTool} />
        <Route path="/converter" component={Converter} />

        <Route path="/coding" component={CodingAssistant} />
        <Route path="/ai-video-test" component={AIVideoTest} />
        <Route path="/history" component={UserHistory} />
        <Route path="/admin/feedbacks" component={AdminDashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
