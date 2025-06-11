import { useState } from 'react';

interface UploadResponse {
  success: boolean;
  error?: string;
}

interface UploadOptions {
  githubUrl: string;
}

export function useInstallerUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadInstaller = async (options: UploadOptions): Promise<UploadResponse> => {
    const { githubUrl } = options;
    setIsUploading(true);

    try {
      if (!githubUrl) {
        return { success: false, error: 'Please provide a GitHub release URL' };
      }

      // Extract version from URL
      const urlParts = githubUrl.split('/');
      const versionIndex = urlParts.findIndex(part => part === 'download') + 1;
      const version = urlParts[versionIndex];
      
      if (!version) {
        return { success: false, error: 'Invalid GitHub release URL format' };
      }

      const response = await fetch('/api/v1/installers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: githubUrl,
          name: `GitHub Release Tag: ${version}`,
          type: 'github_release'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to add installer' };
      }

      return { success: true };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Failed to add installer' };
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadInstaller, isUploading };
} 