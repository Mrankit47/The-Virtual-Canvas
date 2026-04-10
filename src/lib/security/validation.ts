import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export async function validateOrderOwnership(order: any) {
  const session: any = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Authentication required");
  }

  const userEmail = session.user.email;
  const userRole = session.user.role;

  // Admin has full access
  if (userRole === "admin") {
    return true;
  }

  // Check if user is the owner or the assigned artist
  if (userEmail === order.userEmail || userEmail === order.artistEmail) {
    return true;
  }

  throw new Error("Unauthorized access to this order");
}
