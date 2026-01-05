import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Loader } from 'lucide-react';
import { createMemory } from '../api/memories';
import { linkMemoryToProject } from '../api/projects';

interface AddMemoryToProjectModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddMemoryToProjectModal({
  projectId,
  projectName,
  isOpen,
  onClose,
}: AddMemoryToProjectModalProps) {
  const queryClient = useQueryClient();
  const [memoryText, setMemoryText] = useState('');

  const createAndLinkMutation = useMutation({
    mutationFn: async (text: string) => {
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      // Create the memory
      const memory = await createMemory({
        text,
        idempotencyKey,
      });

      // Link it to the project
      await linkMemoryToProject(projectId, memory.id);

      return memory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setMemoryText('');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (memoryText.trim()) {
      createAndLinkMutation.mutate(memoryText.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-6 w-6 text-green-600" />
              Add Memory to Project
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a new memory and link it to "{projectName}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={createAndLinkMutation.isPending}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="memory-text" className="block text-sm font-medium text-gray-700 mb-2">
              Memory
            </label>
            <textarea
              id="memory-text"
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={6}
              placeholder="What do you want to remember?"
              required
              disabled={createAndLinkMutation.isPending}
              autoFocus
            />
          </div>

          {createAndLinkMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                Error creating memory. Please try again.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              disabled={createAndLinkMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!memoryText.trim() || createAndLinkMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createAndLinkMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Memory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
