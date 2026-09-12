import Link from 'next/link';
import { Shield, Wrench } from 'lucide-react';
import { isMaintenanceMode } from '@/lib/settings';
import { redirect } from 'next/navigation';

export default async function MaintenancePage() {
  const maintenance = await isMaintenanceMode();
  if (!maintenance) redirect('/login');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden z-10">

      <div className="w-full max-w-md text-center">
        <div className="glass-strong rounded-2xl p-10 shadow-2xl gradient-border">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 text-yellow-400 mb-6 border border-yellow-500/20">
            <Wrench className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
          <p className="text-gray-400 text-sm mb-6">
            FZ AUTH is currently undergoing scheduled maintenance. We&apos;ll be back shortly.
          </p>

          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-6">
            <p className="text-xs text-yellow-400/80">
              All services are temporarily unavailable. Your data is safe.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>FZ AUTH — Secure Authentication Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
