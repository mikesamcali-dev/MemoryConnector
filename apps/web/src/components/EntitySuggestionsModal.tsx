import { X, User, MapPin, AlertCircle, ExternalLink, Video, BookOpen } from 'lucide-react';
import { PersonMatch, LocationMatch, YouTubeVideoMatch, WordMatch } from '../api/memories';
import { useNavigate } from 'react-router-dom';
import { LocationBuilderModal } from './LocationBuilderModal';

interface EntitySuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: PersonMatch[];
  locations: LocationMatch[];
  youtubeVideos?: YouTubeVideoMatch[];
  words?: WordMatch[];
  onConfirmPerson: (person: PersonMatch, selectedExisting?: string) => void;
  onConfirmLocation: (location: LocationMatch, selectedExisting?: string) => void;
  onConfirmYouTubeVideo?: (video: YouTubeVideoMatch, selectedExisting?: string) => void;
  onConfirmWord?: (word: WordMatch) => void;
  onSkip: () => void;
}

export function EntitySuggestionsModal({
  isOpen,
  onClose,
  persons,
  locations,
  youtubeVideos = [],
  words = [],
  onConfirmPerson,
  onConfirmLocation,
  onConfirmYouTubeVideo,
  onConfirmWord,
  onSkip,
}: EntitySuggestionsModalProps) {
  if (!isOpen) return null;

  const hasPersons = persons.length > 0;
  const hasLocations = locations.length > 0;
  const hasYouTubeVideos = youtubeVideos.length > 0;
  const hasWords = words.length > 0;
  const hasAnyEntities = hasPersons || hasLocations || hasYouTubeVideos || hasWords;

  if (!hasAnyEntities) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Entities Detected</h2>
            <p className="text-sm text-gray-600 mt-1">
              We found {[
                hasPersons && `${persons.length} ${persons.length === 1 ? 'person' : 'people'}`,
                hasLocations && `${locations.length} ${locations.length === 1 ? 'location' : 'locations'}`,
                hasYouTubeVideos && `${youtubeVideos.length} ${youtubeVideos.length === 1 ? 'video' : 'videos'}`,
                hasWords && `${words.length} interesting ${words.length === 1 ? 'word' : 'words'}`
              ].filter(Boolean).join(', ')}.
              Would you like to link them?
            </p>          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Persons Section */}
          {hasPersons && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <User className="h-5 w-5 text-purple-600" />
                People ({persons.length})
              </h3>
              <div className="space-y-4">
                {persons.map((person, index) => (
                  <PersonSuggestionCard
                    key={index}
                    person={person}
                    onConfirm={onConfirmPerson}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Locations Section */}
          {hasLocations && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <MapPin className="h-5 w-5 text-green-600" />
                Locations ({locations.length})
              </h3>
              <div className="space-y-4">
                {locations.map((location, index) => (
                  <LocationSuggestionCard
                    key={index}
                    location={location}
                    onConfirm={onConfirmLocation}
                  />
                ))}
              </div>
            </div>
          )}

          {/* YouTube Videos Section */}
          {hasYouTubeVideos && onConfirmYouTubeVideo && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Video className="h-5 w-5 text-red-600" />
                YouTube Videos ({youtubeVideos.length})
              </h3>
              <div className="space-y-4">
                {youtubeVideos.map((video, index) => (
                  <YouTubeSuggestionCard
                    key={index}
                    video={video}
                    onConfirm={onConfirmYouTubeVideo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Words Section */}
          {hasWords && onConfirmWord && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Interesting Words ({words.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {words.map((wordMatch, index) => (
                  <button
                    key={index}
                    onClick={() => onConfirmWord(wordMatch)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      wordMatch.isNewWord
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                    title={
                      wordMatch.isNewWord
                        ? 'Click to create a vocabulary entry for this word'
                        : `Already exists in your vocabulary (used in ${wordMatch.existingWord?.memoryCount || 0} memories)`
                    }
                  >
                    {wordMatch.word}
                    {!wordMatch.isNewWord && ' ✓'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Click words to add them to your vocabulary. Words marked with ✓ already exist.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Skip All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface PersonSuggestionCardProps {
  person: PersonMatch;
  onConfirm: (person: PersonMatch, selectedExisting?: string) => void;
}

function PersonSuggestionCard({ person, onConfirm }: PersonSuggestionCardProps) {
  const navigate = useNavigate();
  const [selectedExisting, setSelectedExisting] = React.useState<string | undefined>(
    person.existingMatches[0]?.id
  );
  const [isCreatingNew, setIsCreatingNew] = React.useState(person.isNewPerson);
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  return (
    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            Found: <span className="text-purple-700">{person.extractedName}</span>
          </h4>
          {person.isNewPerson ? (
            <p className="text-sm text-gray-600 mt-1">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              New person - not in database
            </p>
          ) : (
            <p className="text-sm text-green-600 mt-1">
              ✓ Found {person.existingMatches.length} matching {person.existingMatches.length === 1 ? 'person' : 'people'}
            </p>
          )}
        </div>
      </div>

      {/* Matching Options */}
      {!person.isNewPerson && person.existingMatches.length > 0 && (
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Link to existing person:
          </label>
          <div className="space-y-2">
            {person.existingMatches.map((match) => (
              <label
                key={match.id}
                className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:bg-white transition-colors"
              >
                <input
                  type="radio"
                  name={`person-${person.extractedName}`}
                  value={match.id}
                  checked={!isCreatingNew && selectedExisting === match.id}
                  onChange={() => {
                    setSelectedExisting(match.id);
                    setIsCreatingNew(false);
                  }}
                  className="text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{match.displayName}</div>
                  {match.email && (
                    <div className="text-sm text-gray-600">{match.email}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Create New Option */}
      <label className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:bg-white transition-colors mb-3">
        <input
          type="radio"
          name={`person-${person.extractedName}`}
          checked={isCreatingNew}
          onChange={() => setIsCreatingNew(true)}
          className="text-purple-600"
        />
        <span className="font-medium text-gray-900">
          Create new person: {person.extractedName}
        </span>
      </label>

      {/* Confirm Button */}
      {!isConfirmed ? (
        <button
          onClick={() => {
            onConfirm(person, isCreatingNew ? undefined : selectedExisting);
            setIsConfirmed(true);
          }}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {isCreatingNew ? 'Add New Person' : 'Link Existing Person'}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
            <span className="text-green-700">✓ {isCreatingNew ? 'Person added!' : 'Person linked!'}</span>
          </div>
          {isCreatingNew && (
            <button
              onClick={() => navigate('/app/person-builder')}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Go to Person Builder to add details
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface LocationSuggestionCardProps {
  location: LocationMatch;
  onConfirm: (location: LocationMatch, selectedExisting?: string) => void;
}

function LocationSuggestionCard({ location, onConfirm }: LocationSuggestionCardProps) {
  const [selectedExisting, setSelectedExisting] = React.useState<string | undefined>(
    location.existingMatches[0]?.id
  );
  const [isCreatingNew, setIsCreatingNew] = React.useState(location.isNewLocation);
  const [showLocationBuilder, setShowLocationBuilder] = React.useState(false);
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            Found: <span className="text-green-700">{location.extractedName}</span>
          </h4>
          {location.isNewLocation ? (
            <p className="text-sm text-gray-600 mt-1">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              New location - not in database
            </p>
          ) : (
            <p className="text-sm text-green-600 mt-1">
              ✓ Found {location.existingMatches.length} matching {location.existingMatches.length === 1 ? 'location' : 'locations'}
            </p>
          )}
        </div>
      </div>

      {/* Matching Options */}
      {!location.isNewLocation && location.existingMatches.length > 0 && (
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Link to existing location:
          </label>
          <div className="space-y-2">
            {location.existingMatches.map((match) => (
              <label
                key={match.id}
                className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:bg-white transition-colors"
              >
                <input
                  type="radio"
                  name={`location-${location.extractedName}`}
                  value={match.id}
                  checked={!isCreatingNew && selectedExisting === match.id}
                  onChange={() => {
                    setSelectedExisting(match.id);
                    setIsCreatingNew(false);
                  }}
                  className="text-green-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{match.name}</div>
                  {(match.city || match.address) && (
                    <div className="text-sm text-gray-600">
                      {[match.address, match.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Create New Option */}
      <label className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:bg-white transition-colors mb-3">
        <input
          type="radio"
          name={`location-${location.extractedName}`}
          checked={isCreatingNew}
          onChange={() => setIsCreatingNew(true)}
          className="text-green-600"
        />
        <span className="font-medium text-gray-900">
          Create new location: {location.extractedName}
        </span>
      </label>

      {/* Confirm Button */}
      {!isConfirmed ? (
        <button
          onClick={() => {
            if (isCreatingNew) {
              setShowLocationBuilder(true);
            } else {
              onConfirm(location, selectedExisting);
              setIsConfirmed(true);
            }
          }}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {isCreatingNew ? 'Add New Location' : 'Link Existing Location'}
        </button>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
          <span className="text-green-700">✓ Location linked!</span>
        </div>
      )}

      {/* Location Builder Modal */}
      <LocationBuilderModal
        isOpen={showLocationBuilder}
        onClose={() => setShowLocationBuilder(false)}
        initialAddress={location.extractedName}
        onLocationCreated={(locationId) => {
          setShowLocationBuilder(false);
          onConfirm(location, locationId);
          setIsConfirmed(true);
        }}
      />
    </div>
  );
}

interface YouTubeSuggestionCardProps {
  video: YouTubeVideoMatch;
  onConfirm: (video: YouTubeVideoMatch, selectedExisting?: string) => void;
}

function YouTubeSuggestionCard({ video, onConfirm }: YouTubeSuggestionCardProps) {
  const navigate = useNavigate();
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <div className="flex items-start gap-3 mb-3">
        {/* Thumbnail */}
        {video.existingVideo?.thumbnailUrl ? (
          <img
            src={video.existingVideo.thumbnailUrl}
            alt={video.existingVideo.title}
            className="w-32 h-20 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            <Video className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">
            {video.existingVideo ? (
              <span className="text-red-700">{video.existingVideo.title}</span>
            ) : (
              <span className="text-gray-900">YouTube Video</span>
            )}
          </h4>
          {video.existingVideo && (
            <p className="text-sm text-gray-600 mt-1">
              {video.existingVideo.creatorDisplayName}
            </p>
          )}
          {video.isNewVideo ? (
            <p className="text-sm text-gray-600 mt-1">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              New video - will be added to your collection
            </p>
          ) : (
            <p className="text-sm text-green-600 mt-1">
              ✓ Already in your collection
            </p>
          )}
        </div>
      </div>

      {/* Video URL */}
      <div className="mb-3">
        <a
          href={video.url.startsWith('http') ? video.url : `https://${video.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          {video.url}
        </a>
      </div>

      {/* Confirm Button */}
      {!isConfirmed ? (
        <button
          onClick={() => {
            onConfirm(video, video.existingVideo?.id);
            setIsConfirmed(true);
          }}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {video.isNewVideo ? 'Add & Link Video' : 'Link Video to Memory'}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
            <span className="text-green-700">✓ {video.isNewVideo ? 'Video added & linked!' : 'Video linked!'}</span>
          </div>
          {video.existingVideo && (
            <button
              onClick={() => navigate(`/app/youtube-videos/${video.existingVideo!.id}/memories`)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View All Memories for This Video
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Add React import at the top
import React from 'react';
