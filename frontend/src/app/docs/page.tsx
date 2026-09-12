import Link from 'next/link';
import { Shield, ArrowLeft, Code, Key, Users, Radio, Variable, CheckCircle, Zap, BarChart3, Ticket, Info } from 'lucide-react';

const BASE_URL = 'https://your-domain.com';

const endpoints = [
  {
    method: 'POST',
    path: '/api/v1/init',
    title: 'Initialize Application',
    description: 'Initialize a session with your application. Returns app info and session token.',
    body: { app_id: 'uuid', secret: 'string' },
    response: { success: true, message: 'App initialized', app_name: 'My App', token: 'session-token', version: '1.0' },
    icon: CheckCircle,
  },
  {
    method: 'POST',
    path: '/api/v1/register',
    title: 'Register User',
    description: 'Register a new user with a license key. The key is consumed on successful registration.',
    body: { app_id: 'uuid', secret: 'string', username: 'string', password: 'string', license_key: 'string', hwid: 'string (optional)' },
    response: { success: true, message: 'Registered successfully', token: 'session-token', username: 'user1', expiry: '2025-12-31T00:00:00Z', level: 1 },
    icon: Users,
  },
  {
    method: 'POST',
    path: '/api/v1/login',
    title: 'Login User',
    description: 'Authenticate a user with username and password. Returns a session token.',
    body: { app_id: 'uuid', secret: 'string', username: 'string', password: 'string', hwid: 'string (optional)' },
    response: { success: true, message: 'Logged in successfully', token: 'session-token', username: 'user1', expiry: '2025-12-31T00:00:00Z', level: 1 },
    icon: Key,
  },
  {
    method: 'POST',
    path: '/api/v1/license',
    title: 'License Authentication',
    description: 'Authenticate directly with a license key (no username/password). The key is activated on first use.',
    body: { app_id: 'uuid', secret: 'string', license_key: 'string', hwid: 'string (optional)' },
    response: { success: true, message: 'License authenticated', token: 'session-token', license_key: 'XXXX...', level: 1, expiry: '2025-12-31T00:00:00Z' },
    icon: Radio,
  },
  {
    method: 'POST',
    path: '/api/v1/check',
    title: 'Check Session',
    description: 'Verify if a session token is still valid.',
    body: { app_id: 'uuid', secret: 'string', token: 'string' },
    response: { success: true, message: 'Session valid', username: 'user1', expiry: '2025-12-31T00:00:00Z', level: 1 },
    icon: CheckCircle,
  },
  {
    method: 'POST',
    path: '/api/v1/var',
    title: 'Get Variable',
    description: 'Retrieve a server-side variable by name. Requires a valid session token.',
    body: { app_id: 'uuid', secret: 'string', token: 'string', name: 'string' },
    response: { success: true, value: 'variable-value' },
    icon: Variable,
  },
];

