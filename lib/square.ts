import "server-only";
import { SquareClient, SquareEnvironment } from 'square';
import { serverEnv } from '@lib/env.server';

export function createSquareClient() {
  const env = serverEnv();
  return new SquareClient({
    environment: env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
    token: env.SQUARE_ACCESS_TOKEN,
  });
}
