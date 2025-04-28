import DebugInfo from '@components/admin/DebugInfo';
import AdminSettingsUpdater from '@components/admin/AdminSettingsUpdater';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <DebugInfo />
      <AdminSettingsUpdater />
    </>
  );
} 