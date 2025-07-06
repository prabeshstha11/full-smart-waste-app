import { useUser } from '@clerk/clerk-expo';
import { getUserById, updateUserRole, upsertUser, User } from './database';

// Service to handle user operations
export class UserService {
  // Sync Clerk user to database
  static async syncUserToDatabase(clerkUser: any): Promise<User> {
    try {
      const userData = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        first_name: clerkUser.firstName || clerkUser.unsafeMetadata?.firstName || '',
        last_name: clerkUser.lastName || clerkUser.unsafeMetadata?.lastName || '',
        role: clerkUser.unsafeMetadata?.role || 'customer',
      };

      console.log('Syncing user to database:', userData);
      const user = await upsertUser(userData);
      console.log('User synced successfully:', user);
      return user;
    } catch (error) {
      console.error('Error syncing user to database:', error);
      throw error;
    }
  }

  // Update user role in database
  static async updateUserRoleInDatabase(userId: string, role: string): Promise<User> {
    try {
      console.log('Updating user role in database:', { userId, role });
      const user = await updateUserRole(userId, role);
      console.log('User role updated successfully:', user);
      return user;
    } catch (error) {
      console.error('Error updating user role in database:', error);
      throw error;
    }
  }

  // Get user from database
  static async getUserFromDatabase(userId: string): Promise<User | null> {
    try {
      console.log('Getting user from database:', userId);
      const user = await getUserById(userId);
      console.log('User retrieved from database:', user);
      return user;
    } catch (error) {
      console.error('Error getting user from database:', error);
      throw error;
    }
  }
}

// Hook to sync current user to database
export function useSyncUserToDatabase() {
  const { user, isLoaded } = useUser();

  const syncUser = async () => {
    if (isLoaded && user) {
      try {
        await UserService.syncUserToDatabase(user);
        return true;
      } catch (error) {
        console.error('Error syncing user:', error);
        return false;
      }
    }
    return false;
  };

  return { syncUser, user, isLoaded };
} 