import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ArrowLeft, Upload, Loader, Image as ImageIcon, MapPin, Calendar, Tag, FolderKanban } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { uploadImage, getUserImages } from '../api/images';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ImageLinkProjectModal } from '../components/ImageLinkProjectModal';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function ImageBuilderPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null);
  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);

  // Fetch user images
  const { data: images, isLoading: loadingImages, refetch } = useQuery({
    queryKey: ['user-images'],
    queryFn: () => getUserImages(0, 50),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const imageData = await base64Promise;

      // Upload image with AI metadata extraction
      const result = await uploadImage({
        imageData,
        contentType: selectedFile.type,
        filename: selectedFile.name,
      });

      setExtractedMetadata(result);
      setSuccess(`Image uploaded successfully! ${result.isDuplicate ? '(Duplicate detected - using existing image)' : ''}`);

      // Clear form
      setSelectedFile(null);
      setPreview(null);

      // Reset file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refetch images list
      refetch();

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
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
        <h1 className="text-3xl font-bold text-gray-900">Image Builder</h1>
        <p className="text-gray-600 mt-2">
          Upload images and let AI extract metadata automatically
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload Image
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

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-60 max-w-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WebP, HEIC (max 50MB)
                  </p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload & Extract Metadata
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Metadata Display */}
      {extractedMetadata && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-600" />
            Extracted Metadata
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Preview */}
            <div className="col-span-full">
              <img
                src={extractedMetadata.storageUrl}
                alt="Uploaded"
                className="max-h-96 max-w-full object-contain rounded-lg border border-gray-200"
              />
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Basic Information</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Content Type:</span> {extractedMetadata.contentType}</p>
                <p><span className="font-medium">Size:</span> {(extractedMetadata.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                {extractedMetadata.width && extractedMetadata.height && (
                  <p><span className="font-medium">Dimensions:</span> {extractedMetadata.width} x {extractedMetadata.height}</p>
                )}
              </div>
            </div>

            {/* AI Extracted Data */}
            {extractedMetadata.aiMetadata && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">AI Extracted Data</h3>
                <div className="text-sm space-y-1">
                  {extractedMetadata.aiMetadata.description && (
                    <p><span className="font-medium">Description:</span> {extractedMetadata.aiMetadata.description}</p>
                  )}
                  {extractedMetadata.aiMetadata.tags && extractedMetadata.aiMetadata.tags.length > 0 && (
                    <div>
                      <span className="font-medium">Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {extractedMetadata.aiMetadata.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {extractedMetadata.aiMetadata.detectedObjects && extractedMetadata.aiMetadata.detectedObjects.length > 0 && (
                    <div>
                      <span className="font-medium">Detected Objects:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {extractedMetadata.aiMetadata.detectedObjects.map((obj: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Data */}
            {(extractedMetadata.latitude || extractedMetadata.longitude) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Latitude:</span> {extractedMetadata.latitude}</p>
                  <p><span className="font-medium">Longitude:</span> {extractedMetadata.longitude}</p>
                  {extractedMetadata.locationSource && (
                    <p><span className="font-medium">Source:</span> {extractedMetadata.locationSource}</p>
                  )}
                </div>
              </div>
            )}

            {/* Capture Date */}
            {extractedMetadata.capturedAt && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Captured
                </h3>
                <p className="text-sm">
                  {new Date(extractedMetadata.capturedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* EXIF Data */}
            {extractedMetadata.exifData && (
              <div className="col-span-full space-y-2">
                <h3 className="font-semibold text-gray-700">EXIF Data</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 overflow-auto">
                    {JSON.stringify(extractedMetadata.exifData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="col-span-full flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(`/app/capture?imageId=${extractedMetadata.id}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Memory with this Image
              </button>
              <button
                onClick={() => setIsLinkProjectModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FolderKanban className="h-4 w-4" />
                Link to Topic
              </button>
              <button
                onClick={() => {
                  setExtractedMetadata(null);
                  setSuccess('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Upload Another Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Your Images ({images?.length || 0})
        </h2>

        {loadingImages ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.thumbnailUrl256 || image.storageUrl}
                  alt={`Image from ${image.capturedAt ? new Date(image.capturedAt).toLocaleDateString() : 'Unknown date'}`}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setExtractedMetadata(image);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.capturedAt
                    ? new Date(image.capturedAt).toLocaleDateString()
                    : new Date(image.createdAt).toLocaleDateString()}
                </div>
                {/* Memory count badge */}
                {image.memoryLinks && image.memoryLinks.length > 0 && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                    {image.memoryLinks.length} {image.memoryLinks.length === 1 ? 'memory' : 'memories'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No images uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload your first image to get started</p>
          </div>
        )}
      </div>

      {/* Link to Project Modal */}
      {extractedMetadata && (
        <ImageLinkProjectModal
          imageUrl={extractedMetadata.storageUrl}
          isOpen={isLinkProjectModalOpen}
          onClose={() => setIsLinkProjectModalOpen(false)}
        />
      )}
      {/* Help Popup */}
      <HelpPopup
        pageKey="images"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}