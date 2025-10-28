// src/app/(auth)/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';

const AuthLayout = () => {
  return (
    <Stack>
      {}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      
      {}
    </Stack>
  );
};

export default AuthLayout;