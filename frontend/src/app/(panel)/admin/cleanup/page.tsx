import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import { getPageData } from '@/lib/page-data';
import { isMasterAdmin } from '@/lib/plans';
import { getAutoCleanupSettings } from './actions';
import CleanupClient from './CleanupClient';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CleanupPage() {
  const { owner, apps, selected } = await getPageData();

  if (!isMasterAdmin(owner.email)) redirect('/dashboard');

  const autoSettings = await getAutoCleanupSettings();

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Admin / Cleanup" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-accent" /> <span className="font-display">Database Cleanup</span>
            </h2>
            <p className="text-xs text-gray-500">Remove expired sessions, old logs, and stale data</p>
          </div>
        </div>

        <MotionCard delay={0} className="glass rounded-xl">
          <CleanupClient autoSettings={autoSettings} />
        </MotionCard>
      </main>
    </>
  );
}