const v2Endpoints = [
  {
    method: 'GET',
    path: '/api/v2/app-info',
    title: 'App Info',
    description: 'Get application details including branding, user counts, and license stats.',
    auth: 'Query params: ?app_id=uuid&secret=string  OR Headers: X-App-Id, X-App-Secret',
    response: { success: true, data: { app_id: 'uuid', name: 'My App', version: '1.0', status: 'active', branding: { app_name: 'My App', accent_color: '#8b5cf6' }, stats: { user_count: 42, license_count: 100 } }, meta: { api_version: '2.0', timestamp: '2025-01-01T00:00:00Z', request_id: 'uuid' } },
    icon: Info,
  },
  {
    method: 'GET',
    path: '/api/v2/users',
    title: 'List Users',
    description: 'List users with pagination. Supports ?page=1&limit=20&search=query.',
    auth: 'Headers: X-App-Id, X-App-Secret',
    response: { success: true, data: [{ id: 'uuid', username: 'user1', expiry: '2025-12-31' }], pagination: { page: 1, limit: 20, total: 42, has_next: true } },
    icon: Users,
  },
  {
    method: 'POST',
    path: '/api/v2/users',
    title: 'Create User',
    description: 'Register a new user via API. Requires a valid license key.',
    auth: 'Headers: X-App-Id, X-App-Secret',
    body: { username: 'string', password: 'string', license_key: 'string', hwid: 'string (optional)' },
    response: { success: true, data: { user_id: 'uuid', username: 'user1', token: 'session-token', expiry: '2025-12-31' } },
    icon: Users,
  },
  {
    method: 'GET',
    path: '/api/v2/users/{username}',
    title: 'Get User',
    description: 'Get detailed information about a specific user.',
    auth: 'Headers: X-App-Id, X-App-Secret',
    response: { success: true, data: { id: 'uuid', username: 'user1', hwid: 'ABC123', expiry: '2025-12-31', active_sessions: 2 } },
    icon: Key,
  },
  {
    method: 'PATCH',
    path: '/api/v2/users/{username}',
    title: 'Update User',
    description: 'Update user: ban/unban, suspend, add time, reset HWID, set expiry.',
    auth: 'Headers: X-App-Id, X-App-Secret',
    body: { banned: 'boolean', ban_reason: 'string', suspended: 'boolean', add_time: 'number (seconds)', reset_hwid: 'boolean', expiry: 'ISO date' },
    response: { success: true, data: { id: 'uuid', username: 'user1', banned: false } },
    icon: Zap,
  },
  {
    method: 'DELETE',
    path: '/api/v2/users/{username}',
    title: 'Delete User',
    description: 'Permanently delete a user and all their sessions.',
    auth: 'Headers: X-App-Id, X-App-Secret',
    response: { success: true, data: { deleted: true, username: 'user1' } },
    icon: Zap,
  },
  {
    method: 'GET',
    path: '/api/v2/licenses',
    title: 'List Licenses',
    description: 'List licenses with filters. Supports ?status=unused&level=1&page=1&limit=20.',
    auth: 'Headers: X-App-Id, X-App-Secret',
    response: { success: true, data: [{ id: 'uuid', license_key: 'FZ-XXXX-XXXX', level: 1, used: false }], pagination: { page: 1, total: 50 } },
    icon: Ticket,
  },
  {
    method: 'POST',
    path: '/api/v2/licenses',
    title: 'Generate Licenses',
    description: 'Generate one or more license keys (max 100 per request).',
    auth: 'Headers: X-App-Id, X-App-Secret',
    body: { amount: 'number (1-100)', duration: 'number (seconds)', prefix: 'string', level: 'number' },
    response: { success: true, data: { generated: 5, licenses: ['FZ-XXXX-XXXX-XXXX', '...'] } },
    icon: Ticket,
  },
  {
    method: 'GET',
    path: '/api/v2/stats',
    title: 'App Statistics',
    description: 'Get app statistics. Add ?include=charts for daily data over last 30 days.',
    auth: 'Headers: X-App-Id, X-App-Secret',
    response: { success: true, data: { total_users: 42, active_users_7d: 10, total_licenses: 100, used_licenses: 60, active_sessions: 5, total_events: 1200 } },
    icon: BarChart3,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen relative z-10">
      <header className="border-b border-edge/50 glass-strong sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center border border-accent/20">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">FZ <span className="text-accent">AUTH</span> Docs</span>
          </div>
          <Link href="/login" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Panel
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Documentation</h1>
          <p className="text-gray-400 text-sm">
            Integrate FZ AUTH into your application. All endpoints accept JSON POST requests.
          </p>
        </div>

        <div className="glass rounded-xl p-5 border border-accent/20">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Code className="w-4 h-4 text-accent" /> Base URL
          </h3>
          <code className="text-sm text-accent font-mono">{BASE_URL}</code>
          <p className="text-xs text-gray-500 mt-2">
            All requests must include <code className="text-gray-300">Content-Type: application/json</code> header.
          </p>
        </div>

        <div className="space-y-6">
          {endpoints.map((ep, i) => {
            const Icon = ep.icon;
            return (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-edge/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{ep.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{ep.description}</p>
                  </div>
                  <span className="ms-auto px-2 py-0.5 text-[10px] font-bold rounded bg-green-500/15 text-green-400 border border-green-500/30">
                    {ep.method}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Endpoint</p>
                    <code className="text-sm text-white font-mono bg-bg px-3 py-1.5 rounded-lg border border-edge inline-block">
                      {ep.method} {ep.path}
                    </code>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Request Body</p>
                    <pre className="text-xs text-gray-300 font-mono bg-bg rounded-lg p-4 border border-edge overflow-x-auto">
                      {JSON.stringify(ep.body, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Response</p>
                    <pre className="text-xs text-green-400 font-mono bg-bg rounded-lg p-4 border border-edge overflow-x-auto">
                      {JSON.stringify(ep.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* V2 API Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" /> API v2 Endpoints
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Enhanced API with pagination, detailed error codes, and more endpoints. Authenticate via
            headers (<code className="text-gray-300">X-App-Id</code>, <code className="text-gray-300">X-App-Secret</code>)
            or query params.
          </p>

          <div className="glass rounded-xl p-5 border border-accent/20 mb-6">
            <h3 className="text-sm font-semibold text-white mb-2">V2 Response Format</h3>
            <p className="text-xs text-gray-400 mb-3">All v2 responses include metadata and use consistent structure:</p>
            <pre className="text-xs text-green-400 font-mono bg-bg rounded-lg p-4 border border-edge overflow-x-auto">
{`{
  "success": true,
  "data": { ... },
  "meta": {
    "api_version": "2.0",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "request_id": "uuid"
  }
}`}
            </pre>
          </div>

          <div className="space-y-6">
            {v2Endpoints.map((ep, i) => {
              const Icon = ep.icon;
              const methodColor = ep.method === 'GET' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                ep.method === 'POST' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                ep.method === 'PATCH' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/15 text-red-400 border-red-500/30';
              return (
                <div key={i} className="glass rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-edge/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{ep.title}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{ep.description}</p>
                    </div>
                    <span className={`ms-auto px-2 py-0.5 text-[10px] font-bold rounded border ${methodColor}`}>
                      {ep.method}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Endpoint</p>
                      <code className="text-sm text-white font-mono bg-bg px-3 py-1.5 rounded-lg border border-edge inline-block">
                        {ep.method} {ep.path}
                      </code>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Authentication</p>
                      <p className="text-xs text-gray-400 bg-bg px-3 py-1.5 rounded-lg border border-edge inline-block">
                        {ep.auth}
                      </p>
                    </div>

                    {ep.body && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Request Body</p>
                        <pre className="text-xs text-gray-300 font-mono bg-bg rounded-lg p-4 border border-edge overflow-x-auto">
                          {JSON.stringify(ep.body, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Response</p>
                      <pre className="text-xs text-green-400 font-mono bg-bg rounded-lg p-4 border border-edge overflow-x-auto">
                        {JSON.stringify(ep.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-xl p-5 border border-yellow-500/20">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">Error Responses</h3>
          <p className="text-xs text-gray-400 mb-3">All errors follow this format:</p>
          <pre className="text-xs text-red-400 font-mono bg-bg rounded-lg p-4 border border-edge">
{`{
  "success": false,
  "message": "Error description"
}`}
          </pre>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-gray-500"><code className="text-gray-300">400</code> — Bad request / validation error</p>
            <p className="text-xs text-gray-500"><code className="text-gray-300">401</code> — Invalid credentials</p>
            <p className="text-xs text-gray-500"><code className="text-gray-300">403</code> — Banned / blacklisted / disabled</p>
            <p className="text-xs text-gray-500"><code className="text-gray-300">404</code> — Resource not found (v2)</p>
            <p className="text-xs text-gray-500"><code className="text-gray-300">409</code> — Conflict (e.g. username taken, v2)</p>
            <p className="text-xs text-gray-500"><code className="text-gray-300">429</code> — Rate limited</p>
            <p className="text-xs text-gray-500"><code className="text-gray-300">500</code> — Internal server error</p>
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-yellow-400 mb-2">V2 Error Format</h4>
            <pre className="text-xs text-red-400 font-mono bg-bg rounded-lg p-4 border border-edge">
{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error description",
    "details": [{ "code": "REQUIRED", "message": "...", "field": "username" }]
  },
  "meta": { "api_version": "2.0", "timestamp": "...", "request_id": "..." }
}`}
            </pre>
          </div>
        </div>

        <footer className="border-t border-edge/30 pt-6 pb-10">
          <p className="text-xs text-gray-600 text-center">
            FZ AUTH — Secure Authentication Platform. Developed by FZ.
          </p>
        </footer>
      </main>
    </div>
  );
}
