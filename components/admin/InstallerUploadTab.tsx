'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import UploadForm from '@app/installer-upload/upload-form';

export default function InstallerUploadTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Installer</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm />
        </CardContent>
      </Card>
    </div>
  );
} 