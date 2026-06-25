import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
  return (
    <BrowserRouter>
      <SocketProvider>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: "14px",
              borderRadius: "10px",
            },
          }}
        />

        {/* Navbar on every page */}
        <Navbar />

        <Routes>
          {/* Public routes */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — wrap in PrivateRoute */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Redirect root to dashboard (PrivateRoute will handle redirect to login) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-200">404</h1>
                  <p className="text-gray-500 mt-2">Page not found</p>
                </div>
              </div>
            }
          />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
};

export default App;
