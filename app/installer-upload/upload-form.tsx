'use client';

import { useState } from 'react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { useInstallerUpload } from '@hooks/useInstallerUpload';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

export default function UploadForm() {
  const [githubUrl, setGithubUrl] = useState('');
  const { uploadInstaller, isUploading } = useInstallerUpload();

  const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubUrl(e.target.value);
  };

  const clearGithubUrl = () => {
    setGithubUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubUrl) {
      toast.error('Please provide a GitHub release URL');
      return;
    }

    try {
      const result = await uploadInstaller({
        githubUrl,
      });

      if (result.success) {
        toast.success('Installer added successfully');
        // Reset form
        setGithubUrl('');
      } else {
        toast.error(result.error || 'Failed to add installer');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to add installer');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub Release URL</Label>
          <div className="flex items-center gap-2">
            <Input
              id="githubUrl"
              type="text"
              value={githubUrl}
              onChange={handleGithubUrlChange}
              placeholder="Enter GitHub release URL (e.g., https://github.com/sequeirajonathan/mav-print/releases/download/1.0.0/MAV.Print.Agent.Setup.1.0.0.exe)"
              disabled={isUploading}
            />
            {githubUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearGithubUrl}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!githubUrl || isUploading}
        className="w-full bg-[#E6B325] hover:bg-[#E6B325]/90 text-black font-medium"
      >
        {isUploading ? 'Adding...' : 'Add Installer'}
      </Button>
    </form>
  );
} 