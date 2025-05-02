// services/userProfileService.ts
import { UserProfile } from "@interfaces";
import { axiosClient } from "@lib/axios";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const { data } = await axiosClient.get("/api/user-profile");
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
