import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ArrowLeft, Loader, Link as LinkIcon, FileText, Tag, Calendar, User, ExternalLink } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { addUrl, getUserUrlPages } from '../api/urlPages';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function UrlBuilderPage() {
    const helpPopup = useHelpPopup('urls');
const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analyzedUrlPage, setAnalyzedUrlPage] = useState<any>(null);

  // Fetch user URL pages
  const { data: urlPages, isLoading: loadingUrlPages, refetch } = useQuery({
    queryKey: ['user-url-pages'],
    queryFn: () => getUserUrlPages(0, 50),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (err) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await addUrl({ url: url.trim() });
      setAnalyzedUrlPage(result);
      setSuccess(`URL analyzed successfully! ${result.isDuplicate ? '(Duplicate detected - using existing URL)' : ''}`);

      // Clear input
      setUrl('');

      // Refetch URL pages list
      refetch();
    } catch (err: any) {
      console.error('Add URL error:', err);
      setError(err.message || 'Failed to analyze URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/capture')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">URL Builder</h1>
        <p className="text-gray-600 mt-2">
          Save web pages and let AI extract metadata and summaries automatically
        </p>
      </div>

      {/* URL Input Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-blue-600" />
          Add URL
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
              Web Page URL
            </label>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Analyze URL
              </>
            )}
          </button>
        </form>
      </div>

      {/* Analyzed URL Display */}
      {analyzedUrlPage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-600" />
            Analysis Results
          </h2>

          <div className="space-y-4">
            {/* URL and Title */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {analyzedUrlPage.title || 'Untitled'}
              </h3>
              <a
                href={analyzedUrlPage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                {analyzedUrlPage.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Thumbnail */}
            {analyzedUrlPage.imageUrl && (
              <div>
                <img
                  src={analyzedUrlPage.imageUrl}
                  alt={analyzedUrlPage.title || 'Page preview'}
                  className="max-h-64 max-w-full object-contain rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* Summary */}
            {analyzedUrlPage.summary && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Summary</h4>
                <p className="text-gray-600 text-sm">{analyzedUrlPage.summary}</p>
              </div>
            )}

            {/* Description */}
            {analyzedUrlPage.description && analyzedUrlPage.description !== analyzedUrlPage.summary && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
                <p className="text-gray-600 text-sm">{analyzedUrlPage.description}</p>
              </div>
            )}

            {/* Tags */}
            {analyzedUrlPage.tags && analyzedUrlPage.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {analyzedUrlPage.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Category */}
              {analyzedUrlPage.metadata?.category && (
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">{analyzedUrlPage.metadata.category}</p>
                </div>
              )}

              {/* Sentiment */}
              {analyzedUrlPage.metadata?.sentiment && (
                <div>
                  <p className="text-sm text-gray-500">Sentiment</p>
                  <p className="font-medium text-gray-900 capitalize">{analyzedUrlPage.metadata.sentiment}</p>
                </div>
              )}

              {/* Author */}
              {analyzedUrlPage.author && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Author
                  </p>
                  <p className="font-medium text-gray-900">{analyzedUrlPage.author}</p>
                </div>
              )}

              {/* Site Name */}
              {analyzedUrlPage.siteName && (
                <div>
                  <p className="text-sm text-gray-500">Site</p>
                  <p className="font-medium text-gray-900">{analyzedUrlPage.siteName}</p>
                </div>
              )}

              {/* Published Date */}
              {analyzedUrlPage.publishedAt && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Published
                  </p>
                  <p className="font-medium text-gray-900">
                    {new Date(analyzedUrlPage.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Key Points */}
            {analyzedUrlPage.metadata?.keyPoints && analyzedUrlPage.metadata.keyPoints.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Key Points</h4>
                <ul className="list-disc list-inside space-y-1">
                  {analyzedUrlPage.metadata.keyPoints.map((point: string, idx: number) => (
                    <li key={idx} className="text-gray-600 text-sm">{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(`/app/capture?urlPageId=${analyzedUrlPage.id}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Memory with this URL
              </button>
              <button
                onClick={() => {
                  setAnalyzedUrlPage(null);
                  setSuccess('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Analyze Another URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Pages Gallery */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Your Saved URLs ({urlPages?.length || 0})
        </h2>

        {loadingUrlPages ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : urlPages && urlPages.length > 0 ? (
          <div className="space-y-4">
            {urlPages.map((urlPage) => (
              <div
                key={urlPage.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setAnalyzedUrlPage(urlPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {urlPage.imageUrl && (
                    <img
                      src={urlPage.imageUrl}
                      alt={urlPage.title || 'Page preview'}
                      className="w-24 h-24 object-cover rounded flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {urlPage.title || 'Untitled'}
                    </h3>

                    {/* URL */}
                    <a
                      href={urlPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mb-2 flex items-center gap-1 truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {urlPage.url}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>

                    {/* Description */}
                    {urlPage.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {urlPage.description}
                      </p>
                    )}

                    {/* Tags */}
                    {urlPage.tags && urlPage.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {urlPage.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {urlPage.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{urlPage.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {urlPage.siteName && <span>{urlPage.siteName}</span>}
                      <span>•</span>
                      <span>{new Date(urlPage.createdAt).toLocaleDateString()}</span>
                      {urlPage.memoryLinks && urlPage.memoryLinks.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">
                            {urlPage.memoryLinks.length} {urlPage.memoryLinks.length === 1 ? 'memory' : 'memories'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No URLs saved yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first URL to get started</p>
          </div>
        )}
      </div>
      {/* Help Popup */}
      <HelpPopup
        pageKey="urls"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}