import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createSamMemory, generateDefinition } from '../api/sam';
import { getAllPeople, getAllLocationsForUser } from '../api/admin';
import { createQuestion } from '../api/questions';
import { processMemoryPhrase } from '../api/words';
import { uploadImage, linkImageToMemory } from '../api/images';
import { addUrl, linkUrlPageToMemory } from '../api/urlPages';
import { extractTikTokMetadata, createTikTokVideo } from '../api/tiktok';
import { getAllProjects, linkMemoryToProject } from '../api/projects';
import { getAllTrainings, linkMemoryToTraining } from '../api/trainings';
import { compressImage, getSizeReduction } from '../utils/imageCompression';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { Loader, Users, MapPinned, Video, Image as ImageIcon, Link as LinkIcon, X, Mic, FolderKanban, GraduationCap, MessageSquare, Camera, BookMarked, AlertCircle, ChevronDown } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { FeedbackModal } from '../components/FeedbackModal';
import { HelpPopup } from '../components/HelpPopup';
import { submitFeedback } from '../api/transcription';

const memorySchema = z.object({
  text: z.string().min(1, 'Memory text is required'),
});

// Internal Components

interface CaptureActionRowProps {
  onSave: () => void;
  onAsk: () => void;
  onSaveToMemory: () => void;
  loading: boolean;
  loadingDefinition: boolean;
  uploadingImage: boolean;
  addingUrl: boolean;
  addingTikTok: boolean;
  addingYouTube: boolean;
  textValue: string;
  formId?: string;
}

