import React, { useState, useEffect } from "react";
import { User, Mail, ShieldAlert, KeyRound, Save } from "lucide-react";
import Modal from "../ui/Modal";
import SingleImageUpload from "../upload/SingleImageUpload";
import api from "../../utils/axios";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setProfilePicture(user.profilePicture || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, user]);

  const handleAvatarChange = (newUrl) => {
    setProfilePicture(newUrl);
    // Auto-save avatar update directly to user state
    updateUser({ profilePicture: newUrl });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error("Current password is required to change password");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Update Profile Info (Name, Email, Profile Picture)
      const resMe = await api.put("/users/me", {
        name: name.trim(),
        email: email.trim(),
        profilePicture,
      });

      let userUpdatePayload = {
        name: name.trim(),
        email: email.trim(),
        profilePicture,
      };

      // 2. Update Password if specified
      if (newPassword) {
        await api.put("/users/change-password", {
          currentPassword,
          newPassword,
        });
        toast.success("Password changed successfully. Please log in again.");
        onClose();
        // Clear auth state and redirect to login
        try {
          await api.post("/auth/logout");
        } catch (e) {
          // Ignore if already logged out by password change
        }
        window.location.href = "/login";
        return;
      }

      // Update local Redux state
      updateUser(userUpdatePayload);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to update profile";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" icon={User}>
      <form onSubmit={handleSave} className="p-6 space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center border-b border-gray-100 pb-6">
          <SingleImageUpload
            value={profilePicture}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Profile Info Section */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Basic Information
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all text-sm font-medium text-gray-800"
                placeholder="John Doe"
              />
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled={user?.googleId || user?.facebookId}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all text-sm font-medium text-gray-800 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="john@example.com"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
            {(user?.googleId || user?.facebookId) && (
              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" /> Social accounts cannot change their login email.
              </p>
            )}
          </div>
        </div>

        {/* Password Security Section (Skip for Social logins) */}
        {!user?.googleId && !user?.facebookId && (
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Security & Password
            </h4>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all text-sm font-medium text-gray-800"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all text-sm font-medium text-gray-800"
                  placeholder="Minimum 8 chars"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all text-sm font-medium text-gray-800"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="border-t border-gray-100 pt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition text-sm font-semibold text-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl transition text-sm font-semibold flex items-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;
