'use client';

import { useState, useRef, useEffect } from 'react';
import { CldUploadWidget } from 'next-cloudinary';

interface MessageInputProps {
  onSendMessage: (data: {
    text?: string;
    media?: string;
    mediaType?: string;
    fileName?: string;
  }) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;

    onSendMessage({
      text: text.trim(),
    });

    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ||
    'school_management';

  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('Cloudinary config:', {
        uploadPreset,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleMediaUpload = (result: any) => {
    const resource = result.info;
    if (resource && resource.secure_url) {
      // Buffer the uploaded media so user can confirm (click Done) before sending
      setUploading(false);
      setUploadedMedia({
        url: resource.secure_url,
        mediaType: resource.resource_type === 'video' ? 'video/mp4' : `image/${resource.format}`,
        fileName: resource.original_filename || resource.public_id,
      });
    }
  };

  const [uploadedMedia, setUploadedMedia] = useState<null | { url: string; mediaType: string; fileName?: string }>(null);

  const handleConfirmUpload = () => {
    if (!uploadedMedia) return;
    onSendMessage({
      media: uploadedMedia.url,
      mediaType: uploadedMedia.mediaType,
      fileName: uploadedMedia.fileName,
      text: text.trim() || undefined,
    });
    setUploadedMedia(null);
    setText('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleCancelUpload = () => {
    setUploadedMedia(null);
  };

  return (
    <div className="flex gap-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Đang chờ kết nối...' : 'Nhập tin nhắn...'}
        disabled={disabled}
        rows={3}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />

      <div className="flex flex-col gap-2">
        {/* Upload Media Button or Preview */}
        {uploadedMedia ? (
          <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 rounded">
            {uploadedMedia.mediaType.startsWith('image') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={uploadedMedia.url} alt={uploadedMedia.fileName || 'preview'} className="max-w-xs rounded" style={{ maxHeight: '160px', objectFit: 'cover' }} />
            ) : (
              <video src={uploadedMedia.url} controls className="max-w-xs rounded" style={{ maxHeight: '160px' }} />
            )}
            <div className="flex gap-2">
              <button onClick={handleConfirmUpload} className="px-3 py-1 bg-green-600 text-white rounded">Xong</button>
              <button onClick={handleCancelUpload} className="px-3 py-1 bg-gray-200 rounded">Hủy</button>
            </div>
          </div>
        ) : (
          <CldUploadWidget uploadPreset={uploadPreset} onSuccess={(res) => { setUploading(true); handleMediaUpload(res); }} onError={(error) => { setUploading(false); console.error('Upload error:', JSON.stringify(error), error); }}>
            {({ open }) => (
              <button
                onClick={() => open()}
                disabled={disabled || uploading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm transition disabled:opacity-50"
                title="Tải tệp đa phương tiện"
              >
                📎
              </button>
            )}
          </CldUploadWidget>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !uploadedMedia)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
