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
import { Loader, Users, MapPinned, Video, Image as ImageIcon, Link as LinkIcon, X, Mic, FolderKanban, GraduationCap, MessageSquare, Camera, BookMarked, AlertCircle } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { FeedbackModal } from '../components/FeedbackModal';
import { HelpPopup } from '../components/HelpPopup';
import { submitFeedback } from '../api/transcription';

const memorySchema = z.object({
  text: z.string().min(1, 'Memory text is required'),
});

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
        const definition = await generateDefinition(trimmedTitle);
        setTextValue(definition);
        setValue('text', definition); // Update react-hook-form value
        haptic('light');
      } catch (err) {
        console.error('Failed to generate definition:', err);
        // Don't show error to user - they can still type manually
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

  // Handle save to memory deck button click - saves memory to deck
  const handleSaveToMemoryDeck = async () => {
    if (!textValue.trim()) {
      return;
    }

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
        content: textValue,
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

      // Link URL if one was added
      if (addedUrlPage) {
        try {
          await linkUrlPageToMemory(addedUrlPage.id, createdMemory.id);
        } catch (urlError) {
          console.error('Failed to link URL:', urlError);
        }
      }

      // Link project if one was selected
      if (linkedEntities.projects[0]) {
        try {
          await linkMemoryToProject(createdMemory.id, linkedEntities.projects[0]);
        } catch (projectError) {
          console.error('Failed to link project:', projectError);
        }
      }

      // Process phrase/word linking if text is 1-3 words
      if (textValue.trim().split(/\s+/).length <= 3) {
        try {
          await processMemoryPhrase(createdMemory.id, textValue.trim());
        } catch (phraseError) {
          console.error('Failed to process phrase:', phraseError);
        }
      }

      // Link topic if one was entered
      if (topicInput.trim()) {
        // Topic linking is handled separately via the topic input
      }

      // Handle training input - create or find training by name
      if (trainingInput.trim()) {
        try {
          const { createTraining, getAllTrainings, linkMemoryToTraining } = await import('../api/trainings');

          // Get all trainings to check if training already exists
          const allTrainings = await getAllTrainings();
          let trainingId: string | null = null;

          // Check if a training with this name already exists (case-insensitive)
          const existingTraining = allTrainings.find(
            t => t.name.toLowerCase() === trainingInput.trim().toLowerCase()
          );

          if (existingTraining) {
            // Training exists, use its ID
            trainingId = existingTraining.id;
            console.log('Found existing training:', existingTraining.name);
          } else {
            // Training doesn't exist, create it
            const newTraining = await createTraining({ name: trainingInput.trim() });
            trainingId = newTraining.id;
            console.log('Created new training:', newTraining.name);
          }

          // Link memory to training
          if (trainingId) {
            await linkMemoryToTraining(trainingId, createdMemory.id);
            console.log('Memory linked to training:', trainingId);
          }
        } catch (trainingError) {
          console.error('Failed to create/link training:', trainingError);
          // Don't fail the whole operation if training creation/linking fails
        }
      }

      // Reset form
      reset({ text: '' });
      setTextValue('');
      setTopicInput('');
      setTagsInput('');
      setSuggestedTopic(null);
      setTrainingInput('');
      setSuggestedTraining(null);
      setSelectedImage(null);
      setImagePreview(null);
      setCompressionInfo('');
      setAddedUrlPage(null);
      setLinkedEntities({ persons: [], locations: [], youtubeVideos: [], tiktokVideos: [], projects: [], trainings: [] });

      // Invalidate SAM memories query so the list refreshes
      queryClient.invalidateQueries({ queryKey: ['sam-memories'] });

      haptic('success');

      // Stay on capture page - ready for next memory
    } catch (err: any) {
      console.error('Create memory error:', err);
      setError(err.message || 'Failed to create memory');
      if (err.status === 429) {
        setIsRateLimitError(true);
      }
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Ask button click - saves memory and asks OpenAI
  const handleAskButtonClick = async () => {
    if (!textValue.trim()) {
      return;
    }

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
        content: textValue,
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

      // Link URL if one was added
      if (addedUrlPage) {
        try {
          await linkUrlPageToMemory(addedUrlPage.id, createdMemory.id);
        } catch (urlError) {
          console.error('Failed to link URL:', urlError);
        }
      }

      // Link project if one was selected
      if (linkedEntities.projects[0]) {
        try {
          await linkMemoryToProject(createdMemory.id, linkedEntities.projects[0]);
        } catch (projectError) {
          console.error('Failed to link project:', projectError);
        }
      }

      // Ask OpenAI and save question/answer
      try {
        await createQuestion({
          memoryId: createdMemory.id,
          question: textValue.trim(),
        });
      } catch (questionError) {
        console.error('Failed to create question:', questionError);
        // Continue anyway - memory was saved successfully
      }

      // Process phrase/word linking in background (fire and forget)
      if (textValue.trim().split(/\s+/).length <= 3) {
        processMemoryPhrase(createdMemory.id, textValue.trim()).catch(error => {
          console.error('Failed to process phrase:', error);
        });
      }

      // Handle training input - create or find training by name
      if (trainingInput.trim()) {
        try {
          const { createTraining, getAllTrainings, linkMemoryToTraining } = await import('../api/trainings');

          // Get all trainings to check if training already exists
          const allTrainings = await getAllTrainings();
          let trainingId: string | null = null;

          // Check if a training with this name already exists (case-insensitive)
          const existingTraining = allTrainings.find(
            t => t.name.toLowerCase() === trainingInput.trim().toLowerCase()
          );

          if (existingTraining) {
            // Training exists, use its ID
            trainingId = existingTraining.id;
            console.log('Found existing training:', existingTraining.name);
          } else {
            // Training doesn't exist, create it
            const newTraining = await createTraining({ name: trainingInput.trim() });
            trainingId = newTraining.id;
            console.log('Created new training:', newTraining.name);
          }

          // Link memory to training
          if (trainingId) {
            await linkMemoryToTraining(trainingId, createdMemory.id);
            console.log('Memory linked to training:', trainingId);
          }
        } catch (trainingError) {
          console.error('Failed to create/link training:', trainingError);
          // Don't fail the whole operation if training creation/linking fails
        }
      }

      // Reset form
      reset({ text: '' });
      setTextValue('');
      setTopicInput('');
      setTagsInput('');
      setSuggestedTopic(null);
      setTrainingInput('');
      setSuggestedTraining(null);
      setSelectedImage(null);
      setImagePreview(null);
      setCompressionInfo('');
      setAddedUrlPage(null);
      setLinkedEntities({ persons: [], locations: [], youtubeVideos: [], tiktokVideos: [], projects: [], trainings: [] });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['sam-memories'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });

      haptic('success');

      // Stay on capture page - ready for next memory
    } catch (err: any) {
      console.error('Create memory/question error:', err);
      setError(err.message || 'Failed to create memory');
      if (err.status === 429) {
        setIsRateLimitError(true);
      }
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: { text: string }) => {
    haptic('light'); // Haptic feedback on submit
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

      // Handle topic input - create or find topic by name
      if (topicInput.trim()) {
        try {
          const { createProject, getAllProjects, linkMemoryToProject } = await import('../api/projects');

          // Get all projects to check if topic already exists
          const allProjects = await getAllProjects();
          let topicId: string | null = null;

          // Check if a topic with this name already exists (case-insensitive)
          const existingTopic = allProjects.find(
            p => p.name.toLowerCase() === topicInput.trim().toLowerCase()
          );

          if (existingTopic) {
            // Topic exists, use its ID
            topicId = existingTopic.id;
            console.log('Found existing topic:', existingTopic.name);
          } else {
            // Topic doesn't exist, create it
            const newTopic = await createProject({ name: topicInput.trim() });
            topicId = newTopic.id;
            console.log('Created new topic:', newTopic.name);
          }

          // Link memory to topic
          if (topicId) {
            await linkMemoryToProject(topicId, createdMemory.id);
            console.log('Memory linked to topic:', topicId);
          }
        } catch (topicError) {
          console.error('Failed to create/link topic:', topicError);
          // Don't fail the whole operation if topic creation/linking fails
        }
      }

      // Link to project if selected (from project selector button)
      if (linkedEntities.projects.length > 0) {
        try {
          await linkMemoryToProject(linkedEntities.projects[0], createdMemory.id);
          console.log('Memory linked to project:', linkedEntities.projects[0]);
        } catch (projectError) {
          console.error('Failed to link memory to project:', projectError);
          // Don't fail the whole operation if project linking fails
        }
      }

      // Handle training input - create or find training by name
      if (trainingInput.trim()) {
        try {
          const { createTraining, getAllTrainings, linkMemoryToTraining } = await import('../api/trainings');

          // Get all trainings to check if training already exists
          const allTrainings = await getAllTrainings();
          let trainingId: string | null = null;

          // Check if a training with this name already exists (case-insensitive)
          const existingTraining = allTrainings.find(
            t => t.name.toLowerCase() === trainingInput.trim().toLowerCase()
          );

          if (existingTraining) {
            // Training exists, use its ID
            trainingId = existingTraining.id;
            console.log('Found existing training:', existingTraining.name);
          } else {
            // Training doesn't exist, create it
            const newTraining = await createTraining({ name: trainingInput.trim() });
            trainingId = newTraining.id;
            console.log('Created new training:', newTraining.name);
          }

          // Link memory to training
          if (trainingId) {
            await linkMemoryToTraining(trainingId, createdMemory.id);
            console.log('Memory linked to training:', trainingId);
          }
        } catch (trainingError) {
          console.error('Failed to create/link training:', trainingError);
          // Don't fail the whole operation if training creation/linking fails
        }
      }

      // Link to training if selected (from training selector button)
      if (linkedEntities.trainings.length > 0) {
        try {
          await linkMemoryToTraining(linkedEntities.trainings[0], createdMemory.id);
          console.log('Memory linked to training:', linkedEntities.trainings[0]);
        } catch (trainingError) {
          console.error('Failed to link memory to training:', trainingError);
          // Don't fail the whole operation if training linking fails
        }
      }

      // Process phrase/word linking in background (fire and forget)
      // This handles 1-3 word memories, creating word entries and linking them
      processMemoryPhrase(createdMemory.id, data.text).catch(error => {
        console.error('Failed to process phrase linking:', error);
        // Don't fail the whole operation if phrase linking fails
      });

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

      // Success haptic feedback
      haptic('success');

      // Invalidate SAM memories query so the list refreshes
      queryClient.invalidateQueries({ queryKey: ['sam-memories'] });

      // Stay on capture page - ready for next memory
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

      {/* YouTube error indicator */}
      {youtubeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">{youtubeError}</p>
          </div>
        </div>
      )}

      {/* YouTube linked indicator */}
      {linkedEntities.youtubeVideos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">
              YouTube video linked to this memory
            </p>
          </div>
        </div>
      )}

      {/* Person linked indicator */}
      {linkedEntities.persons.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  {selectedPersonName || 'Person linked to this memory'}
                </p>
                {selectedPersonName && (
                  <p className="text-xs text-purple-700">
                    Linked to this memory
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePerson}
              className="text-purple-600 hover:text-purple-800 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Location linked indicator */}
      {linkedEntities.locations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">
                Location linked to this memory
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveLocation}
              className="text-green-600 hover:text-green-800 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Topic linked indicator */}
      {linkedEntities.projects.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                Topic linked to this memory
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveProject}
              className="text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Training linked indicator */}
      {linkedEntities.trainings.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">
                Training linked to this memory
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveTraining}
              className="text-purple-600 hover:text-purple-800 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
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

      {/* Mobile save buttons - at top to avoid keyboard */}
      <div className="md:hidden mb-4 flex gap-2">
        <button
          type="submit"
          form="capture-form"
          disabled={loading || uploadingImage || addingUrl || addingTikTok || addingYouTube}
          className="flex-1 h-12 px-4 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-md transition-all active:scale-95"
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
          ) : addingYouTube ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              Adding YouTube...
            </span>
          ) : loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              Saving...
            </span>
          ) : (
            'Save'
          )}
        </button>
        <button
          type="button"
          onClick={handleSaveToMemoryDeck}
          disabled={loading || !textValue.trim() || uploadingImage || addingUrl || addingTikTok || addingYouTube}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-md transition-all active:scale-95"
        >
          <BookMarked className="h-5 w-5" />
          <span className="hidden xs:inline">Save → Memory</span>
          <span className="xs:hidden">→ Memory</span>
        </button>
        <button
          type="button"
          onClick={handleAskButtonClick}
          disabled={loading || !textValue.trim() || uploadingImage || addingUrl || addingTikTok || addingYouTube}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-base font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 shadow-md transition-all active:scale-95"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Ask</span>
        </button>
      </div>

      <form id="capture-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4 mb-8">
        {/* Title input field first */}
        <div className="relative">
          <label htmlFor="topic" className="hidden md:block text-sm font-medium text-gray-700 mb-2">
            Title
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

        {/* Text input field */}
        <div>
          <label htmlFor="text" className="hidden md:block text-sm font-medium text-gray-700 mb-2">
            {loadingDefinition ? 'Generating definition...' : 'What do you want to remember?'}
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="text"
              value={textValue}
              onChange={handleTextChange}
              rows={2}
              className="w-full px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
              placeholder={loadingDefinition ? "Generating definition..." : "Memory content (auto-filled if you enter a word/phrase above)..."}
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

        {/* Tags input field */}
        <div className="relative">
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags (comma-separated, optional) - e.g. work, personal, ideas"
            className="w-full h-12 md:h-10 px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Training input field */}
        <div className="relative">
          <input
            id="training"
            type="text"
            value={trainingInput}
            onChange={(e) => handleTrainingInputChange(e.target.value)}
            placeholder="Training (optional)"
            className="w-full h-12 md:h-10 px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          />

          {/* Training suggestion popup */}
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
                    onClick={acceptSuggestedTraining}
                    className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={dismissSuggestedTraining}
                    className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Media buttons - Two rows on mobile for better fit */}
        <div className="grid grid-cols-4 md:flex gap-2">
          {/* Voice input button (desktop only) */}
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={voiceState === 'processing'}
            className={`hidden md:inline-flex items-center justify-center h-10 px-3 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
              voiceState === 'recording'
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={voiceState === 'recording' ? 'Stop recording' : 'Voice input'}
          >
            <Mic className={`h-4 w-4 ${voiceState === 'recording' ? 'animate-pulse' : ''}`} />
          </button>

          {/* Camera capture button */}
          {!imagePreview ? (
            <>
              <label
                htmlFor="camera-capture"
                onClick={handleCameraButtonClick}
                className={`inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border border-blue-300 rounded-md shadow-sm text-base md:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 ${compressingImage ? 'opacity-50 cursor-wait' : ''}`}
                title="Take photo"
              >
                {compressingImage ? (
                  <Loader className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 md:h-4 md:w-4" />
                )}
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

              {/* Image upload from gallery */}
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 ${compressingImage ? 'opacity-50 cursor-wait' : ''}`}
                title="Choose from gallery"
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
            </>
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

          {/* Person button */}
          <button
            type="button"
            onClick={handleAddPerson}
            disabled={linkedEntities.persons.length > 0}
            className={`inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border rounded-md shadow-sm text-base md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              linkedEntities.persons.length > 0
                ? 'border-purple-300 bg-purple-100 text-purple-400 cursor-not-allowed'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Link to person"
          >
            <Users className="h-5 w-5 md:h-4 md:w-4 text-purple-600" />
          </button>

          {/* Location button */}
          <button
            type="button"
            onClick={handleAddLocation}
            disabled={linkedEntities.locations.length > 0}
            className={`inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border rounded-md shadow-sm text-base md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 ${
              linkedEntities.locations.length > 0
                ? 'border-green-300 bg-green-100 text-green-400 cursor-not-allowed'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Link to location"
          >
            <MapPinned className="h-5 w-5 md:h-4 md:w-4 text-green-600" />
          </button>

          {/* Topic button */}
          <button
            type="button"
            onClick={handleAddProject}
            disabled={linkedEntities.projects.length > 0}
            className={`inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border rounded-md shadow-sm text-base md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              linkedEntities.projects.length > 0
                ? 'border-blue-300 bg-blue-100 text-blue-400 cursor-not-allowed'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Link to topic"
          >
            <FolderKanban className="h-5 w-5 md:h-4 md:w-4 text-blue-600" />
          </button>

          {/* YouTube button */}
          <button
            type="button"
            onClick={handleAddYouTube}
            disabled={addingYouTube}
            className="inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            title="Add YouTube video"
          >
            {addingYouTube ? (
              <Loader className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
            ) : (
              <Video className="h-5 w-5 md:h-4 md:w-4 text-red-600" />
            )}
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

          {/* URL button */}
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={addingUrl}
            className="inline-flex items-center justify-center h-12 md:h-10 px-4 md:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            title="Add URL"
          >
            {addingUrl ? (
              <Loader className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
            ) : (
              <LinkIcon className="h-5 w-5 md:h-4 md:w-4" />
            )}
          </button>
        </div>

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
                className="ml-2 min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] p-2 md:p-1 text-red-600 hover:text-red-800 focus:outline-none flex items-center justify-center"
              >
                <X className="h-5 w-5 md:h-4 md:w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop submit buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || uploadingImage || addingUrl || addingTikTok || addingYouTube}
            className="flex-1 h-10 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploadingImage ? (
              'Uploading image...'
            ) : addingUrl ? (
              'Analyzing URL...'
            ) : addingTikTok ? (
              'Adding TikTok...'
            ) : addingYouTube ? (
              'Adding YouTube...'
            ) : loading ? (
              'Saving...'
            ) : (
              'Save'
            )}
          </button>
          <button
            type="button"
            onClick={handleSaveToMemoryDeck}
            disabled={loading || !textValue.trim() || uploadingImage || addingUrl || addingTikTok || addingYouTube}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <BookMarked className="h-4 w-4" />
            Save → Memory
          </button>
          <button
            type="button"
            onClick={handleAskButtonClick}
            disabled={loading || !textValue.trim() || uploadingImage || addingUrl || addingTikTok || addingYouTube}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-md hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            Ask
          </button>
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

