import React from 'react';
import { FaTriangleExclamation } from 'react-icons/fa6';

const Page404 = () => {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4'>
      <FaTriangleExclamation className='text-red-600 text-6xl mb-5' />
      <h1 className='text-4xl md:text-6xl lg:text-8xl font-bold mb-4 text-gray-800'>404 Not Found</h1>
      <p className='text-lg md:text-xl lg:text-2xl text-gray-600 mb-6'>
        The page you're looking for doesn't exist. You can go back to the home page.
      </p>
      <a
        className='px-6 py-3 bg-red-600 text-white rounded-sm hover:bg-red-800 transition duration-300 ease-in-out text-lg md:text-xl'
        href="/"
      >
        Back to Home Page
      </a>
    </div>
  );
};

export default Page404;
