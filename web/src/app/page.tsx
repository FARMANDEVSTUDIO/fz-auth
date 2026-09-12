'use client';

import { AuthProvider } from '@/lib/auth';
import LoginPage from '@/components/LoginPage';

export default function Home() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
