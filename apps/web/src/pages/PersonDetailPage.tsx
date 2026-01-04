import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPerson, getPersonRelationships } from '../api/admin';
import { ArrowLeft, User, Mail, Phone, Calendar, FileText, Users, Video, Film } from 'lucide-react';

export function PersonDetailPage() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();

  // Fetch person details (includes memories)
  const { data: person, isLoading: personLoading } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => getPerson(personId!),
    enabled: !!personId,
  });

  // Fetch person relationships
  const { data: relationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['person-relationships', personId],
    queryFn: () => getPersonRelationships(personId!),
    enabled: !!personId,
  });

  const isLoading = personLoading || relationshipsLoading;

  // Extract different types of content from memories
  const regularMemories = person?.memories?.filter((m: any) => !m.youtubeVideo && !m.tiktokVideo) || [];
  const youtubeMemories = person?.memories?.filter((m: any) => m.youtubeVideo) || [];
  const tiktokMemories = person?.memories?.filter((m: any) => m.tiktokVideo) || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/people')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to People
        </button>

        {person && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {person.displayName}
                </h1>
                <div className="space-y-1 text-sm md:text-base">
                  {person.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <a href={`mailto:${person.email}`} className="hover:text-blue-600">
                        {person.email}
                      </a>
                    </div>
                  )}
                  {person.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <a href={`tel:${person.phone}`} className="hover:text-blue-600">
                        {person.phone}
                      </a>
                    </div>
                  )}
                </div>
                {person.bio && (
                  <p className="mt-3 text-gray-700 text-sm md:text-base">{person.bio}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      {person && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs md:text-sm">Memories</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{regularMemories.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Video className="h-4 w-4" />
              <span className="text-xs md:text-sm">YouTube</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{youtubeMemories.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Film className="h-4 w-4" />
              <span className="text-xs md:text-sm">TikTok</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{tiktokMemories.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs md:text-sm">Relationships</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{relationships?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Relationships */}
      {relationships && relationships.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            Relationships
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relationships.map((rel: any) => (
              <div
                key={rel.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/app/people/${rel.targetPerson?.id || rel.sourcePerson?.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {rel.targetPerson?.displayName || rel.sourcePerson?.displayName}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {rel.relationshipType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TikTok Videos */}
      {tiktokMemories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Film className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
            TikTok Videos ({tiktokMemories.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiktokMemories.map((memory: any) => (
              <div
                key={memory.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/app/memories/${memory.id}`)}
              >
                {memory.tiktokVideo?.thumbnailUrl && (
                  <img
                    src={memory.tiktokVideo.thumbnailUrl}
                    alt={memory.tiktokVideo.title}
                    className="w-full aspect-[9/16] object-cover"
                  />
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                    {memory.tiktokVideo?.title || 'Untitled'}
                  </h3>
                  {memory.tiktokVideo?.creatorDisplayName && (
                    <p className="text-xs text-gray-500">
                      by {memory.tiktokVideo.creatorDisplayName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Videos */}
      {youtubeMemories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
            YouTube Videos ({youtubeMemories.length})
          </h2>
          <div className="space-y-3">
            {youtubeMemories.map((memory: any) => (
              <div
                key={memory.id}
                className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/app/memories/${memory.id}`)}
              >
                {memory.youtubeVideo?.thumbnailUrl && (
                  <img
                    src={memory.youtubeVideo.thumbnailUrl}
                    alt={memory.youtubeVideo.title}
                    className="w-32 h-20 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2 mb-1">
                    {memory.youtubeVideo?.title || 'Untitled'}
                  </h3>
                  {memory.youtubeVideo?.creatorDisplayName && (
                    <p className="text-xs md:text-sm text-gray-500">
                      by {memory.youtubeVideo.creatorDisplayName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Memories */}
      {regularMemories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            Memories ({regularMemories.length})
          </h2>
          <div className="space-y-3">
            {regularMemories.map((memory: any) => (
              <div
                key={memory.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/app/memories/${memory.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base text-gray-900 line-clamp-3">
                      {memory.textContent || memory.title || memory.body || 'Untitled memory'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                    <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading person details...</p>
        </div>
      ) : person && regularMemories.length === 0 && youtubeMemories.length === 0 && tiktokMemories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">No memories linked to this person yet</p>
          <button
            onClick={() => navigate('/app/capture')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Memory
          </button>
        </div>
      ) : null}
    </div>
  );
}
