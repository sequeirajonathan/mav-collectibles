import { PrintCommand, PrintResponse } from './printAgent';
import type { PrintJob } from '@lib/contracts/print-jobs';

interface IpcRendererEvent {
  sender: {
    id: number;
    send: (channel: string, ...args: unknown[]) => void;
  };
  senderId: number;
  ports: MessagePort[];
}

interface ElectronAPI {
  sendPrintCommand: (command: PrintCommand) => void;
  onPrintResponse: (callback: (event: IpcRendererEvent, response: PrintResponse) => void) => void;
  onPrintJobUpdate: (callback: (event: IpcRendererEvent, payload: { new: PrintJob; old: PrintJob; eventType: string }) => void) => void;
  onSignOut: (callback: () => void) => void;
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
  print: (options: {
    printerName: string;
    labelUrl: string;
    silent?: boolean;
  }) => void;
  agentId?: string;
  /**
   * Hands the signed-in print agent's short-lived access token to the desktop
   * app (re-sent on every refresh; null on sign-out). The desktop app stores no
   * credentials of its own. Optional: older agents don't expose it.
   */
  setAuthSession?: (
    session: {
      accessToken: string;
      expiresAt: number;
      userId: string;
      /** Public values: lets the agent reach this environment's Supabase project. */
      supabaseUrl: string;
      supabasePublishableKey: string;
    } | null
  ) => void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
} 