import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import RateLimitBanner from "@/components/RateLimitBanner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import { Courses, CourseNew } from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import CourseManage from "@/pages/CourseManage";
import ActivityDetail from "@/pages/ActivityDetail";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";

function PageTransition({ children }) {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return <div key={location.pathname} className="animate-fade-in">{children}</div>;
}

function RootRoute() {
  const { user } = useAuth();
  if (user === null) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Toaster position="top-right" toastOptions={{ style: { border: "2px solid #0A0A0A", boxShadow: "4px 4px 0 0 #0A0A0A", borderRadius: "4px", fontWeight: 600 }}} />
            <RateLimitBanner />
              <PageTransition>
                <Routes>
                  <Route path="/" element={<RootRoute />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                  <Route path="/courses/new" element={<ProtectedRoute role="teacher"><CourseNew /></ProtectedRoute>} />
                  <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                  <Route path="/courses/:id/manage" element={<ProtectedRoute role="teacher"><CourseManage /></ProtectedRoute>} />
                  <Route path="/courses/:courseId/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route path="/activities/:id" element={<ProtectedRoute><ActivityDetail /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PageTransition>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
