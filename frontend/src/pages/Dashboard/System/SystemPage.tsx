import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '../../../components/ui/Card';
import { systemService, type SystemStats } from '../../../services/systemService';
import { userService } from '../../../services/userService';
import { useToast } from '../../../hooks/useToast';
import { withPageLoader } from '../../../components/hoc/withPageLoader';

interface SystemPageProps {
  isLoading?: boolean;
}

const SystemPageComponent: React.FC<SystemPageProps> = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingTokenFor, setGeneratingTokenFor] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const toast = useToast();

  const loadStats = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsRefreshing(true);
      setError(null);
      console.log('Fetching system stats...');
      const data = await systemService.getSystemStats();
      console.log('System stats loaded in component:', data);
      if (isMountedRef.current) {
        setStats(data);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to load system stats:', error);
      if (isMountedRef.current) {
        setError('Failed to load system statistics');
        toast.error('Failed to load system statistics');
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    console.log('SystemPage mounted, loading initial stats...');
    // Initial load
    loadStats();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      loadStats();
    }, 30000);

    // Cleanup function
    return () => {
      console.log('SystemPage unmounting...');
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [loadStats]);

  useEffect(() => {
    console.log('Stats updated:', stats);
  }, [stats]);

  const handleGenerateToken = async (userId: string) => {
    if (!isMountedRef.current) return;

    try {
      setGeneratingTokenFor(userId);
      const response = await userService.generateRegisterToken(userId);
      if (isMountedRef.current) {
        await navigator.clipboard.writeText(response.token);
        toast.success('Token copied to clipboard');
        loadStats(); // Refresh data to show updated registration status
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
      if (isMountedRef.current) {
        toast.error('Failed to generate registration token');
      }
    } finally {
      if (isMountedRef.current) {
        setGeneratingTokenFor(null);
      }
    }
  };

  if (error && !stats) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => loadStats()} 
          className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Overview</h1>
        <button 
          onClick={() => loadStats()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
        >
          <span>Refresh</span>
          {isRefreshing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          )}
        </button>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Admin Users</p>
                <p className="text-2xl font-bold">{stats.totalAdminUsers}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Completed Registrations</p>
                <p className="text-2xl font-bold">{stats.totalCompletedRegistrations}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">2FA Enabled</p>
                <p className="text-2xl font-bold">{stats.total2FAEnabled}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">User List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      2FA Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Admin Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 
                            user.role === 'USER' ? 'bg-green-100 text-green-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.isTwoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.isRegistrationComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {user.isRegistrationComplete ? 'Complete' : 'Incomplete'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastAdminLogin ? new Date(user.lastAdminLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!user.isRegistrationComplete && (
                          <button
                            onClick={() => handleGenerateToken(user.id)}
                            disabled={generatingTokenFor === user.id}
                            className={`px-3 py-1 rounded text-sm font-medium 
                              ${generatingTokenFor === user.id 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                          >
                            {generatingTokenFor === user.id ? 'Generating...' : 'Generate Token'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const SystemPage = withPageLoader(SystemPageComponent); 