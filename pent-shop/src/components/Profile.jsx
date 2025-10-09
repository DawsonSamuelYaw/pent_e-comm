import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!storedUser) {
      navigate('/login'); // Redirect if not logged in
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: "You will be logged out from your account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('loggedInUser');
        navigate('/login');
      }
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-[Poppins]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Profile</h1>
        <p className="text-gray-700 mb-2"><strong>Name:</strong> {user.name}</p>
        <p className="text-gray-700 mb-4"><strong>Email:</strong> {user.email}</p>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
