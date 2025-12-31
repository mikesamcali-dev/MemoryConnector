import { Slide } from '../api/slidedecks';

interface SlideCardProps {
  slide: Slide;
}

export function SlideCard({ slide }: SlideCardProps) {
  const { memory } = slide;

  return (
    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-8 space-y-4">
      {/* 1. Memory body - full width */}
      {memory.body && (
        <div className="p-4 bg-blue-100 border-2 border-black rounded">
          <p className="text-xl text-center font-medium">{memory.body}</p>
        </div>
      )}

      {/* 2. Word (left) | Description (right) */}
      {memory.wordLinks && memory.wordLinks.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 p-4 bg-blue-100 border-2 border-black rounded">
            <p className="font-bold text-lg">{memory.wordLinks[0].word.word}</p>
          </div>
          <div className="col-span-2 p-4 bg-blue-100 border-2 border-black rounded">
            <p>{memory.wordLinks[0].word.description || 'No description available'}</p>
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
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* 4. URL Page title - full width */}
      {memory.urlPageLinks &&
        memory.urlPageLinks.length > 0 &&
        memory.urlPageLinks[0].urlPage.title && (
          <div className="p-4 bg-blue-100 border-2 border-black rounded">
            <p className="text-lg font-medium">{memory.urlPageLinks[0].urlPage.title}</p>
          </div>
        )}

      {/* 5. URL Page summary - full width */}
      {memory.urlPageLinks &&
        memory.urlPageLinks.length > 0 &&
        memory.urlPageLinks[0].urlPage.summary && (
          <div className="p-4 bg-blue-100 border-2 border-black rounded">
            <p>{memory.urlPageLinks[0].urlPage.summary}</p>
          </div>
        )}

      {/* 6. YouTube title - full width */}
      {memory.youtubeVideo && (
        <div className="p-4 bg-blue-100 border-2 border-black rounded">
          <p className="font-medium">{memory.youtubeVideo.title}</p>
        </div>
      )}

      {/* 7. TikTok title - full width */}
      {memory.tiktokVideo && (
        <div className="p-4 bg-blue-100 border-2 border-black rounded">
          <p className="font-medium">{memory.tiktokVideo.title}</p>
        </div>
      )}

      {/* 8. Location name (left) | Address (right) */}
      {memory.location && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 p-4 bg-blue-100 border-2 border-black rounded">
            <p className="font-bold text-lg">{memory.location.name}</p>
          </div>
          <div className="col-span-2 p-4 bg-blue-100 border-2 border-black rounded">
            <p>{memory.location.address || 'No address available'}</p>
          </div>
        </div>
      )}

      {/* 9. Person display name - full width */}
      {memory.person && (
        <div className="p-4 bg-blue-100 border-2 border-black rounded">
          <p className="font-medium text-center">{memory.person.displayName}</p>
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
