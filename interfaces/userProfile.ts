import { UserRole } from './roles';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastSignInAt?: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  source?: string;
}
