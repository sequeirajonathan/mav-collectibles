export interface ElectronConnection {
  isConnected: boolean;
  port?: number;
}

export interface PrintCommand {
  type: "PRINT";
  orderId: string;
  settings: {
    printerName?: string;
    labelUrl?: string;
    silent?: boolean;
  };
}

export interface PrintResponse {
  success: boolean;
  message: string;
  error?: string;
}
