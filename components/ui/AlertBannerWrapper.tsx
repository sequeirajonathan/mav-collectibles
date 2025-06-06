'use client';

import { useAlertBanner } from '@hooks/useAlertBanner';
import AlertBanner from './AlertBanner';

export default function AlertBannerWrapper() {
  const { alertBanner } = useAlertBanner();
  
  return <AlertBanner initialData={alertBanner} />;
} 