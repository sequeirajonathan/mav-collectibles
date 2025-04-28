import { SquareClient, SquareEnvironment } from 'square';

export function createSquareClient() {
  return new SquareClient({
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
    token: process.env.SQUARE_ACCESS_TOKEN || '',
  });
} 