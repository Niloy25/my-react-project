// import React from "react";
// import { User } from "lucide-react";

// export const ProfileInfoCard = ({ user }) => {
//   return (
//     <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
//       <div className="flex items-center justify-between mb-8">
//         <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {[
//           { label: "Full Name", value: user?.name, icon: User },
//           { label: "Email Address", value: user?.email },
//           {
//             label: "Verification Status",
//             value: user?.isVerified ? "Verified ✓" : "Not Verified",
//           },
//         ].map(({ label, value, icon: Icon }) => (
//           <div
//             key={label}
//             className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
//           >
//             {Icon && <Icon className="w-5 h-5 text-gray-400 mt-1" />}
//             <div>
//               <p className="text-sm text-gray-500 font-medium">{label}</p>
//               <p className="text-gray-900 font-semibold mt-1 break-all">
//                 {value || "N/A"}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ProfileInfoCard;
