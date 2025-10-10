import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Calendar, Heart } from "lucide-react";

const SpiritualSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 
  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/spiritual-submissions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch spiritual submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error("❌ Error fetching spiritual submissions:", err);
      // Swal.fire("Error", "Failed to fetch spiritual submissions", "error");
      alert("Failed to fetch spiritual submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg mt-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading spiritual submissions...</span>
        </div>
      </div>
    );
  }

  if (!submissions.length) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg mt-8 text-center">
        <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No spiritual submissions yet.</p>
        <p className="text-gray-500 text-sm mt-2">Submissions will appear here when people give their lives to Christ.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg mt-8 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
        <div className="flex items-center">
          <Heart className="w-8 h-8 text-white mr-3" />
          <h2 className="text-2xl font-bold text-white">
            Give Your Life to Christ Submissions
          </h2>
        </div>
        <p className="text-red-100 mt-2">
          {submissions.length} {submissions.length === 1 ? 'person has' : 'people have'} responded to the call
        </p>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {submissions.map((sub, index) => (
            <div key={sub.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{sub.fullName}</h3>
                    <p className="text-sm text-gray-500">Age {sub.age}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  New Believer
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span><strong>Region:</strong> {sub.region}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span><strong>Area:</strong> {sub.area}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span><strong>Mobile:</strong> {sub.mobile}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span><strong>Email:</strong> {sub.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Submitted on: {new Date(sub.submittedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {submissions.length > 3 && (
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-sm text-gray-600">
            Showing {submissions.length} submissions. Scroll to view all.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpiritualSubmissions;