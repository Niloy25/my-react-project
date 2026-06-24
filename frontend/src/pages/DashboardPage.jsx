import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Welcome banner */}
        <div
          className="bg-gradient-to-r from-primary-600 to-primary-700
                        rounded-2xl p-8 text-white mb-8"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-white/20 text-white
                            flex items-center justify-center text-2xl font-bold"
            >
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-primary-100 mt-1 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Role
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full
                ${
                  user?.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Member Since
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-2">
              {joinDate}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Account Status
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-600">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Profile Information
          </h2>
          <div className="space-y-4">
            {[
              { label: "Full Name", value: user?.name },
              { label: "Email", value: user?.email },
              { label: "User ID", value: user?._id || user?.id },
              { label: "Verified", value: user?.isVerified ? "Yes ✓" : "No" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row sm:items-center
                              py-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-medium text-gray-500 sm:w-36">
                  {label}
                </span>
                <span
                  className="text-sm text-gray-900 mt-0.5 sm:mt-0 font-medium
                                 break-all"
                >
                  {value || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Socket.IO real-time features coming in Day 6 ⚡
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
