import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Image as ImageIcon, FileImage, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onUploadProgress: (progress: number) => void;
  onUploadComplete: (imageUrl: string, extractedText?: string) => void;
  onUploadError: (error: string) => void;
  onCancel: () => void;
  isUploading: boolean;
  isProcessing: boolean;
  uploadProgress: number;
}

interface UploadedImage {
  file: File;
  preview: string;
  status: 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onCancel,
  isUploading,
  isProcessing,
  uploadProgress
}) => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a JPG, PNG, WEBP, or GIF image';
    }
    if (file.size > MAX_SIZE) {
      return 'Image too large — choose under 5 MB';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateFile(file);

    if (validation) {
      toast({
        title: "Invalid File",
        description: validation,
        variant: "destructive",
      });
      return;
    }

    if (files.length > 1) {
      toast({
        title: "Multiple Files",
        description: "Only one image can be uploaded at a time. Using the first file.",
      });
    }

    const preview = URL.createObjectURL(file);
    setUploadedImage({
      file,
      preview,
      status: 'uploading'
    });

    onImageSelect(file);
  }, [validateFile, onImageSelect, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    onCancel();
  }, [uploadedImage, onCancel]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusText = (): string => {
    if (isProcessing) return 'Processing';
    if (isUploading) return 'Uploading';
    return 'Done';
  };

  const getStatusIcon = () => {
    if (uploadedImage?.status === 'error') return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (isProcessing || isUploading) return <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />;
    return <div className="w-2 h-2 rounded-full bg-success" />;
  };

  // Mobile camera/gallery support
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="w-full">
      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5 scale-105'
              : 'border-border hover:border-primary/50 hover:bg-muted/20'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple={false}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            aria-label="Upload image file"
            {...(isMobile && { capture: "environment" })}
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              {isMobile ? <Camera className="w-6 h-6 text-primary" /> : <ImageIcon className="w-6 h-6 text-primary" />}
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                {isMobile ? 'Take a photo or choose from gallery' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP, GIF up to 5MB
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-3 h-3 mr-1" />
                Browse
              </Button>
              
              {isMobile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = ALLOWED_TYPES.join(',');
                    input.capture = 'environment';
                    input.onchange = (event) => {
                      const target = event.target as HTMLInputElement;
                      handleFileSelect(target.files);
                    };
                    input.click();
                  }}
                >
                  <Camera className="w-3 h-3 mr-1" />
                  Camera
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <img
                src={uploadedImage.preview}
                alt="Upload preview"
                className="w-12 h-12 rounded-lg object-cover border border-border"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {uploadedImage.file.name}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                  aria-label="Cancel upload"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {formatFileSize(uploadedImage.file.size)}
              </p>
              
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className="text-xs text-muted-foreground">
                      {getStatusText()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              
              {uploadedImage.error && (
                <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{uploadedImage.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};