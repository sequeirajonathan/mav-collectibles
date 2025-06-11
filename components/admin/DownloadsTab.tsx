'use client';

import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Loader2, Download, Trash2 } from 'lucide-react';
import { useInstallers } from '@hooks/useInstallers';

export default function DownloadsTab() {
  const { installers, isLoading, deleteInstaller } = useInstallers();

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'Date not available';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6B325]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Installer Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          {installers.length === 0 ? (
            <p className="text-gray-500">No installers available</p>
          ) : (
            <div className="space-y-4">
              {installers.map((installer) => (
                <div
                  key={installer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{installer.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(installer.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(installer.url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteInstaller(installer.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 