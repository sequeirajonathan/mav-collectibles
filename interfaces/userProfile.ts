import { UserRole } from '@interfaces/roles';

export interface ClerkUser {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
  }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: number;
  lastSignInAt: number;
  publicMetadata: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  role?: string;
  createdAt: string;
  lastSignInAt?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}
