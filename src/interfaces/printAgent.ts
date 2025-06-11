export interface PrintCommand {
  type: 'PRINT';
  orderId: string;
}

export interface PrintResponse {
  success: boolean;
  message: string;
  error?: string;
} 