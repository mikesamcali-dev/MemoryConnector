import { useState } from 'react';
import { TrainingLesson } from '../api/training-decks';
import { ExternalLink, X } from 'lucide-react';

interface TrainingLessonCardProps {
  lesson: TrainingLesson;
}

export function TrainingLessonCard({ lesson }: TrainingLessonCardProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Render memory content
  if (lesson.memory) {
    const { memory } = lesson;
    return (
      <div className="bg-white rounded-lg shadow-2xl w-full p-4 md:p-8 space-y-3 md:space-y-4">
        {/* Memory body */}
        {memory.body && (
          <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
            <p className="text-base md:text-xl text-center font-medium">{memory.body}</p>
          </div>
        )}

        {/* Word (left) | Description (right) */}
        {memory.wordLinks && memory.wordLinks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="md:col-span-1 p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
              <p className="font-bold text-base md:text-lg">{memory.wordLinks[0].word.word}</p>
            </div>
            <div className="md:col-span-2 p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
              <p className="text-sm md:text-base">{memory.wordLinks[0].word.description || 'No description available'}</p>
            </div>
          </div>
        )}

        {/* Image - full width, clickable */}
        {memory.imageLinks && memory.imageLinks.length > 0 && (
          <div
            className="border-2 border-black rounded overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLightboxImage(memory.imageLinks![0].image.storageUrl)}
          >
            <img
              src={
                memory.imageLinks[0].image.thumbnailUrl1024 ||
                memory.imageLinks[0].image.storageUrl
              }
              alt="Memory"
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
        )}

        {/* URL Page title */}
        {memory.urlPageLinks &&
          memory.urlPageLinks.length > 0 &&
          memory.urlPageLinks[0].urlPage.title && (
            <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
              <p className="text-base md:text-lg font-medium">{memory.urlPageLinks[0].urlPage.title}</p>
            </div>
          )}

        {/* URL Page summary */}
        {memory.urlPageLinks &&
          memory.urlPageLinks.length > 0 &&
          memory.urlPageLinks[0].urlPage.summary && (
            <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
              <p className="text-sm md:text-base">{memory.urlPageLinks[0].urlPage.summary}</p>
            </div>
          )}

        {/* YouTube video */}
        {memory.youtubeVideo && (
          <a
            href={memory.youtubeVideo.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-2 border-black rounded overflow-hidden hover:shadow-lg transition-shadow"
          >
            {memory.youtubeVideo.thumbnailUrl && (
              <img
                src={memory.youtubeVideo.thumbnailUrl}
                alt={memory.youtubeVideo.title}
                className="w-full h-48 md:h-64 object-cover"
              />
            )}
            <div className="p-3 md:p-4 bg-red-100 flex items-center justify-between gap-2">
              <p className="font-medium text-sm md:text-base flex-1">{memory.youtubeVideo.title}</p>
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
            </div>
          </a>
        )}

        {/* TikTok video */}
        {memory.tiktokVideo && (
          <a
            href={memory.tiktokVideo.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-2 border-black rounded overflow-hidden hover:shadow-lg transition-shadow"
          >
            {memory.tiktokVideo.thumbnailUrl && (
              <img
                src={memory.tiktokVideo.thumbnailUrl}
                alt={memory.tiktokVideo.title}
                className="w-full h-48 md:h-64 object-cover"
              />
            )}
            <div className="p-3 md:p-4 bg-gray-100 flex items-center justify-between gap-2">
              <p className="font-medium text-sm md:text-base flex-1">{memory.tiktokVideo.title}</p>
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
            </div>
          </a>
        )}

        {/* Event info */}
        {memory.event && (
          <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
            <p className="font-bold text-sm md:text-base">Event: {memory.event.name}</p>
            {memory.event.description && (
              <p className="text-xs md:text-sm mt-1">{memory.event.description}</p>
            )}
          </div>
        )}

        {/* Location info */}
        {memory.location && (
          <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
            <p className="font-bold text-sm md:text-base">Location: {memory.location.name}</p>
            {memory.location.city && memory.location.country && (
              <p className="text-xs md:text-sm mt-1">{memory.location.city}, {memory.location.country}</p>
            )}
          </div>
        )}

        {/* Person info */}
        {memory.person && (
          <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
            <p className="font-bold text-sm md:text-base">Person: {memory.person.displayName}</p>
          </div>
        )}

        {/* Lightbox for images */}
        {lightboxImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    );
  }

  // Render image content
  if (lesson.image) {
    const { image } = lesson;
    return (
      <div className="bg-white rounded-lg shadow-2xl w-full p-4 md:p-8">
        <div
          className="border-2 border-black rounded overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setLightboxImage(image.storageUrl)}
        >
          <img
            src={image.thumbnailUrl1024 || image.storageUrl}
            alt="Training image"
            className="w-full h-auto object-contain max-h-[60vh]"
          />
        </div>

        {/* Lightbox */}
        {lightboxImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    );
  }

  // Render URL page content
  if (lesson.urlPage) {
    const { urlPage } = lesson;
    return (
      <div className="bg-white rounded-lg shadow-2xl w-full p-4 md:p-8 space-y-3 md:space-y-4">
        {urlPage.title && (
          <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
            <p className="text-base md:text-xl font-medium">{urlPage.title}</p>
          </div>
        )}

        {urlPage.description && (
          <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
            <p className="text-sm md:text-base">{urlPage.description}</p>
          </div>
        )}

        {urlPage.summary && (
          <div className="p-3 md:p-4 bg-purple-100 border-2 border-black rounded">
            <p className="text-sm md:text-base">{urlPage.summary}</p>
          </div>
        )}

        <a
          href={urlPage.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 md:p-4 bg-purple-100 border-2 border-black rounded hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm md:text-base text-purple-600 hover:underline break-all">{urlPage.url}</p>
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0" />
          </div>
        </a>
      </div>
    );
  }

  // Render YouTube video content
  if (lesson.youtubeVideo) {
    const { youtubeVideo } = lesson;
    return (
      <div className="bg-white rounded-lg shadow-2xl w-full p-4 md:p-8">
        <a
          href={youtubeVideo.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-2 border-black rounded overflow-hidden hover:shadow-lg transition-shadow"
        >
          {youtubeVideo.thumbnailUrl && (
            <img
              src={youtubeVideo.thumbnailUrl}
              alt={youtubeVideo.title || 'YouTube video'}
              className="w-full h-auto object-contain"
            />
          )}
          <div className="p-3 md:p-4 bg-red-100 space-y-2">
            <p className="font-medium text-base md:text-lg">{youtubeVideo.title}</p>
            {youtubeVideo.channelTitle && (
              <p className="text-sm text-gray-600">{youtubeVideo.channelTitle}</p>
            )}
            <div className="flex items-center gap-2 text-red-600">
              <span className="text-sm">Watch on YouTube</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </a>
      </div>
    );
  }

  // Render TikTok video content
  if (lesson.tiktokVideo) {
    const { tiktokVideo } = lesson;
    return (
      <div className="bg-white rounded-lg shadow-2xl w-full p-4 md:p-8">
        <a
          href={tiktokVideo.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-2 border-black rounded overflow-hidden hover:shadow-lg transition-shadow"
        >
          {tiktokVideo.thumbnailUrl && (
            <img
              src={tiktokVideo.thumbnailUrl}
              alt={tiktokVideo.title || 'TikTok video'}
              className="w-full h-auto object-contain"
            />
          )}
          <div className="p-3 md:p-4 bg-gray-100 space-y-2">
            <p className="font-medium text-base md:text-lg">{tiktokVideo.title}</p>
            {tiktokVideo.creator && (
              <p className="text-sm text-gray-600">{tiktokVideo.creator}</p>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-sm">Watch on TikTok</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </a>
      </div>
    );
  }

  // Fallback if no content
  return (
    <div className="bg-white rounded-lg shadow-2xl w-full p-4 md:p-8">
      <div className="p-3 md:p-4 bg-gray-100 border-2 border-black rounded">
        <p className="text-center text-gray-500">No content available</p>
      </div>
    </div>
  );
}
