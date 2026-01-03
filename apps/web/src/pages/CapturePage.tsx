import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { createMemory, analyzeText, PersonMatch, LocationMatch, YouTubeVideoMatch, WordMatch } from '../api/memories';
import { lookupWord } from '../api/admin';
import { getUpcomingReminders } from '../api/reminders';
import { uploadImage, linkImageToMemory } from '../api/images';
import { addUrl, linkUrlPageToMemory } from '../api/urlPages';
import { extractTikTokMetadata, createTikTokVideo } from '../api/tiktok';
import { createDraft } from '../utils/idempotency';
import { compressImage, getSizeReduction } from '../utils/imageCompression';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Clock, AlertCircle, Calendar, Loader, Users, MapPinned, Video, BookOpen, Image as ImageIcon, Link as LinkIcon, X, Mic } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useHaptics } from '../hooks/useHaptics';
import { EntitySuggestionsModal } from '../components/EntitySuggestionsModal';

const memorySchema = z.object({
  text: z.string().min(1, 'Memory text is required'),
});

export function CapturePage() {
  const { user: _user } = useAuth(); // Reserved for future use
  const navigate = useNavigate();
  const location = useLocation();
  const { haptic } = useHaptics();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimitError, setIsRateLimitError] = useState(false);
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem('memoryDraft');
    if (saved) {
      return JSON.parse(saved);
    }
    return createDraft();
  });

  // Text analysis state
  const [textValue, setTextValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedPersons, setDetectedPersons] = useState<PersonMatch[]>([]);
  const [detectedLocations, setDetectedLocations] = useState<LocationMatch[]>([]);
  const [detectedYouTubeVideos, setDetectedYouTubeVideos] = useState<YouTubeVideoMatch[]>([]);
  const [detectedWords, setDetectedWords] = useState<WordMatch[]>([]);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [linkedEntities, setLinkedEntities] = useState<{
    persons: string[];
    locations: string[];
    youtubeVideos: string[];
    tiktokVideos: string[];
  }>({ persons: [], locations: [], youtubeVideos: [], tiktokVideos: [] });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>('');
  const [preLinkedImageId, setPreLinkedImageId] = useState<string | null>(null);
  const [preLinkedUrlPageId, setPreLinkedUrlPageId] = useState<string | null>(null);

  // URL input state
  const [urlInput, setUrlInput] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [addedUrlPage, setAddedUrlPage] = useState<any>(null);
  const [urlError, setUrlError] = useState('');

  // TikTok video state
  const [addingTikTok, setAddingTikTok] = useState(false);
  const [tiktokError, setTiktokError] = useState('');

  // Debounce text input for analysis (1 second delay)
  const debouncedText = useDebounce(textValue, 1000);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  // Fetch upcoming reminders
  const { data: upcomingReminders, isLoading: loadingReminders, error: remindersError } = useQuery({
    queryKey: ['upcoming-reminders'],
    queryFn: getUpcomingReminders,
  });

  // Debug: Log reminders data
  useEffect(() => {
    if (upcomingReminders) {
      console.log('Upcoming reminders:', upcomingReminders);
    }
    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
    }
  }, [upcomingReminders, remindersError]);

  // Clear draft and form when navigating to capture page
  useEffect(() => {
    localStorage.removeItem('memoryDraft');
    setDraft(createDraft());
    reset({ text: '' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Analyze text when debounced value changes
  useEffect(() => {
    const performAnalysis = async () => {
      // Only analyze if text is substantial (>2 characters)
      if (debouncedText.trim().length < 2) {
        setDetectedPersons([]);
        setDetectedLocations([]);
        setDetectedYouTubeVideos([]);
        setDetectedWords([]);
        return;
      }

      setIsAnalyzing(true);
      try {
        const result = await analyzeText(debouncedText);
        setDetectedPersons(result.persons);
        setDetectedLocations(result.locations);
        setDetectedYouTubeVideos(result.youtubeVideos);
        setDetectedWords(result.words);

        // Auto-show modal if entities detected (excluding words)
        if (result.persons.length > 0 || result.locations.length > 0 || result.youtubeVideos.length > 0) {
          setShowEntityModal(true);
        }
      } catch (error) {
        console.error('Text analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    performAnalysis();
  }, [debouncedText]);

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(memorySchema),
    defaultValues: { text: draft.text || '' },
  });

  // Handle image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('Image size must be less than 50MB');
      return;
    }

    setCompressingImage(true);
    setCompressionInfo('');

    try {
      // Compress image
      const originalSize = file.size;
      const compressedFile = await compressImage(file);
      const compressedSize = compressedFile.size;
      const reduction = getSizeReduction(originalSize, compressedSize);

      setSelectedImage(compressedFile);
      setCompressionInfo(`Compressed ${reduction}% (${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB)`);

      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

      haptic('success');
    } catch (err) {
      console.error('Image compression failed:', err);
      // Fall back to original file
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressingImage(false);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCompressionInfo('');
  };

  // Handle URL addition
  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch (err) {
      setUrlError('Please enter a valid URL');
      return;
    }

    setAddingUrl(true);
    setUrlError('');

    try {
      const result = await addUrl({ url: urlInput.trim() });
      setAddedUrlPage(result);
      setUrlInput('');
      console.log('URL added successfully:', result);
    } catch (err: any) {
      console.error('Add URL error:', err);
      setUrlError(err.message || 'Failed to analyze URL');
    } finally {
      setAddingUrl(false);
    }
  };

  // Remove added URL
  const handleRemoveUrl = () => {
    setAddedUrlPage(null);
    setUrlError('');
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

      // Create TikTok video
      const video = await createTikTokVideo(metadata);

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

  const onSubmit = async (data: { text: string }) => {
    haptic('light'); // Haptic feedback on submit
    setError('');
    setIsRateLimitError(false);
    setLoading(true);

    try {
      const memoryDraft = createDraft(data.text);
      setDraft(memoryDraft);
      localStorage.setItem('memoryDraft', JSON.stringify(memoryDraft));

      const createdMemory = await createMemory({
        ...memoryDraft,
        locationId: linkedEntities.locations[0] || undefined,
        personId: linkedEntities.persons[0] || undefined,
        youtubeVideoId: linkedEntities.youtubeVideos[0] || undefined,
        tiktokVideoId: linkedEntities.tiktokVideos[0] || undefined,
      });

      // Upload and link image if one was selected
      if (selectedImage) {
        try {
          setUploadingImage(true);

          // Convert image to base64
          const reader = new FileReader();
          const imageDataPromise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedImage);
          });

          const imageData = await imageDataPromise;

          // Upload image
          const uploadedImage = await uploadImage({
            imageData,
            contentType: selectedImage.type,
            filename: selectedImage.name,
          });

          // Link image to memory
          await linkImageToMemory(uploadedImage.id, createdMemory.id);

          console.log('Image uploaded and linked to memory:', uploadedImage.id);
        } catch (imageError) {
          console.error('Failed to upload image:', imageError);
          // Don't fail the whole operation if image upload fails
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
          // Don't fail the whole operation if image linking fails
        }
      }

      // Link pre-selected URL page if exists
      if (preLinkedUrlPageId) {
        try {
          await linkUrlPageToMemory(preLinkedUrlPageId, createdMemory.id);
          console.log('Pre-linked URL page attached to memory:', preLinkedUrlPageId);
        } catch (urlError) {
          console.error('Failed to link pre-selected URL page:', urlError);
          // Don't fail the whole operation if URL linking fails
        }
      }

      // Link added URL page if exists
      if (addedUrlPage) {
        try {
          await linkUrlPageToMemory(addedUrlPage.id, createdMemory.id);
          console.log('Added URL page attached to memory:', addedUrlPage.id);
        } catch (urlError) {
          console.error('Failed to link added URL page:', urlError);
          // Don't fail the whole operation if URL linking fails
        }
      }

      // Clear draft, linked entities, image, and URL
      localStorage.removeItem('memoryDraft');
      setDraft(createDraft());
      setLinkedEntities({ persons: [], locations: [], youtubeVideos: [], tiktokVideos: [] });
      setSelectedImage(null);
      setImagePreview(null);
      setPreLinkedImageId(null);
      setPreLinkedUrlPageId(null);
      setAddedUrlPage(null);
      setUrlInput('');
      reset();

      // Success haptic feedback
      haptic('success');

      // Navigate directly to link page
      navigate(`/app/memories/${createdMemory.id}/link`);
    } catch (err: any) {
      // Error haptic feedback
      haptic('error');

      // Check if it's a rate limit error (429)
      if (err.status === 429) {
        setIsRateLimitError(true);
        setError('You\'ve reached your daily memory limit.');
      } else if (err.status === 500 && err.message.includes('Database lookup failed')) {
        // Database integrity check failed
        setError('Unable to verify word uniqueness. Please try again.');
      } else {
        setError(err.message || 'Failed to save memory');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatReminderTime = (scheduledAt: string, isOverdue?: boolean) => {
    const date = new Date(scheduledAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    const days = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));

    if (isOverdue) {
      if (hours < 24) return `${hours}h overdue`;
      return `${days}d overdue`;
    }

    if (hours < 1) return 'Due soon';
    if (hours < 24) return `In ${hours}h`;
    return `In ${days}d`;
  };

  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    setValue('text', newValue); // Update form value
  };

  // Handle person confirmation
  const handleConfirmPerson = (person: PersonMatch, selectedExisting?: string) => {
    console.log('Person confirmed:', person.extractedName, selectedExisting);

    // Store the person ID for linking when creating memory
    if (selectedExisting) {
      setLinkedEntities(prev => ({
        ...prev,
        persons: [...prev.persons, selectedExisting],
      }));
    }

    // Remove this person from detectedPersons
    setDetectedPersons(prev => prev.filter(p => p.extractedName !== person.extractedName));
  };

  // Handle location confirmation
  const handleConfirmLocation = (location: LocationMatch, selectedExisting?: string) => {
    console.log('Location confirmed:', location.extractedName, selectedExisting);

    // Store the location ID for linking when creating memory
    if (selectedExisting) {
      setLinkedEntities(prev => ({
        ...prev,
        locations: [...prev.locations, selectedExisting],
      }));
    }

    // Remove this location from detectedLocations
    setDetectedLocations(prev => prev.filter(l => l.extractedName !== location.extractedName));
  };

  // Handle YouTube video confirmation
  const handleConfirmYouTubeVideo = async (video: YouTubeVideoMatch, selectedExisting?: string) => {
    console.log('YouTube video confirmed:', video.url, selectedExisting);

    try {
      let videoId = selectedExisting;

      // If it's a new video, create it first
      if (video.isNewVideo && !selectedExisting) {
        const { createYouTubeVideoFromUrl } = await import('../api/admin');
        const createdVideo = await createYouTubeVideoFromUrl(video.url);
        videoId = createdVideo.id;
      }

      // Store the video ID for linking when creating memory
      if (videoId) {
        setLinkedEntities(prev => ({
          ...prev,
          youtubeVideos: [...prev.youtubeVideos, videoId],
        }));
      }

      // Remove this video from detectedYouTubeVideos
      setDetectedYouTubeVideos(prev => prev.filter(v => v.videoId !== video.videoId));
    } catch (error) {
      console.error('Failed to create YouTube video:', error);
    }
  };

  const handleConfirmWord = async (wordMatch: WordMatch) => {
    console.log('Word confirmed:', wordMatch.word);

    // If it's a new word, create a vocabulary entry for it
    if (wordMatch.isNewWord) {
      try {
        // Check if word already exists
        const existingWords = await lookupWord(wordMatch.word.toLowerCase().trim());

        if (existingWords && existingWords.length > 0) {
          setError(`Word "${wordMatch.word}" already exists in vocabulary`);
          setTimeout(() => setError(''), 3000);
          setDetectedWords(prev => prev.filter(w => w.word !== wordMatch.word));
          return;
        }

        const wordDraft = createDraft(wordMatch.word);

        // Create a separate memory for this word (vocabulary entry)
        // Set typeId to 'word' type to ensure proper word table creation
        await createMemory({
          ...wordDraft,
          text: wordMatch.word,
          typeId: 'b172102f-836a-45f7-9d87-cb192bacca6a', // Word memory type
        });

        // Remove this word from detected words
        setDetectedWords(prev => prev.filter(w => w.word !== wordMatch.word));

        setError(''); // Clear any errors
        // Show brief success indication (no message, just removal from list indicates success)
      } catch (error) {
        console.error('Failed to add word:', error);
        setError('Failed to add word to vocabulary');
        setTimeout(() => setError(''), 3000);
      }
    } else {
      // Word already exists - just remove from list
      setDetectedWords(prev => prev.filter(w => w.word !== wordMatch.word));
    }
  };


  // Voice input handler
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError('Speech recognition is not supported in your browser');
      haptic('error');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      haptic('light');
      setIsListening(true);
      setVoiceError('');
    };

    recognition.onresult = (event: any) => {
      haptic('success');
      const transcript = event.results[0][0].transcript;
      const newValue = textValue + (textValue ? ' ' : '') + transcript;
      setTextValue(newValue);
      setValue('text', newValue);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setVoiceError('Voice input failed. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="max-w-2xl mx-auto">
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

      {/* YouTube video auto-link indicator */}
      {linkedEntities.youtubeVideos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">
              YouTube video will be automatically linked to this memory
            </p>
          </div>
        </div>
      )}

      {/* TikTok video auto-link indicator */}
      {linkedEntities.tiktokVideos.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-pink-600" />
            <p className="text-sm font-medium text-pink-900">
              TikTok video will be automatically linked to this memory
            </p>
          </div>
        </div>
      )}

      {/* TikTok error indicator */}
      {tiktokError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">{tiktokError}</p>
          </div>
        </div>
      )}

      {/* Pre-linked image indicator */}
      {preLinkedImageId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">
              Image will be automatically linked to this memory
            </p>
          </div>
        </div>
      )}

      {/* Pre-linked URL page indicator */}
      {preLinkedUrlPageId && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-medium text-purple-900">
              Web page will be automatically linked to this memory
            </p>
          </div>
        </div>
      )}

      {/* Mobile save button - at top to avoid keyboard */}
      <div className="md:hidden mb-4">
        <button
          type="submit"
          form="capture-form"
          disabled={loading || uploadingImage || addingUrl || addingTikTok}
          className="w-full h-12 px-6 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-md transition-all active:scale-95"
        >
          {uploadingImage ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              Uploading...
            </span>
          ) : addingUrl ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              Analyzing...
            </span>
          ) : addingTikTok ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              Adding TikTok...
            </span>
          ) : loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Memory'
          )}
        </button>
      </div>

      <form id="capture-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4 mb-8">
        {/* Text input first */}
        <div>
          <label htmlFor="text" className="hidden md:block text-sm font-medium text-gray-700 mb-2">
            What do you want to remember?
          </label>
          <div className="relative">
            <textarea
              id="text"
              value={textValue}
              onChange={handleTextChange}
              rows={window.innerWidth < 768 ? 4 : 6}
              autoFocus
              className="w-full px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Write your memory here..."
            />
            {isAnalyzing && (
              <div className="absolute top-2 right-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </div>
            )}
            {/* Voice input button (mobile only) */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening}
              className="md:hidden absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              title="Voice input"
            >
              <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
            </button>
          </div>
          {voiceError && (
            <p className="mt-1 text-sm text-red-600">{voiceError}</p>
          )}
          {errors.text?.message && (
            <p className="mt-1 text-sm text-red-600">{String(errors.text.message)}</p>
          )}

          {/* Entity detection badges */}
          {(detectedPersons.length > 0 || detectedLocations.length > 0 || detectedYouTubeVideos.length > 0 || detectedWords.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {detectedPersons.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowEntityModal(true)}
                  className="inline-flex items-center gap-1 h-12 md:h-10 px-4 md:px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-md text-base md:text-sm hover:bg-purple-100 transition-colors"
                >
                  <Users className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">{detectedPersons.length} {detectedPersons.length === 1 ? 'person' : 'people'} detected</span>
                  <span className="md:hidden">{detectedPersons.length} {detectedPersons.length === 1 ? 'person' : 'people'}</span>
                </button>
              )}
              {detectedLocations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowEntityModal(true)}
                  className="inline-flex items-center gap-1 h-12 md:h-10 px-4 md:px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-md text-base md:text-sm hover:bg-green-100 transition-colors"
                >
                  <MapPinned className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">{detectedLocations.length} {detectedLocations.length === 1 ? 'location' : 'locations'} detected</span>
                  <span className="md:hidden">{detectedLocations.length} {detectedLocations.length === 1 ? 'location' : 'locations'}</span>
                </button>
              )}
              {detectedYouTubeVideos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowEntityModal(true)}
                  className="inline-flex items-center gap-1 h-12 md:h-10 px-4 md:px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-base md:text-sm hover:bg-red-100 transition-colors"
                >
                  <Video className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">{detectedYouTubeVideos.length} {detectedYouTubeVideos.length === 1 ? 'video' : 'videos'} detected</span>
                  <span className="md:hidden">{detectedYouTubeVideos.length} {detectedYouTubeVideos.length === 1 ? 'video' : 'videos'}</span>
                </button>
              )}
              {detectedWords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowEntityModal(true)}
                  className="inline-flex items-center gap-1 h-12 md:h-10 px-4 md:px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-base md:text-sm hover:bg-indigo-100 transition-colors"
                >
                  <BookOpen className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">Words/Phrases ({detectedWords.length})</span>
                  <span className="md:hidden">Words ({detectedWords.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Media buttons - Voice (desktop only), Image, YouTube, TikTok, URL */}
        <div className="flex gap-2">
          {/* Voice input button (desktop only) */}
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isListening}
            className="hidden md:inline-flex items-center justify-center h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Voice input"
          >
            <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse text-blue-600' : ''}`} />
          </button>

          {/* Image upload */}
          {!imagePreview ? (
            <label
              htmlFor="image-upload"
              className={`inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 ${compressingImage ? 'opacity-50 cursor-wait' : ''}`}
              title="Add image"
            >
              {compressingImage ? (
                <Loader className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5 md:h-4 md:w-4" />
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="sr-only"
                disabled={compressingImage}
              />
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  loading="lazy"
                  className="h-12 md:h-10 w-auto rounded-md border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 min-w-[24px] min-h-[24px] p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {compressionInfo && (
                <span className="hidden md:inline text-xs text-green-600">
                  {compressionInfo}
                </span>
              )}
            </div>
          )}

          {/* YouTube button */}
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter YouTube URL:');
              if (url && url.trim()) {
                setTextValue(prev => prev + (prev ? '\n' : '') + url);
                setValue('text', textValue + (textValue ? '\n' : '') + url);
              }
            }}
            className="inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Add YouTube video"
          >
            <Video className="h-5 w-5 md:h-4 md:w-4 text-red-600" />
          </button>

          {/* TikTok button */}
          <button
            type="button"
            onClick={handleAddTikTok}
            disabled={addingTikTok}
            className="inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Add TikTok video"
          >
            {addingTikTok ? (
              <Loader className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
            ) : (
              <Video className="h-5 w-5 md:h-4 md:w-4" />
            )}
          </button>
        </div>

        {/* URL input field */}
        <div>
          {!addedUrlPage ? (
            <div className="mt-1">
              <div className="flex gap-2">
                <input
                  id="url"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  placeholder="https://example.com"
                  className="flex-1 h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={addingUrl}
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={addingUrl || !urlInput.trim()}
                  className="inline-flex items-center justify-center gap-2 h-12 md:h-10 px-4 md:px-3 py-2 border border-transparent rounded-md shadow-sm text-base md:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  title="Add URL"
                >
                  {addingUrl ? (
                    <Loader className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-5 w-5 md:h-4 md:w-4" />
                  )}
                </button>
              </div>
              {urlError && (
                <p className="mt-1 text-xs text-red-600">{urlError}</p>
              )}
            </div>
          ) : (
            <div className="mt-1 border border-purple-200 rounded-md p-3 bg-purple-50">
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
                  className="ml-2 min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] p-2 md:p-1 text-red-600 hover:text-red-800 focus:outline-none flex items-center justify-center"
                >
                  <X className="h-5 w-5 md:h-4 md:w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop submit button */}
        <div className="hidden md:flex items-center justify-between">
          <button
            type="submit"
            disabled={loading || uploadingImage || addingUrl || addingTikTok}
            className="w-full md:w-auto h-10 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploadingImage ? (
              'Uploading image...'
            ) : addingUrl ? (
              'Analyzing URL...'
            ) : addingTikTok ? (
              'Adding TikTok...'
            ) : loading ? (
              'Saving...'
            ) : (
              'Save Memory'
            )}
          </button>
        </div>
      </form>

      {/* Upcoming Reminders Section - Now at the bottom */}
      <div className="border-t border-gray-200 pt-4 md:pt-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
          <span className="hidden md:inline">Upcoming Reminders</span>
          <span className="md:hidden">Reminders</span>
        </h2>

        {loadingReminders && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Loading reminders...</p>
          </div>
        )}

        {remindersError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Debug: Error loading reminders - Check console for details
            </p>
          </div>
        )}

        {!loadingReminders && upcomingReminders && upcomingReminders.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              No upcoming reminders. Create a memory with type "Word" to see reminders here!
            </p>
          </div>
        )}

        {!loadingReminders && upcomingReminders && upcomingReminders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                You have {upcomingReminders.length} upcoming {upcomingReminders.length === 1 ? 'reminder' : 'reminders'}
              </p>
            </div>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <div
                  key={reminder.reminderId}
                  className="bg-white rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/app/memories/${reminder.memoryId}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 line-clamp-2">{reminder.memoryPreview}</p>
                      {reminder.memoryType && (
                        <div className="mt-1">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: reminder.memoryType.color + '20',
                              color: reminder.memoryType.color,
                            }}
                          >
                            <span>{reminder.memoryType.icon}</span>
                            <span>{reminder.memoryType.name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {reminder.isOverdue ? (
                        <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {formatReminderTime(reminder.scheduledAt, true)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Calendar className="h-3 w-3" />
                          {formatReminderTime(reminder.scheduledAt, false)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entity suggestions modal */}
      <EntitySuggestionsModal
        isOpen={showEntityModal}
        onClose={() => setShowEntityModal(false)}
        persons={detectedPersons}
        locations={detectedLocations}
        youtubeVideos={detectedYouTubeVideos}
        words={detectedWords}
        onConfirmPerson={handleConfirmPerson}
        onConfirmLocation={handleConfirmLocation}
        onConfirmYouTubeVideo={handleConfirmYouTubeVideo}
        onConfirmWord={handleConfirmWord}
        onSkip={() => {
          setDetectedPersons([]);
          setDetectedLocations([]);
          setDetectedYouTubeVideos([]);
          setDetectedWords([]);
          setShowEntityModal(false);
        }}
      />

    </div>
  );
}

