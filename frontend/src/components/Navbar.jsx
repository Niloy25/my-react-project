import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { User, LogOut, ChevronDown } from "lucide-react";
import ProfileModal from "./dashboard/ProfileModal";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed. Try again.");
    }
  };

  return (
    <nav className="bg-[#0c0a1c]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/login"}
          className="text-lg font-bold text-primary-400 hover:text-primary-300 transition-colors"
        >
          MERN Auth
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Upgrade Button */}
              {!user.isPremium && (
                <button
                  onClick={() => {
                    const upgradeSection = document.getElementById("premium-upgrade-section");
                    if (upgradeSection) {
                      upgradeSection.scrollIntoView({ behavior: "smooth" });
                    } else {
                      navigate("/dashboard");
                      setTimeout(() => {
                        document.getElementById("premium-upgrade-section")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }
                  }}
                  className="text-xs bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold px-3 py-1.5 rounded-full transition-all duration-300 transform active:scale-95 shadow-md shadow-amber-500/10 flex items-center gap-1"
                >
                  👑 Upgrade
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative">
                {/* Trigger Button */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/[0.05] active:bg-white/[0.08] border border-transparent hover:border-white/10 transition duration-150 focus:outline-none"
                >
                  {/* Avatar image or initials */}
                  {user.profilePicture && !user.profilePicture.includes("default-user") ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-400 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                      {user.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "U"}
                    </div>
                  )}

                  {/* User name & VIP badge */}
                  <div className="flex items-center gap-1.5 hidden sm:flex text-left">
                    <span className="text-sm text-gray-200 font-semibold max-w-[120px] truncate">
                      {user.name}
                    </span>
                    {user.isPremium && (
                      <span
                        title="Premium VIP Member"
                        className="cursor-default bg-gradient-to-r from-amber-400 to-amber-600 text-[8px] text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-0.5"
                      >
                        👑 VIP
                      </span>
                    )}
                  </div>
                  
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block mr-1" />
                </button>

                {/* Dropdown Menu Backdrop */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-[#110e2c] border border-white/10 rounded-2xl shadow-2xl z-40 py-2 animate-fade-in-down">
                      {/* CSS Keyframes for dropdown animation */}
                      <style>{`
                        @keyframes slideInDown {
                          from { opacity: 0; transform: translateY(-8px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-fade-in-down {
                          animation: slideInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        }
                      `}</style>
                      
                      {/* Header details inside dropdown for mobile/responsive */}
                      <div className="px-4 py-2 border-b border-white/[0.06] sm:hidden">
                        <p className="text-[10px] text-gray-400 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-200 truncate">{user.name}</p>
                      </div>

                      {/* Dropdown Options */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.05] hover:text-primary-400 transition duration-150 font-medium flex items-center gap-2.5"
                      >
                        <User className="w-4 h-4" /> Profile Details
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-450 hover:bg-red-500/10 transition duration-150 font-medium flex items-center gap-2.5 border-t border-white/[0.06] mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-400 hover:text-primary-400 font-medium transition-colors"
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

      {/* Global Profile Details Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
