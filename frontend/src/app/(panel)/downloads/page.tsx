import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import LockedFeature from '@/components/LockedFeature';
import CopyButton from '@/components/CopyButton';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan } from '@/lib/plans';
import { Download, Code2, Copy } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SDKS = [
  {
    lang: 'Python',
    color: 'text-yellow-400 bg-yellow-500/10',
    install: 'pip install fzauth',
    example: `import fzauth

client = fzauth.Client(
    app_id="YOUR_APP_ID",
    secret="YOUR_SECRET"
)

# Login
result = client.login("username", "password", hwid="optional")
if result.success:
    print(f"Welcome! Expires: {result.expiry}")`,
  },
  {
    lang: 'C#',
    color: 'text-green-400 bg-green-500/10',
    install: 'dotnet add package FZAuth',
    example: `using FZAuth;

var client = new FZAuthClient("YOUR_APP_ID", "YOUR_SECRET");

// Login
var result = await client.LoginAsync("username", "password");
if (result.Success)
    Console.WriteLine($"Welcome! Expires: {result.Expiry}");`,
  },
  {
    lang: 'C++',
    color: 'text-accent bg-accent/10',
    install: '#include "fzauth.h"',
    example: `#include "fzauth.h"

FZAuth::Client client("YOUR_APP_ID", "YOUR_SECRET");

// Login
auto result = client.Login("username", "password");
if (result.success)
    std::cout << "Welcome! Expires: " << result.expiry;`,
  },
  {
    lang: 'JavaScript / Node.js',
    color: 'text-emerald-400 bg-emerald-500/10',
    install: 'npm install fzauth',
    example: `const FZAuth = require('fzauth');

const client = new FZAuth({
    appId: 'YOUR_APP_ID',
    secret: 'YOUR_SECRET'
});

// Login
const result = await client.login('username', 'password');
if (result.success)
    console.log(\`Welcome! Expires: \${result.expiry}\`);`,
  },
];

export default async function DownloadsPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);

  if (plan === 'free') {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Downloads" />
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <LockedFeature feature="SDK Downloads" />
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Downloads" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <MotionCard delay={0} className="glass rounded-xl">
          <div className="px-5 py-4 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-accent" /> SDK Downloads & Examples
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Integrate FZ AUTH into your application using one of our SDKs.
              {selected && ` Replace YOUR_APP_ID with your app ID and YOUR_SECRET with your app secret.`}
            </p>
          </div>
        </MotionCard>

        {SDKS.map((sdk, i) => (
          <MotionCard key={sdk.lang} delay={0.1 * (i + 1)} className="glass rounded-xl">
            <div className="px-5 py-4 section-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-accent" />
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sdk.color}`}>{sdk.lang}</span>
              </h3>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-400 bg-bg px-2 py-1 rounded">{sdk.install}</code>
                <CopyButton value={sdk.install} />
              </div>
            </div>
            <div className="p-5">
              <div className="relative">
                <pre className="bg-bg rounded-xl p-4 text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed">
                  {selected
                    ? sdk.example.replace(/YOUR_APP_ID/g, selected.id).replace(/YOUR_SECRET/g, selected.secret)
                    : sdk.example}
                </pre>
                <div className="absolute top-2 end-2">
                  <CopyButton
                    value={selected
                      ? sdk.example.replace(/YOUR_APP_ID/g, selected.id).replace(/YOUR_SECRET/g, selected.secret)
                      : sdk.example}
                  />
                </div>
              </div>
            </div>
          </MotionCard>
        ))}
      </main>
    </>
  );
}
