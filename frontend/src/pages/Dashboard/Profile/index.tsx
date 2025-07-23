import { useAuth } from '../../../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Your Profile</h1>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="mt-1 text-base text-gray-900 font-semibold">{user?.username}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-base text-gray-900 font-semibold">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-base text-gray-900 font-semibold">{user?.id}</dd>
            </div>
          </dl>
        </div>
        <div className="text-center text-gray-600">
          This is your profile page where you can view and manage your account details.
        </div>
      </div>
    </div>
  );
} 