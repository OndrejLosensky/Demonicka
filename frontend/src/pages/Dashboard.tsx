import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Welcome to your Dashboard</h1>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="mt-1 text-base text-gray-900 font-semibold">{user?.username}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-base text-gray-900 font-semibold">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-base text-gray-900 font-semibold">{user?.id}</dd>
            </div>
          </dl>
        </div>
        <div className="text-center text-gray-600">
          This is a protected page that only authenticated users can access.<br />
          You can add more features and content to this dashboard as needed.
        </div>
      </div>
    </div>
  );
} 