import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function getServerUser(req?: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    // Get the Authorization header
    const authHeader = req?.headers?.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    if (!idToken) {
      return null;
    }

    // Verify the Firebase ID token
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || undefined,
    };
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return null;
  }
}
