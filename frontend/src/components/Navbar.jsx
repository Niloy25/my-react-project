import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed. Try again.");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/login"}
          className="text-lg font-bold text-primary-600 hover:text-primary-700"
        >
          MERN Auth
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Avatar with initials */}
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U"}
              </div>

              {/* User name */}
              <span className="text-sm text-gray-700 font-medium hidden sm:block">
                {user.name}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600
                           transition-colors duration-150 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-primary-600 font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm bg-primary-600 text-white px-4 py-1.5
                           rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
