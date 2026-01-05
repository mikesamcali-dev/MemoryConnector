import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Link2, ExternalLink } from 'lucide-react';
import { getUserUrlPages } from '../api/urlPages';
import { linkUrlPageToProject } from '../api/projects';

interface ProjectLinkUrlPageModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  linkedUrlPageIds: string[];
}

export function ProjectLinkUrlPageModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  linkedUrlPageIds,
}: ProjectLinkUrlPageModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all URL pages
  const { data: urlPages, isLoading } = useQuery({
    queryKey: ['urlpages-all'],
    queryFn: () => getUserUrlPages(0, 100),
    enabled: isOpen,
  });

  const linkMutation = useMutation({
    mutationFn: (urlPageId: string) => linkUrlPageToProject(projectId, urlPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const handleLink = (urlPageId: string) => {
    linkMutation.mutate(urlPageId);
  };

  if (!isOpen) return null;

  // Filter by search term
  const filteredUrlPages = urlPages?.filter((urlPage: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      urlPage.title?.toLowerCase().includes(searchLower) ||
      urlPage.url?.toLowerCase().includes(searchLower) ||
      urlPage.description?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="h-6 w-6 text-blue-600" />
              Link URLs to Project
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add URL pages to "{projectName}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search URL pages by title or URL..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading URL pages...</p>
            </div>
          )}

          {!isLoading && filteredUrlPages.length === 0 && (
            <div className="text-center py-12">
              <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No URL pages found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
              )}
            </div>
          )}

          {!isLoading && filteredUrlPages.length > 0 && (
            <div className="space-y-3">
              {filteredUrlPages.map((urlPage: any) => {
                const isLinked = linkedUrlPageIds.includes(urlPage.id);

                return (
                  <div
                    key={urlPage.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isLinked
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                          {urlPage.title || 'Untitled'}
                        </h3>
                        <a
                          href={urlPage.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
                        >
                          <span className="truncate">{urlPage.url}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                        {urlPage.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {urlPage.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Added {new Date(urlPage.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleLink(urlPage.id)}
                        disabled={isLinked || linkMutation.isPending}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                          isLinked
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        }`}
                      >
                        {isLinked ? 'Linked ✓' : 'Link'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {linkedUrlPageIds.length} {linkedUrlPageIds.length === 1 ? 'URL' : 'URLs'} linked
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
