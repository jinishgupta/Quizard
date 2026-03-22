import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1A] p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <h1 className="text-9xl font-bold text-[#1D4ED8] opacity-20">404</h1>
          </div>
        </div>

        <h2 className="text-2xl font-medium text-white mb-2">Page Not Found</h2>
        <p className="text-[#9CA3AF] mb-8">
          The page you're looking for doesn't exist. Let's get you back!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1E40AF] transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
