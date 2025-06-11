export interface IpcRendererEvent {
  sender: {
    id: number;
    send: (channel: string, ...args: unknown[]) => void;
  };
  senderId: number;
  ports: MessagePort[];
}

export interface ElectronAPI {
  sendPrintCommand: (command: PrintCommand) => void;
  onPrintResponse: (callback: (event: IpcRendererEvent, response: PrintResponse) => void) => void;
  onPrintJobUpdate: (callback: (event: IpcRendererEvent, payload: { new: PrintJob; old: PrintJob; eventType: string }) => void) => void;
  print: (options: {
    type: string;
    orderId: string;
    printerName: string;
    copies: number;
    paperSize: string;
    orientation: string;
  }) => Promise<void>;
  agentId?: string;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
} 