function CaptureActionRow({
  onSave,
  onAsk,
  onSaveToMemory,
  loading,
  loadingDefinition,
  uploadingImage,
  addingUrl,
  addingTikTok,
  addingYouTube,
  textValue,
  formId,
}: CaptureActionRowProps) {
  const [showMemoryDropdown, setShowMemoryDropdown] = useState(false);
  const isDisabled = loading || uploadingImage || addingUrl || addingTikTok || addingYouTube;
  const isMemoryDisabled = isDisabled || loadingDefinition || !textValue.trim();

  const getSaveButtonText = () => {
    if (uploadingImage) return 'Uploading...';
    if (addingUrl) return 'Analyzing...';
    if (addingTikTok) return 'Adding TikTok...';
    if (addingYouTube) return 'Adding YouTube...';
    if (loading) return 'Saving...';
    return 'Save';
  };

  return (
    <div className="flex gap-2">
      <button
        type={formId ? 'submit' : 'button'}
        form={formId}
        onClick={!formId ? onSave : undefined}
        disabled={isDisabled}
        className="flex-1 h-12 md:h-10 px-4 bg-blue-600 text-white text-base md:text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-md transition-all active:scale-95"
      >
        {loading && <Loader className="h-5 w-5 md:h-4 md:w-4 animate-spin mr-2" />}
        {getSaveButtonText()}
      </button>

      <button
        type="button"
        onClick={onAsk}
        disabled={isMemoryDisabled}
        className="flex-1 h-12 md:h-10 px-4 bg-gray-100 text-gray-700 text-base md:text-sm font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 shadow-md transition-all active:scale-95 inline-flex items-center justify-center gap-2"
      >
        <MessageSquare className="h-5 w-5 md:h-4 md:w-4" />
        Ask
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowMemoryDropdown(!showMemoryDropdown)}
          className="h-12 md:h-10 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-md transition-all active:scale-95"
          title="More options"
        >
          <ChevronDown className="h-5 w-5 md:h-4 md:w-4" />
        </button>

        {showMemoryDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <button
              type="button"
              onClick={() => {
                onSaveToMemory();
                setShowMemoryDropdown(false);
              }}
              disabled={isMemoryDisabled}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <BookMarked className="h-4 w-4" />
              Save → Memory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface LinkedStripProps {
  linkedEntities: {
    persons: string[];
    locations: string[];
    youtubeVideos: string[];
    tiktokVideos: string[];
    projects: string[];
    trainings: string[];
  };
  selectedPersonName: string;
  preLinkedImageId: string | null;
  preLinkedUrlPageId: string | null;
  onRemovePerson: () => void;
  onRemoveLocation: () => void;
  onRemoveProject: () => void;
  onRemoveTraining: () => void;
  onRemoveYouTube: () => void;
  onRemoveTikTok: () => void;
  onRemovePreLinkedImage: () => void;
  onRemovePreLinkedUrl: () => void;
}

function LinkedStrip({
  linkedEntities,
  selectedPersonName,
  preLinkedImageId,
  preLinkedUrlPageId,
  onRemovePerson,
  onRemoveLocation,
  onRemoveProject,
  onRemoveTraining,
  onRemoveYouTube,
  onRemoveTikTok,
  onRemovePreLinkedImage,
  onRemovePreLinkedUrl,
}: LinkedStripProps) {
  const hasLinks =
    linkedEntities.persons.length > 0 ||
    linkedEntities.locations.length > 0 ||
    linkedEntities.youtubeVideos.length > 0 ||
    linkedEntities.tiktokVideos.length > 0 ||
    linkedEntities.projects.length > 0 ||
    linkedEntities.trainings.length > 0 ||
    preLinkedImageId ||
    preLinkedUrlPageId;

  if (!hasLinks) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
      <div className="text-xs text-gray-600 mb-2 font-medium">Linked on save:</div>
      <div className="flex flex-wrap gap-2">
        {linkedEntities.youtubeVideos.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
            <Video className="h-3 w-3" />
            <span>YouTube</span>
            <button
              type="button"
              onClick={onRemoveYouTube}
              className="ml-1 hover:text-red-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {linkedEntities.tiktokVideos.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-md text-xs">
            <Video className="h-3 w-3" />
            <span>TikTok</span>
            <button
              type="button"
              onClick={onRemoveTikTok}
              className="ml-1 hover:text-pink-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {linkedEntities.persons.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
            <Users className="h-3 w-3" />
            <span>{selectedPersonName || 'Person'}</span>
            <button
              type="button"
              onClick={onRemovePerson}
              className="ml-1 hover:text-purple-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {linkedEntities.locations.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
            <MapPinned className="h-3 w-3" />
            <span>Location</span>
            <button
              type="button"
              onClick={onRemoveLocation}
              className="ml-1 hover:text-green-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {linkedEntities.projects.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
            <FolderKanban className="h-3 w-3" />
            <span>Topic</span>
            <button
              type="button"
              onClick={onRemoveProject}
              className="ml-1 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {linkedEntities.trainings.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
            <GraduationCap className="h-3 w-3" />
            <span>Training</span>
            <button
              type="button"
              onClick={onRemoveTraining}
              className="ml-1 hover:text-purple-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {preLinkedImageId && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
            <ImageIcon className="h-3 w-3" />
            <span>Image</span>
            <button
              type="button"
              onClick={onRemovePreLinkedImage}
              className="ml-1 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {preLinkedUrlPageId && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
            <LinkIcon className="h-3 w-3" />
            <span>URL Page</span>
            <button
              type="button"
              onClick={onRemovePreLinkedUrl}
              className="ml-1 hover:text-purple-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface OptionalPanelProps {
  tagsInput: string;
  onTagsChange: (value: string) => void;
  trainingInput: string;
  onTrainingChange: (value: string) => void;
  suggestedTraining: { id: string; name: string } | null;
  onAcceptTraining: () => void;
  onDismissTraining: () => void;
}

function OptionalPanel({
  tagsInput,
  onTagsChange,
  trainingInput,
  onTrainingChange,
  suggestedTraining,
  onAcceptTraining,
  onDismissTraining,
}: OptionalPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-700"
      >
        <span>Optional Fields</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          <div className="relative">
            <label htmlFor="tags" className="block text-xs font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="work, personal, ideas..."
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <label htmlFor="training" className="block text-xs font-medium text-gray-700 mb-1">
              Training
            </label>
            <input
              id="training"
              type="text"
              value={trainingInput}
              onChange={(e) => onTrainingChange(e.target.value)}
              placeholder="Course or training name..."
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />

            {suggestedTraining && (
              <div className="absolute left-0 right-0 mt-1 p-3 bg-purple-50 border border-purple-200 rounded-md shadow-sm z-10">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-1">
                      Did you mean <span className="font-semibold text-purple-700">{suggestedTraining.name}</span>?
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={onAcceptTraining}
                      className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={onDismissTraining}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionGridProps {
  onCameraCapture: () => void;
  onPersonSelect: () => void;
  onLocationSelect: () => void;
  onTopicSelect: () => void;
  onYouTubeAdd: () => void;
  onTikTokAdd: () => void;
  onUrlAdd: () => void;
  compressingImage: boolean;
  addingYouTube: boolean;
  addingTikTok: boolean;
  addingUrl: boolean;
  imagePreview: string | null;
  onRemoveImage: () => void;
  compressionInfo: string;
  linkedPersons: number;
  linkedLocations: number;
  linkedProjects: number;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ActionGrid({
  onCameraCapture,
  onPersonSelect,
  onLocationSelect,
  onTopicSelect,
  onYouTubeAdd,
  onTikTokAdd,
  onUrlAdd,
  compressingImage,
  addingYouTube,
  addingTikTok,
  addingUrl,
  imagePreview,
  onRemoveImage,
  compressionInfo,
  linkedPersons,
  linkedLocations,
  linkedProjects,
  handleImageSelect,
}: ActionGridProps) {
  return (
    <div>
      <div className="text-xs text-gray-600 mb-2 font-medium">Attach Media:</div>
      <div className="grid grid-cols-4 gap-3">
        {/* Camera */}
        {!imagePreview ? (
          <label
            htmlFor="camera-capture"
            onClick={onCameraCapture}
            className={`flex flex-col items-center justify-center p-3 border border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors ${compressingImage ? 'opacity-50 cursor-wait' : ''}`}
          >
            {compressingImage ? (
              <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-blue-600" />
            )}
            <span className="text-xs text-blue-700 mt-1 font-medium">Camera</span>
            <input
              id="camera-capture"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="sr-only"
              disabled={compressingImage}
            />
          </label>
        ) : (
          <div className="col-span-1 flex flex-col items-center">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                loading="lazy"
                className="h-14 w-14 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {compressionInfo && (
              <span className="text-[10px] text-green-600 mt-1 text-center">{compressionInfo.split('(')[0]}</span>
            )}
          </div>
        )}

        {/* Gallery */}
        {!imagePreview && (
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors ${compressingImage ? 'opacity-50 cursor-wait' : ''}`}
          >
            {compressingImage ? (
              <Loader className="h-6 w-6 text-gray-600 animate-spin" />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-600" />
            )}
            <span className="text-xs text-gray-700 mt-1 font-medium">Gallery</span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="sr-only"
              disabled={compressingImage}
            />
          </label>
        )}

        {/* Person */}
        <button
          type="button"
          onClick={onPersonSelect}
          disabled={linkedPersons > 0}
          className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-colors ${
            linkedPersons > 0
              ? 'border-purple-300 bg-purple-100 text-purple-400 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Users className="h-6 w-6 text-purple-600" />
          <span className="text-xs text-gray-700 mt-1 font-medium">Person</span>
        </button>

        {/* Location */}
        <button
          type="button"
          onClick={onLocationSelect}
          disabled={linkedLocations > 0}
          className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-colors ${
            linkedLocations > 0
              ? 'border-green-300 bg-green-100 text-green-400 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
          }`}
        >
          <MapPinned className="h-6 w-6 text-green-600" />
          <span className="text-xs text-gray-700 mt-1 font-medium">Location</span>
        </button>

        {/* Topic */}
        <button
          type="button"
          onClick={onTopicSelect}
          disabled={linkedProjects > 0}
          className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-colors ${
            linkedProjects > 0
              ? 'border-blue-300 bg-blue-100 text-blue-400 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
          }`}
        >
          <FolderKanban className="h-6 w-6 text-blue-600" />
          <span className="text-xs text-gray-700 mt-1 font-medium">Topic</span>
        </button>

        {/* YouTube */}
        <button
          type="button"
          onClick={onYouTubeAdd}
          disabled={addingYouTube}
          className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {addingYouTube ? (
            <Loader className="h-6 w-6 text-gray-600 animate-spin" />
          ) : (
            <Video className="h-6 w-6 text-red-600" />
          )}
          <span className="text-xs text-gray-700 mt-1 font-medium">YouTube</span>
        </button>

        {/* TikTok */}
        <button
          type="button"
          onClick={onTikTokAdd}
          disabled={addingTikTok}
          className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {addingTikTok ? (
            <Loader className="h-6 w-6 text-gray-600 animate-spin" />
          ) : (
            <Video className="h-6 w-6 text-gray-600" />
          )}
          <span className="text-xs text-gray-700 mt-1 font-medium">TikTok</span>
        </button>

        {/* Link/URL */}
        <button
          type="button"
          onClick={onUrlAdd}
          disabled={addingUrl}
          className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {addingUrl ? (
            <Loader className="h-6 w-6 text-gray-600 animate-spin" />
          ) : (
            <LinkIcon className="h-6 w-6 text-gray-600" />
          )}
          <span className="text-xs text-gray-700 mt-1 font-medium">Link</span>
        </button>
      </div>
    </div>
  );
}

// Main Component

export function CapturePage() {
  const { user: _user, accessToken } = useAuth();
  const location = useLocation();
  const { haptic } = useHaptics();
  const queryClient = useQueryClient();
  const helpPopup = useHelpPopup('capture');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimitError, setIsRateLimitError] = useState(false);
  const [loadingDefinition, setLoadingDefinition] = useState(false);

  // Text input state
  const [textValue, setTextValue] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [suggestedTopic, setSuggestedTopic] = useState<{ id: string; name: string } | null>(null);
  const [trainingInput, setTrainingInput] = useState('');
  const [suggestedTraining, setSuggestedTraining] = useState<{ id: string; name: string } | null>(null);
  const [linkedEntities, setLinkedEntities] = useState<{
    persons: string[];
    locations: string[];
    youtubeVideos: string[];
    tiktokVideos: string[];
    projects: string[];
    trainings: string[];
  }>({ persons: [], locations: [], youtubeVideos: [], tiktokVideos: [], projects: [], trainings: [] });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>('');
  const [preLinkedImageId, setPreLinkedImageId] = useState<string | null>(null);
  const [preLinkedUrlPageId, setPreLinkedUrlPageId] = useState<string | null>(null);

  // URL state
  const [addingUrl, setAddingUrl] = useState(false);
  const [addedUrlPage, setAddedUrlPage] = useState<any>(null);

  // TikTok video state
  const [addingTikTok, setAddingTikTok] = useState(false);
  const [tiktokError, setTiktokError] = useState('');

  // YouTube video state
  const [addingYouTube, setAddingYouTube] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');

  // Person/Location/Project selection state
  const [showPersonSelector, setShowPersonSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [allPeople, setAllPeople] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [selectedPersonName, setSelectedPersonName] = useState<string>('');

  // Voice input state
  const {
    state: voiceState,
    transcript,
    partialTranscript,
    error: voiceError,
    sessionId: voiceSessionId,
    startRecording,
    stopRecording,
  } = useVoiceInput(accessToken || '');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTranscript, setFeedbackTranscript] = useState('');

  // Textarea ref for auto-grow
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all topics for suggestion matching
  const { data: allTopics } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
  });

  // Fetch all trainings for suggestion matching
  const { data: allTrainingsData } = useQuery({
    queryKey: ['trainings'],
    queryFn: getAllTrainings,
  });

  // Auto-link video if navigated from video detail page
  useEffect(() => {
    const state = location.state as { youtubeVideoId?: string; tiktokVideoId?: string } | null;
    const youtubeVideoId = state?.youtubeVideoId;
    const tiktokVideoId = state?.tiktokVideoId;

    if (youtubeVideoId) {
      setLinkedEntities(prev => ({
        ...prev,
        youtubeVideos: [youtubeVideoId],
      }));
      console.log('Auto-linking YouTube video:', youtubeVideoId);
    }

    if (tiktokVideoId) {
      setLinkedEntities(prev => ({
        ...prev,
        tiktokVideos: [tiktokVideoId],
      }));
      console.log('Auto-linking TikTok video:', tiktokVideoId);
    }
  }, [location.state]);

  // Auto-link person if navigated from person detail page
  useEffect(() => {
    const state = location.state as { preselectedPerson?: { id: string; displayName: string } } | null;
    const preselectedPerson = state?.preselectedPerson;

    if (preselectedPerson) {
      setLinkedEntities(prev => ({
        ...prev,
        persons: [preselectedPerson.id],
      }));
      setSelectedPersonName(preselectedPerson.displayName);
      console.log('Auto-linking person:', preselectedPerson.displayName);
    }
  }, [location.state]);

  // Check for pre-linked image from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const imageId = searchParams.get('imageId');
    if (imageId) {
      setPreLinkedImageId(imageId);
      console.log('Pre-linking image:', imageId);
    }
  }, [location.search]);

  // Check for pre-linked URL page from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlPageId = searchParams.get('urlPageId');
    if (urlPageId) {
      setPreLinkedUrlPageId(urlPageId);
      console.log('Pre-linking URL page:', urlPageId);
    }
  }, [location.search]);

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
  } = useForm({
    resolver: zodResolver(memorySchema),
    defaultValues: { text: '' },
  });

  // Smart detection: Auto-fetch definition when title has 1-3 words and text is empty
  const handleTitleBlur = async () => {
    const trimmedTitle = topicInput.trim();
    const wordCount = trimmedTitle.split(/\s+/).filter(Boolean).length;

    // Only auto-fetch if:
    // 1. Title has 1-3 words
    // 2. Text field is empty
    // 3. Not already loading
    if (wordCount >= 1 && wordCount <= 3 && !textValue.trim() && !loadingDefinition) {
      setLoadingDefinition(true);
      setError('');
      clearErrors('text'); // Clear validation error while fetching definition

      try {
        const result = await generateDefinition(trimmedTitle);
        setTextValue(result.definition);
        setValue('text', result.definition, { shouldValidate: true }); // Update react-hook-form value and validate

        // Auto-populate tags with extracted keywords
        if (result.keywords && result.keywords.length > 0) {
          setTagsInput(result.keywords.join(', '));
        }

        haptic('light');
      } catch (err) {
        console.error('Failed to generate definition:', err);
        // Fallback: set a basic definition so buttons can still be enabled
        const fallbackDef = `Definition for: ${trimmedTitle}`;
        setTextValue(fallbackDef);
        setValue('text', fallbackDef, { shouldValidate: true });
      } finally {
        setLoadingDefinition(false);
      }
    }
  };

  // Handle image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        // Reset the input so the same file can be selected again
        e.target.value = '';
        return;
      }

      console.log('Image selected:', file.name, 'Size:', file.size, 'Type:', file.type);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        e.target.value = '';
        return;
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError('Image size must be less than 50MB');
        e.target.value = '';
        return;
      }

      setCompressingImage(true);
      setCompressionInfo('');
      setError('');

      try {
        // Compress image
        const originalSize = file.size;
        console.log('Starting compression...');
        const compressedFile = await compressImage(file);
        console.log('Compression complete');
        const compressedSize = compressedFile.size;
        const reduction = getSizeReduction(originalSize, compressedSize);

        setSelectedImage(compressedFile);
        setCompressionInfo(`Compressed ${reduction}% (${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB)`);

        // Create preview from compressed file
        console.log('Creating preview...');
        const reader = new FileReader();
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          setError('Failed to read image file');
          setCompressingImage(false);
        };
        reader.onloadend = () => {
          console.log('Preview created successfully');
          setImagePreview(reader.result as string);
          setCompressingImage(false);
        };
        reader.readAsDataURL(compressedFile);

        haptic('success');
      } catch (err) {
        console.error('Image compression failed:', err);
        // Fall back to original file
        setSelectedImage(file);

        // Create preview
        console.log('Creating preview from original file...');
        const reader = new FileReader();
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          setError('Failed to read image file');
          setCompressingImage(false);
        };
        reader.onloadend = () => {
          console.log('Preview created from original file');
          setImagePreview(reader.result as string);
          setCompressingImage(false);
        };
        reader.readAsDataURL(file);
      }

      // Reset the input
      e.target.value = '';
    } catch (err) {
      console.error('Critical error in handleImageSelect:', err);
      setError('An error occurred while processing the image');
      setCompressingImage(false);
      e.target.value = '';
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCompressionInfo('');
  };

  // Save current state before opening camera (in case page refreshes)
  const handleCameraButtonClick = () => {
    try {
      // Save current text and state to localStorage
      const stateBackup = {
        text: textValue,
        timestamp: Date.now(),
      };
      localStorage.setItem('cameraStateBackup', JSON.stringify(stateBackup));
      console.log('Saved state before camera:', stateBackup);
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  };

  // Restore state if returning from camera
  useEffect(() => {
    try {
      const backup = localStorage.getItem('cameraStateBackup');
      if (backup) {
        const parsed = JSON.parse(backup);
        // Only restore if less than 5 minutes old
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          console.log('Restoring state from backup:', parsed);
          if (parsed.text && !textValue) {
            setTextValue(parsed.text);
          }
        }
        // Clean up backup
        localStorage.removeItem('cameraStateBackup');
      }
    } catch (err) {
      console.error('Failed to restore state:', err);
    }

    // Add visibility change listener to detect when returning from camera
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible - user may have returned from camera');
        // Verify auth token is still valid
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('Auth token missing after returning from camera!');
        } else {
          console.log('Auth token still present');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle URL addition
  const handleAddUrl = async () => {
    const url = prompt('Enter URL:');
    if (!url || !url.trim()) {
      return;
    }

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch (err) {
      alert('Please enter a valid URL');
      return;
    }

    setAddingUrl(true);

    try {
      const result = await addUrl({ url: url.trim() });
      setAddedUrlPage(result);
      console.log('URL added successfully:', result);
      haptic('success');
    } catch (err: any) {
      console.error('Add URL error:', err);
      alert(err.message || 'Failed to analyze URL');
      haptic('error');
    } finally {
      setAddingUrl(false);
    }
  };

  // Remove added URL
  const handleRemoveUrl = () => {
    setAddedUrlPage(null);
  };

  // Handle TikTok video addition
  const handleAddTikTok = async () => {
    const url = prompt('Enter TikTok URL:');
    if (!url || !url.trim()) return;

    setAddingTikTok(true);
    setTiktokError('');

    try {
      // Extract metadata from TikTok URL
      const metadata = await extractTikTokMetadata(url.trim());

      // Create TikTok video (only pass fields accepted by createTikTokVideo)
      const video = await createTikTokVideo({
        tiktokVideoId: metadata.tiktokVideoId,
        canonicalUrl: metadata.canonicalUrl,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl,
        creatorDisplayName: metadata.creatorDisplayName,
        creatorUsername: metadata.creatorUsername,
        creatorId: metadata.creatorId,
        publishedAt: metadata.publishedAt,
        durationSeconds: metadata.durationSeconds,
        transcript: metadata.transcript,
      });

      // Add to linked entities
      setLinkedEntities(prev => ({
        ...prev,
        tiktokVideos: [...prev.tiktokVideos, video.id],
      }));

      console.log('TikTok video linked:', video.id);
      haptic('success');
    } catch (err: any) {
      console.error('Add TikTok video error:', err);
      setTiktokError(err.message || 'Failed to add TikTok video');
      haptic('error');
      setTimeout(() => setTiktokError(''), 5000);
    } finally {
      setAddingTikTok(false);
    }
  };

  // Handle YouTube video addition
  const handleAddYouTube = async () => {
    const url = prompt('Enter YouTube URL:');
    if (!url || !url.trim()) return;

    setAddingYouTube(true);
    setYoutubeError('');

    try {
      // Import the function dynamically
      const { createYouTubeVideoFromUrl } = await import('../api/admin');

      // Create YouTube video from URL
      const video = await createYouTubeVideoFromUrl(url.trim());

      // Add to linked entities
      setLinkedEntities(prev => ({
        ...prev,
        youtubeVideos: [...prev.youtubeVideos, video.id],
      }));

      console.log('YouTube video linked:', video.id);
      haptic('success');
    } catch (err: any) {
      console.error('Add YouTube video error:', err);
      setYoutubeError(err.message || 'Failed to add YouTube video');
      haptic('error');
      setTimeout(() => setYoutubeError(''), 5000);
    } finally {
      setAddingYouTube(false);
    }
  };

  // Handle person selection
  const handleAddPerson = async () => {
    setShowPersonSelector(true);
    setLoadingPeople(true);
    try {
      const people = await getAllPeople();
      setAllPeople(people);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoadingPeople(false);
    }
  };

  // Handle location selection
  const handleAddLocation = async () => {
    setShowLocationSelector(true);
    setLoadingLocations(true);
    try {
      const locations = await getAllLocationsForUser();
      setAllLocations(locations);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Select a person
  const handleSelectPerson = (personId: string) => {
    const person = allPeople.find(p => p.id === personId);
    setLinkedEntities(prev => ({
      ...prev,
      persons: [personId], // Only one person per memory for now
    }));
    setSelectedPersonName(person?.displayName || '');
    setShowPersonSelector(false);
    haptic('success');
  };

  // Select a location
  const handleSelectLocation = (locationId: string) => {
    setLinkedEntities(prev => ({
      ...prev,
      locations: [locationId], // Only one location per memory for now
    }));
    setShowLocationSelector(false);
    haptic('success');
  };

  // Remove linked person
  const handleRemovePerson = () => {
    setLinkedEntities(prev => ({
      ...prev,
      persons: [],
    }));
    setSelectedPersonName('');
  };

  // Remove linked location
  const handleRemoveLocation = () => {
    setLinkedEntities(prev => ({
      ...prev,
      locations: [],
    }));
  };

  // Add project handler
  const handleAddProject = async () => {
    setShowProjectSelector(true);
    setProjectSearchTerm('');
    setLoadingProjects(true);
    try {
      const projects = await getAllProjects();
      setAllProjects(projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Select a project
  const handleSelectProject = (projectId: string) => {
    setLinkedEntities(prev => ({
      ...prev,
      projects: [projectId], // Only one project per memory for now
    }));
    setShowProjectSelector(false);
    haptic('success');
  };

  // Remove linked project
  const handleRemoveProject = () => {
    setLinkedEntities(prev => ({
      ...prev,
      projects: [],
    }));
  };

  // Remove linked training
  const handleRemoveTraining = () => {
    setLinkedEntities(prev => ({
      ...prev,
      trainings: [],
    }));
  };

  // Remove linked YouTube video
  const handleRemoveYouTube = () => {
    setLinkedEntities(prev => ({
      ...prev,
      youtubeVideos: [],
    }));
  };

  // Remove linked TikTok video
  const handleRemoveTikTok = () => {
    setLinkedEntities(prev => ({
      ...prev,
      tiktokVideos: [],
    }));
  };

  // Remove pre-linked image
  const handleRemovePreLinkedImage = () => {
    setPreLinkedImageId(null);
  };

  // Remove pre-linked URL
  const handleRemovePreLinkedUrl = () => {
    setPreLinkedUrlPageId(null);
  };

  // Shared save logic
  const executeSave = async (data: { text: string }, additionalActions?: () => Promise<void>) => {
    haptic('light');
    setError('');
    setIsRateLimitError(false);
    setLoading(true);

    try {
      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      // Create SAM memory (title will be auto-generated if not provided)
      const createdMemory = await createSamMemory({
        title: topicInput.trim() || undefined,
        content: data.text,
        tags,
        reliability: 'confirmed',
        confidence_score: 0.75,
        context_window: {
          applies_to: [],
          excludes: [],
        },
        decay_policy: {
          type: 'exponential',
          half_life_days: 90,
          min_confidence: 0.4,
        },
      });

      // Upload and link image if one was selected
      if (selectedImage) {
        try {
          setUploadingImage(true);
          const reader = new FileReader();
          const imageDataPromise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedImage);
          });

          const imageData = await imageDataPromise;
          const uploadedImage = await uploadImage({
            imageData,
            contentType: selectedImage.type,
            filename: selectedImage.name,
          });
          await linkImageToMemory(uploadedImage.id, createdMemory.id);
        } catch (imageError) {
          console.error('Failed to upload image:', imageError);
        } finally {
          setUploadingImage(false);
        }
      }

      // Link pre-selected image if exists
      if (preLinkedImageId) {
        try {
          await linkImageToMemory(preLinkedImageId, createdMemory.id);
          console.log('Pre-linked image attached to memory:', preLinkedImageId);
        } catch (imageError) {
          console.error('Failed to link pre-selected image:', imageError);
        }
      }

      // Link pre-selected URL page if exists
      if (preLinkedUrlPageId) {
        try {
          await linkUrlPageToMemory(preLinkedUrlPageId, createdMemory.id);
          console.log('Pre-linked URL page attached to memory:', preLinkedUrlPageId);
        } catch (urlError) {
          console.error('Failed to link pre-selected URL page:', urlError);
        }
      }

      // Link added URL page if exists
      if (addedUrlPage) {
        try {
          await linkUrlPageToMemory(addedUrlPage.id, createdMemory.id);
        } catch (urlError) {
          console.error('Failed to link URL:', urlError);
        }
      }

      // Handle topic input - create or find topic by name
      if (topicInput.trim()) {
        try {
          const { createProject, getAllProjects, linkMemoryToProject } = await import('../api/projects');

          const allProjects = await getAllProjects();
          let topicId: string | null = null;

          const existingTopic = allProjects.find(
            p => p.name.toLowerCase() === topicInput.trim().toLowerCase()
          );

          if (existingTopic) {
            topicId = existingTopic.id;
            console.log('Found existing topic:', existingTopic.name);
          } else {
            const newTopic = await createProject({ name: topicInput.trim() });
            topicId = newTopic.id;
            console.log('Created new topic:', newTopic.name);
          }

          if (topicId) {
            await linkMemoryToProject(topicId, createdMemory.id);
            console.log('Memory linked to topic:', topicId);
          }
        } catch (topicError) {
          console.error('Failed to create/link topic:', topicError);
        }
      }

      // Link to project if selected (from project selector button)
      if (linkedEntities.projects.length > 0) {
        try {
          await linkMemoryToProject(linkedEntities.projects[0], createdMemory.id);
          console.log('Memory linked to project:', linkedEntities.projects[0]);
        } catch (projectError) {
          console.error('Failed to link memory to project:', projectError);
        }
      }

      // Handle training input - create or find training by name
      if (trainingInput.trim()) {
        try {
          const { createTraining, getAllTrainings, linkMemoryToTraining } = await import('../api/trainings');

          const allTrainings = await getAllTrainings();
          let trainingId: string | null = null;

          const existingTraining = allTrainings.find(
            t => t.name.toLowerCase() === trainingInput.trim().toLowerCase()
          );

          if (existingTraining) {
            trainingId = existingTraining.id;
            console.log('Found existing training:', existingTraining.name);
          } else {
            const newTraining = await createTraining({ name: trainingInput.trim() });
            trainingId = newTraining.id;
            console.log('Created new training:', newTraining.name);
          }

          if (trainingId) {
            await linkMemoryToTraining(trainingId, createdMemory.id);
            console.log('Memory linked to training:', trainingId);
          }
        } catch (trainingError) {
          console.error('Failed to create/link training:', trainingError);
        }
      }

      // Link to training if selected (from training selector button)
      if (linkedEntities.trainings.length > 0) {
        try {
          await linkMemoryToTraining(linkedEntities.trainings[0], createdMemory.id);
          console.log('Memory linked to training:', linkedEntities.trainings[0]);
        } catch (trainingError) {
          console.error('Failed to link memory to training:', trainingError);
        }
      }

      // Process phrase/word linking in background (fire and forget)
      processMemoryPhrase(createdMemory.id, data.text).catch(error => {
        console.error('Failed to process phrase linking:', error);
      });

      // Execute additional actions if provided
      if (additionalActions) {
        await additionalActions();
      }

      // Clear all form fields and state
      setLinkedEntities({ persons: [], locations: [], youtubeVideos: [], tiktokVideos: [], projects: [], trainings: [] });
      setSelectedImage(null);
      setImagePreview(null);
      setPreLinkedImageId(null);
      setPreLinkedUrlPageId(null);
      setAddedUrlPage(null);
      setTopicInput('');
      setTagsInput('');
      setSuggestedTopic(null);
      setTrainingInput('');
      setSuggestedTraining(null);
      setTextValue('');
      reset();

      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['sam-memories'] });
    } catch (err: any) {
      haptic('error');
      if (err.status === 429) {
        setIsRateLimitError(true);
        setError('You\'ve reached your daily memory limit.');
      } else if (err.status === 500 && err.message.includes('Database lookup failed')) {
        setError('Unable to verify word uniqueness. Please try again.');
      } else {
        setError(err.message || 'Failed to save memory');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle standard save
  const onSubmit = async (data: { text: string }) => {
    await executeSave(data);
  };

  // Handle save to memory deck
  const handleSaveToMemoryDeck = async () => {
    if (!textValue.trim()) return;
    await executeSave({ text: textValue });
  };

  // Handle Ask button click - saves memory and asks OpenAI
  const handleAskButtonClick = async () => {
    if (!textValue.trim()) return;

    await executeSave({ text: textValue }, async () => {
      // Additional action: create question
      try {
        const memoryId = queryClient.getQueryData<any>(['sam-memories'])?.[0]?.id;
        if (memoryId) {
          await createQuestion({
            memoryId,
            question: textValue.trim(),
          });
          queryClient.invalidateQueries({ queryKey: ['questions'] });
        }
      } catch (questionError) {
        console.error('Failed to create question:', questionError);
      }
    });
  };

  // Handle text input change with auto-grow
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    setValue('text', newValue); // Update form value

    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Topic input handler with smart suggestions
  const handleTopicInputChange = (value: string) => {
    setTopicInput(value);
    setSuggestedTopic(null);

    if (!value.trim() || !allTopics || allTopics.length === 0) {
      return;
    }

    const inputLower = value.trim().toLowerCase();

    // Find similar topics using fuzzy matching
    const similarTopic = allTopics.find((topic: any) => {
      const topicNameLower = topic.name.toLowerCase();

      // Don't suggest if exact match (case-insensitive)
      if (topicNameLower === inputLower) {
        return false;
      }

      // Check if the existing topic contains the input or vice versa
      return topicNameLower.includes(inputLower) || inputLower.includes(topicNameLower);
    });

    if (similarTopic) {
      setSuggestedTopic({ id: similarTopic.id, name: similarTopic.name });
    }
  };

  // Accept suggested topic
  const acceptSuggestedTopic = () => {
    if (suggestedTopic) {
      setTopicInput(suggestedTopic.name);
      setSuggestedTopic(null);
      haptic('success');
    }
  };

  // Dismiss suggested topic
  const dismissSuggestedTopic = () => {
    setSuggestedTopic(null);
  };

  // Training input handler with smart suggestions
  const handleTrainingInputChange = (value: string) => {
    setTrainingInput(value);
    setSuggestedTraining(null);

    if (!value.trim() || !allTrainingsData || allTrainingsData.length === 0) {
      return;
    }

    const inputLower = value.trim().toLowerCase();

    // Find similar trainings using fuzzy matching
    const similarTraining = allTrainingsData.find((training: any) => {
      const trainingNameLower = training.name.toLowerCase();

      // Don't suggest if exact match (case-insensitive)
      if (trainingNameLower === inputLower) {
        return false;
      }

      // Check if the existing training contains the input or vice versa
      return trainingNameLower.includes(inputLower) || inputLower.includes(trainingNameLower);
    });

    if (similarTraining) {
      setSuggestedTraining({ id: similarTraining.id, name: similarTraining.name });
    }
  };

  // Accept suggested training
  const acceptSuggestedTraining = () => {
    if (suggestedTraining) {
      setTrainingInput(suggestedTraining.name);
      setSuggestedTraining(null);
      haptic('success');
    }
  };

  // Dismiss suggested training
  const dismissSuggestedTraining = () => {
    setSuggestedTraining(null);
  };

  // Voice input handler
  const handleVoiceInput = async () => {
    if (voiceState === 'recording') {
      await stopRecording();
      haptic('success');
    } else {
      await startRecording();
      haptic('light');
    }
  };

  // Auto-update textarea when transcript is received
  useEffect(() => {
    if (transcript) {
      setTextValue(transcript);
      setValue('text', transcript);
      setFeedbackTranscript(transcript);

      // Auto-grow textarea after voice input
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }, 0);
    }
  }, [transcript, setValue]);

  // Handle feedback submission
  const handleFeedbackSubmit = async (correctedText: string, consent: boolean) => {
    if (voiceSessionId && feedbackTranscript) {
      try {
        await submitFeedback(voiceSessionId, feedbackTranscript, correctedText, consent);
        // Update the text value with the corrected version
        setTextValue(correctedText);
        setValue('text', correctedText);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {isRateLimitError && (
            <>
              {' '}
              <Link
                to="/app/upgrade"
                className="font-semibold underline hover:text-red-800"
              >
                Upgrade your account
              </Link>
              {' '}to add more memories.
            </>
          )}
        </div>
      )}

      {/* Error indicators */}
      {tiktokError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">{tiktokError}</p>
          </div>
        </div>
      )}

      {youtubeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">{youtubeError}</p>
          </div>
        </div>
      )}

      {/* Action row - sticky on mobile, at top */}
      <div className="md:hidden sticky top-0 z-10 bg-white pb-4 mb-4 border-b border-gray-200">
        <CaptureActionRow
          onSave={() => handleSubmit(onSubmit)()}
          onAsk={handleAskButtonClick}
          onSaveToMemory={handleSaveToMemoryDeck}
          loading={loading}
          loadingDefinition={loadingDefinition}
          uploadingImage={uploadingImage}
          addingUrl={addingUrl}
          addingTikTok={addingTikTok}
          addingYouTube={addingYouTube}
          textValue={textValue}
          formId="capture-form"
        />
      </div>

      {/* Linked entities strip */}
      <LinkedStrip
        linkedEntities={linkedEntities}
        selectedPersonName={selectedPersonName}
        preLinkedImageId={preLinkedImageId}
        preLinkedUrlPageId={preLinkedUrlPageId}
        onRemovePerson={handleRemovePerson}
        onRemoveLocation={handleRemoveLocation}
        onRemoveProject={handleRemoveProject}
        onRemoveTraining={handleRemoveTraining}
        onRemoveYouTube={handleRemoveYouTube}
        onRemoveTikTok={handleRemoveTikTok}
        onRemovePreLinkedImage={handleRemovePreLinkedImage}
        onRemovePreLinkedUrl={handleRemovePreLinkedUrl}
      />

      <form id="capture-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
        {/* Title input field */}
        <div className="relative">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Title / Phrase
          </label>
          <input
            id="topic"
            type="text"
            value={topicInput}
            onChange={(e) => handleTopicInputChange(e.target.value)}
            onBlur={handleTitleBlur}
            autoFocus
            placeholder="Type a word or phrase (1-3 words) to auto-generate definition..."
            className="w-full h-12 md:h-10 px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {loadingDefinition && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="animate-spin h-5 w-5 text-blue-500" />
            </div>
          )}

          {/* Topic suggestion popup */}
          {suggestedTopic && (
            <div className="absolute left-0 right-0 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm z-10">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-1">
                    Did you mean <span className="font-semibold text-blue-700">{suggestedTopic.name}</span>?
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={acceptSuggestedTopic}
                    className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={dismissSuggestedTopic}
                    className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content textarea */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            {loadingDefinition ? 'Generating definition...' : 'Content'}
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="text"
              value={textValue}
              onChange={handleTextChange}
              rows={3}
              className="w-full px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
              placeholder={loadingDefinition ? "Generating definition..." : "What do you want to remember?"}
            />
            {/* Voice input button (mobile only) */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={voiceState === 'processing'}
              className={`md:hidden absolute bottom-2 right-2 p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                voiceState === 'recording' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
              }`}
              title={voiceState === 'recording' ? 'Stop recording' : 'Voice input'}
            >
              <Mic className={`h-5 w-5 ${voiceState === 'recording' ? 'animate-pulse' : ''}`} />
            </button>
          </div>
          {partialTranscript && voiceState === 'recording' && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-600 mb-1 font-medium">Live Transcript:</div>
              <div className="text-sm text-gray-700 italic">{partialTranscript}</div>
            </div>
          )}
          {transcript && voiceSessionId && voiceState === 'idle' && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Correct transcript
              </button>
            </div>
          )}
          {voiceError && (
            <p className="mt-1 text-sm text-red-600">{voiceError}</p>
          )}
          {errors.text?.message && (
            <p className="mt-1 text-sm text-red-600">{String(errors.text.message)}</p>
          )}
        </div>

        {/* Optional fields panel */}
        <OptionalPanel
          tagsInput={tagsInput}
          onTagsChange={setTagsInput}
          trainingInput={trainingInput}
          onTrainingChange={handleTrainingInputChange}
          suggestedTraining={suggestedTraining}
          onAcceptTraining={acceptSuggestedTraining}
          onDismissTraining={dismissSuggestedTraining}
        />

        {/* Action grid */}
        <ActionGrid
          onCameraCapture={handleCameraButtonClick}
          onPersonSelect={handleAddPerson}
          onLocationSelect={handleAddLocation}
          onTopicSelect={handleAddProject}
          onYouTubeAdd={handleAddYouTube}
          onTikTokAdd={handleAddTikTok}
          onUrlAdd={handleAddUrl}
          compressingImage={compressingImage}
          addingYouTube={addingYouTube}
          addingTikTok={addingTikTok}
          addingUrl={addingUrl}
          imagePreview={imagePreview}
          onRemoveImage={handleRemoveImage}
          compressionInfo={compressionInfo}
          linkedPersons={linkedEntities.persons.length}
          linkedLocations={linkedEntities.locations.length}
          linkedProjects={linkedEntities.projects.length}
          handleImageSelect={handleImageSelect}
        />

        {/* URL added preview */}
        {addedUrlPage && (
          <div className="border border-purple-200 rounded-md p-3 bg-purple-50">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {addedUrlPage.title || 'Untitled'}
                </p>
                <a
                  href={addedUrlPage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:underline truncate block"
                >
                  {addedUrlPage.url}
                </a>
                {addedUrlPage.summary && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {addedUrlPage.summary}
                  </p>
                )}
                {addedUrlPage.tags && addedUrlPage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {addedUrlPage.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {addedUrlPage.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{addedUrlPage.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleRemoveUrl}
                className="ml-2 p-2 text-red-600 hover:text-red-800 focus:outline-none"
              >
                <X className="h-5 w-5 md:h-4 md:w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop action row */}
        <div className="hidden md:block">
          <CaptureActionRow
            onSave={() => {}}
            onAsk={handleAskButtonClick}
            onSaveToMemory={handleSaveToMemoryDeck}
            loading={loading}
            loadingDefinition={loadingDefinition}
            uploadingImage={uploadingImage}
            addingUrl={addingUrl}
            addingTikTok={addingTikTok}
            addingYouTube={addingYouTube}
            textValue={textValue}
            formId="capture-form"
          />
        </div>
      </form>

      {/* Person selection modal */}
      {showPersonSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Select a Person</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingPeople ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : allPeople.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No people found. Create a person memory first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allPeople.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleSelectPerson(person.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{person.displayName || 'Unnamed'}</p>
                      {person.email && (
                        <p className="text-sm text-gray-500">{person.email}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowPersonSelector(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location selection modal */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Select a Location</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : allLocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPinned className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No locations found. Create a location memory first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allLocations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleSelectLocation(location.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{location.name || 'Unnamed'}</p>
                      {location.address && (
                        <p className="text-sm text-gray-500">{location.address}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowLocationSelector(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic selection modal */}
      {showProjectSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Select a Topic</h2>
              <input
                type="text"
                value={projectSearchTerm}
                onChange={(e) => setProjectSearchTerm(e.target.value)}
                placeholder="Search topics..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : allProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderKanban className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No topics found. Create a topic first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allProjects
                    .filter((project) =>
                      project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
                    )
                    .map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleSelectProject(project.id)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{project.name || 'Unnamed'}</p>
                        {project.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
                        )}
                        {project._count?.memoryLinks !== undefined && (
                          <p className="text-xs text-gray-400 mt-1">
                            {project._count.memoryLinks} {project._count.memoryLinks === 1 ? 'memory' : 'memories'}
                          </p>
                        )}
                      </button>
                    ))}
                  {allProjects.filter((project) =>
                    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No topics match your search</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowProjectSelector(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        rawTranscript={feedbackTranscript}
        sessionId={voiceSessionId || ''}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Help Popup */}
      <HelpPopup
        pageKey="capture"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />
    </div>
  );
}
