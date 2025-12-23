import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createMemory } from '../api/memories';
import { createDraft } from '../utils/idempotency';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const memorySchema = z.object({
  text: z.string().min(1, 'Memory text is required'),
});

export function CapturePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem('memoryDraft');
    if (saved) {
      return JSON.parse(saved);
    }
    return createDraft();
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(memorySchema),
    defaultValues: { text: draft.text || '' },
  });

  const onSubmit = async (data: { text: string }) => {
    setError('');
    setLoading(true);

    try {
      const memoryDraft = createDraft(data.text);
      setDraft(memoryDraft);
      localStorage.setItem('memoryDraft', JSON.stringify(memoryDraft));

      await createMemory(memoryDraft);
      
      // Clear draft
      localStorage.removeItem('memoryDraft');
      setDraft(createDraft());
      reset();
    } catch (err: any) {
      setError(err.message || 'Failed to save memory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Capture Memory</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            What do you want to remember?
          </label>
          <textarea
            id="text"
            {...register('text')}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Write your memory here..."
          />
          {errors.text && (
            <p className="mt-1 text-sm text-red-600">{errors.text.message}</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Memory'}
          </button>
        </div>
      </form>
    </div>
  );
}

