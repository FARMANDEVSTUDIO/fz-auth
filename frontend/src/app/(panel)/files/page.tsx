import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import LockedFeature from '@/components/LockedFeature';
import CopyButton from '@/components/CopyButton';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan } from '@/lib/plans';
import { query } from '@/lib/db';
import { addFile, deleteFile } from './actions';
import { FolderOpen, Plus, Trash2, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FilesPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);

  if (plan === 'free') {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Files" />
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <LockedFeature feature="File Hosting" />
        </main>
      </>
    );
  }

  let files: Array<{ id: string; filename: string; url: string | null; size_bytes: number; created_at: string }> = [];

  if (selected) {
    const r = await query(
      `SELECT id, filename, url, size_bytes, created_at FROM app_files WHERE app_id=$1 ORDER BY filename ASC`,
      [selected.id]
    );
    files = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Files" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!selected ? (
          <MotionCard className="glass rounded-xl p-10 text-center text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-accent/50" />
            </div>
            Select an application first.
          </MotionCard>
        ) : (
          <>
            <MotionCard delay={0} className="glass rounded-xl gradient-border">
              <div className="px-5 py-4 border-b border-edge/50 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" /> Add File
                </h3>
                <p className="text-xs text-gray-500 mt-1">Add files your application can download at runtime. Provide a hosted URL.</p>
              </div>
              <form action={addFile} className="p-5 flex flex-wrap gap-3 items-end">
                <input type="hidden" name="app_id" value={selected.id} />
                <div className="min-w-[200px] flex-1">
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Filename</label>
                  <input type="text" name="filename" required placeholder="config.json" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono input-enhanced" />
                </div>
                <div className="min-w-[300px] flex-[2]">
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />URL</label>
                  <input type="url" name="url" placeholder="https://example.com/file.json" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>
            </MotionCard>

            <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-edge/50 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-accent" /> Files
                  <span className="text-gray-500 font-normal">({files.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table-enhanced">
                  <thead>
                    <tr className="border-b border-edge/50 bg-white/[0.02]">
                      {['Filename', 'URL', 'Added', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {files.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                          <FolderOpen className="w-7 h-7 text-accent/50" />
                        </div>
                        <p className="text-sm text-gray-500">No files yet</p>
                      </td></tr>
                    ) : files.map(f => (
                      <tr key={f.id} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-accent font-mono text-xs font-semibold">{f.filename}</td>
                        <td className="px-4 py-3 text-xs max-w-[350px]">
                          {f.url ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 truncate">{f.url}</span>
                              <CopyButton value={f.url} />
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent2">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">No URL</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(f.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <form action={deleteFile}>
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="file_id" value={f.id} />
                            <button type="submit" className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MotionCard>
          </>
        )}
      </main>
    </>
  );
}
