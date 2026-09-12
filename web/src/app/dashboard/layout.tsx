'use client';

import { AuthProvider } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
