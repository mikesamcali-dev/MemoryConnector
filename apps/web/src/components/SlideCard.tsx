import { Slide } from '../api/slidedecks';
import { ExternalLink } from 'lucide-react';

interface SlideCardProps {
  slide: Slide;
}

export function SlideCard({ slide }: SlideCardProps) {
  const { memory } = slide;

  return (
    <div className="bg-white rounded-lg shadow-2xl w-full p-4 md:p-8 space-y-3 md:space-y-4">
      {/* 1. Memory body - full width */}
      {memory.body && (
        <div className="p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
          <p className="text-base md:text-xl text-center font-medium">{memory.body}</p>
        </div>
      )}

      {/* 2. Word (left) | Description (right) */}
      {memory.wordLinks && memory.wordLinks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="md:col-span-1 p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
            <p className="font-bold text-base md:text-lg">{memory.wordLinks[0].word.word}</p>
          </div>
          <div className="md:col-span-2 p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
            <p className="text-sm md:text-base">{memory.wordLinks[0].word.description || 'No description available'}</p>
          </div>
        </div>
      )}

      {/* 3. Image - full width */}
      {memory.imageLinks && memory.imageLinks.length > 0 && (
        <div className="border-2 border-black rounded overflow-hidden">
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

      {/* 4. URL Page title - full width */}
      {memory.urlPageLinks &&
        memory.urlPageLinks.length > 0 &&
        memory.urlPageLinks[0].urlPage.title && (
          <div className="p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
            <p className="text-base md:text-lg font-medium">{memory.urlPageLinks[0].urlPage.title}</p>
          </div>
        )}

      {/* 5. URL Page summary - full width */}
      {memory.urlPageLinks &&
        memory.urlPageLinks.length > 0 &&
        memory.urlPageLinks[0].urlPage.summary && (
          <div className="p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
            <p className="text-sm md:text-base">{memory.urlPageLinks[0].urlPage.summary}</p>
          </div>
        )}

      {/* 6. YouTube video - clickable with thumbnail */}
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

      {/* 7. TikTok video - clickable with thumbnail */}
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
              className="w-full aspect-[9/16] max-h-96 object-cover mx-auto"
            />
          )}
          <div className="p-3 md:p-4 bg-pink-100 flex items-center justify-between gap-2">
            <p className="font-medium text-sm md:text-base flex-1">{memory.tiktokVideo.title}</p>
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-pink-600 flex-shrink-0" />
          </div>
        </a>
      )}

      {/* 8. Location name (left) | Address (right) */}
      {memory.location && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="md:col-span-1 p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
            <p className="font-bold text-base md:text-lg">{memory.location.name}</p>
          </div>
          <div className="md:col-span-2 p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
            <p className="text-sm md:text-base">{memory.location.address || 'No address available'}</p>
          </div>
        </div>
      )}

      {/* 9. Person display name - full width */}
      {memory.person && (
        <div className="p-3 md:p-4 bg-blue-100 border-2 border-black rounded">
          <p className="font-medium text-center text-sm md:text-base">{memory.person.displayName}</p>
        </div>
      )}

      {/* Empty state if no data */}
      {!memory.body &&
        (!memory.wordLinks || memory.wordLinks.length === 0) &&
        (!memory.imageLinks || memory.imageLinks.length === 0) &&
        (!memory.urlPageLinks || memory.urlPageLinks.length === 0) &&
        !memory.youtubeVideo &&
        !memory.tiktokVideo &&
        !memory.location &&
        !memory.person && (
          <div className="p-8 text-center text-gray-500">
            <p>No data available for this memory</p>
          </div>
        )}
    </div>
  );
}
