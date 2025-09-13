import { useNavigate } from "react-router-dom";
import { ImagePlus, Images, FileText } from "lucide-react";
import { useUser } from "@clerk/clerk-react";


export default function HeaderSection() {   
    const navigate = useNavigate();        
  const { user } = useUser();

  const userName = user?.fullName || "Admin";


return (
  <div className="p-6 bg-white rounded-2xl shadow-md">
    <h1 className="text-2xl font-bold text-gray-900">Designer Dashboard</h1>
    <p className="text-gray-600">Welcome back, {userName || "Designer"}!</p>
    <div className="mt-2">
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
        Designer
      </span>
    </div>

    <div className="flex flex-wrap mt-6 gap-4">
      <button
        onClick={() => navigate("/designer/gallery/add")}
        className="px-6 py-3 border-2 border-purple-500 rounded-lg text-purple-500 hover:bg-purple-500 hover:text-white flex items-center gap-2"
      >
        <ImagePlus size={18} /> Add Image to Gallery
      </button>
      <button
        onClick={() => navigate("/designer/gallery")}
        className="px-6 py-3 border-2 border-indigo-500 rounded-lg text-indigo-500 hover:bg-indigo-500 hover:text-white flex items-center gap-2"
      >
        <Images size={18} /> View Gallery
      </button>
      <button
        onClick={() => navigate("/designer/tasks")}
        className="px-6 py-3 border-2 border-teal-500 rounded-lg text-teal-500 hover:bg-teal-500 hover:text-white flex items-center gap-2"
      >
        <FileText size={18} /> View Assigned Requests
      </button>
    </div>
  </div>
);
}
