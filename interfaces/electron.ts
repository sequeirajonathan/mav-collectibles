import { PrintCommand, PrintResponse } from './printAgent';
import { PrintJob } from './printJob';

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
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
} 