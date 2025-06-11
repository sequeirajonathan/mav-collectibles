import { useState } from 'react';
import { useResource } from '@lib/swr';

interface Installer {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface InstallerRequest {
  url: string;
  name: string;
  type: string;
}

interface UploadOptions {
  githubUrl: string;
}

export function useInstallerUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { create } = useResource<Installer, InstallerRequest>('installers');

  const uploadInstaller = async (options: UploadOptions): Promise<Installer> => {
    const { githubUrl } = options;
    setIsUploading(true);

    try {
      if (!githubUrl) {
        throw new Error('Please provide a GitHub release URL');
      }

      // Extract version from URL
      const urlParts = githubUrl.split('/');
      const versionIndex = urlParts.findIndex(part => part === 'download') + 1;
      const version = urlParts[versionIndex];
      
      if (!version) {
        throw new Error('Invalid GitHub release URL format');
      }

      const data = await create({
        url: githubUrl,
        name: `GitHub Release Tag: ${version}`,
        type: 'github_release'
      });

      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadInstaller, isUploading };
} 