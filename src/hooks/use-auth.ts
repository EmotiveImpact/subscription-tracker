"use client"

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return {
    user,
    isLoaded,
    isSignedIn,
    logout,
    userId: user?.id,
    email: user?.primaryEmailAddress?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
    fullName: user?.fullName,
  };
}
