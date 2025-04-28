// services/userProfileService.ts
import { UserProfile } from "@interfaces";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/user-profile");

    if (!response.ok) {
      console.error("Failed to fetch user profile");
      return null;
    }

    const profile: UserProfile = await response.json();
    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
