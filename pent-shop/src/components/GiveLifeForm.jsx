// src/components/GiveLifeForm.jsx
import React, { useState } from 'react';
import Swal from 'sweetalert2';

const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 
const GiveLifeForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    region: '',
    area: '',
    mobile: '',
    email: ''
  });

  const regions = [
    'Greater Accra',
    'Ashanti',
    'Eastern',
    'Western',
    'Central',
    'Volta',
    'Northern',
    'Upper East',
    'Upper West',
    'Bono',
    'Bono East',
    'Ahafo',
    'Oti',
    'North East',
    'Savannah',
    'Western North'
  ];

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.age ||
      !formData.region ||
      !formData.area ||
      !formData.mobile ||
      !formData.email
    ) {
      return Swal.fire('Error', 'Please fill all fields.', 'error');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/spiritual-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        Swal.fire('Thank you!', 'Your submission has been received.', 'success');
        setFormData({ fullName: '', age: '', region: '', area: '', mobile: '', email: '' });

        if (typeof onSuccess === 'function') {
          onSuccess(); // Close modal
        }
      } else {
        const data = await res.json();
        Swal.fire('Error', data.message || 'Failed to submit form.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Server error.', 'error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 text-black rounded shadow max-w-md mx-auto my-8"
    >
      <h2 className="text-2xl font-bold mb-4 text-red-600 text-center">
        Give Your Life to Christ
      </h2>

      <input
        type="text"
        name="fullName"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={handleChange}
        className="w-full p-2 mb-3 border rounded"
      />
      <input
        type="number"
        name="age"
        placeholder="Age"
        value={formData.age}
        onChange={handleChange}
        className="w-full p-2 mb-3 border rounded"
      />
      <select
        name="region"
        value={formData.region}
        onChange={handleChange}
        className="w-full p-2 mb-3 border rounded"
        required
      >
        <option value="">Select Region</option>
        {regions.map(region => (
          <option key={region} value={region}>{region}</option>
        ))}
      </select>
      <input
        type="text"
        name="area"
        placeholder="Area"
        value={formData.area}
        onChange={handleChange}
        className="w-full p-2 mb-3 border rounded"
      />
      <input
        type="tel"
        name="mobile"
        placeholder="Mobile Number"
        value={formData.mobile}
        onChange={handleChange}
        className="w-full p-2 mb-3 border rounded"
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full p-2 mb-3 border rounded"
      />

      <button
        type="submit"
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
      >
        Submit
      </button>
    </form>
  );
};

export default GiveLifeForm;
