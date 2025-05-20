import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-10 text-center space-y-8">
        <h1 className="text-4xl font-extrabold text-blue-700">Welcome to Auth App</h1>
        <p className="text-lg text-gray-700">A modern authentication boilerplate with React, Vite, Tailwind, and NestJS.</p>
        {user ? (
          <div className="space-y-4">
            <p className="text-xl text-gray-800 font-semibold">Hello, {user.username}!</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link to="/login" className="w-full sm:w-auto px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200">Sign In</Link>
            <Link to="/register" className="w-full sm:w-auto px-6 py-3 rounded-md bg-white border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 transition-colors duration-200">Create Account</Link>
          </div>
        )}
      </div>
    </div>
  );
} 