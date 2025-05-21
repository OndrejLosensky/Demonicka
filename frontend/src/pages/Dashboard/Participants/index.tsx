import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface Participant {
  id: number;
  name: string;
  gender: 'MALE' | 'FEMALE';
  beerCount: number;
  lastBeerTime: Date | null;
}

interface ParticipantFormData {
  name: string;
  gender: 'MALE' | 'FEMALE';
}

export default function ParticipantsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<ParticipantFormData>({
    name: '',
    gender: 'MALE',
  });
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  // Fetch participants
  const { data: participants, isLoading } = useQuery<Participant[]>({
    queryKey: ['participants'],
    queryFn: async () => {
      const response = await api.get('/participants');
      return response.data;
    },
  });

  // Add participant mutation
  const addParticipant = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      const response = await api.post('/participants', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      setShowModal(false);
      resetForm();
    },
  });

  // Update participant mutation
  const updateParticipant = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ParticipantFormData }) => {
      const response = await api.patch(`/participants/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      setShowModal(false);
      resetForm();
    },
  });

  // Delete participant mutation
  const deleteParticipant = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/participants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      setParticipantToDelete(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingParticipant) {
      updateParticipant.mutate({ id: editingParticipant.id, data: formData });
    } else {
      addParticipant.mutate(formData);
    }
  };

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      gender: participant.gender,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', gender: 'MALE' });
    setEditingParticipant(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Účastníci</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Přidat účastníka
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jméno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pohlaví
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Počet piv
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Poslední pivo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants?.map((participant) => (
              <tr key={participant.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {participant.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.gender === 'MALE' ? 'Muž' : 'Žena'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.beerCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.lastBeerTime
                    ? format(new Date(participant.lastBeerTime), 'dd.MM.yyyy HH:mm')
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(participant)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Upravit
                  </button>
                  <button
                    onClick={() => setParticipantToDelete(participant.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingParticipant ? 'Upravit účastníka' : 'Přidat účastníka'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Jméno
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Pohlaví
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="MALE">Muž</option>
                  <option value="FEMALE">Žena</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingParticipant ? 'Uložit' : 'Přidat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {participantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Smazat účastníka</h2>
            <p className="mb-6">Opravdu chcete smazat tohoto účastníka? Tato akce je nevratná.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setParticipantToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Zrušit
              </button>
              <button
                onClick={() => {
                  if (participantToDelete) {
                    deleteParticipant.mutate(participantToDelete);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 