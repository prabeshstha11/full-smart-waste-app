import { useAuth, useUser } from '@clerk/clerk-expo';

// Function to get current user ID
export const getCurrentUserId = () => {
  const { user } = useUser();
  return user?.id;
};

// Function to get current user data for database
export const getCurrentUserData = () => {
  const { user } = useUser();
  
  if (!user) return null;
  
  return {
    clerkUserId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.unsafeMetadata?.role || 'user',
  };
};

// Function to get session data
export const getSessionData = () => {
  const { sessionId } = useAuth();
  return sessionId;
};

// Function to log user data for database storage
export const logUserForDatabase = () => {
  const userData = getCurrentUserData();
  const sessionId = getSessionData();
  
  console.log('=== USER DATA FOR DATABASE ===');
  console.log('Clerk User ID:', userData?.clerkUserId);
  console.log('Session ID:', sessionId);
  console.log('Email:', userData?.email);
  console.log('Name:', userData?.fullName);
  console.log('Role:', userData?.role);
  console.log('Created At:', userData?.createdAt);
  console.log('================================');
  
  return {
    userData,
    sessionId,
  };
};

// Function to check if user is authenticated
export const isUserAuthenticated = () => {
  const { isSignedIn } = useAuth();
  return isSignedIn;
};

// Function to get user role
export const getUserRole = () => {
  const { user } = useUser();
  return user?.unsafeMetadata?.role || 'user';
}; 