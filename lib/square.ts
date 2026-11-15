import "server-only";
import { SquareClient, SquareEnvironment } from 'square';
import { serverEnv } from '@lib/env.server';
import { ACTIVE_LOCATION_IDS } from '@const/locations';

export function createSquareClient() {
  const env = serverEnv();
  return new SquareClient({
    environment: env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
    token: env.SQUARE_ACCESS_TOKEN ?? '',
  });
}

/** Square location IDs used for inventory counts. */
export function squareLocationIds(): string[] {
  const configured = serverEnv().SQUARE_LOCATION_IDS;
  return configured ? configured.split(",").map((id) => id.trim()).filter(Boolean) : ACTIVE_LOCATION_IDS;
}
