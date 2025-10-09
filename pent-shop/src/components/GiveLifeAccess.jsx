import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const GiveLifeAccess = ({ children }) => {
  const navigate = useNavigate();
  const [answered, setAnswered] = useState(false);
  const [gaveLife, setGaveLife] = useState(null);

  const handleAnswer = (answer) => {
    setAnswered(true);
    setGaveLife(answer);
    if (!answer) {
      // Redirect to form page if user says NO
      navigate("/give-life-form");
    }
  };

  if (answered && gaveLife) {
    // If user says YES, show the children (protected content)
    return <>{children}</>;
  }

  // Otherwise, show welcome + question
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 font-[poppins] p-6">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Welcome!</h1>
      <p className="mb-8 text-center max-w-md text-lg">
        Have you given your life to Christ?
      </p>
      <div className="space-x-4">
        <button
          onClick={() => handleAnswer(true)}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Yes
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          No
        </button>
      </div>
    </div>
  );
};

export default GiveLifeAccess;
