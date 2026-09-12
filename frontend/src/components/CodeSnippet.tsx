'use client';

import { useState } from 'react';
import { Copy, Check, Code2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  appName: string;
  ownerId: string;
  appVersion: string;
  appId: string;
  appSecret: string;
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'csharp', label: 'C#' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'cpp', label: 'C++ (cURL)' },
  { value: 'php', label: 'PHP' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'lua', label: 'Lua' },
  { value: 'curl', label: 'cURL' },
] as const;

function getSnippet(lang: string, appId: string, secret: string, version: string): string {
  const base = 'http://localhost:3001/api/v1';

  switch (lang) {
    case 'python':
      return `import requests

API = "${base}"
APP_ID = "${appId}"
SECRET = "${secret}"

# 1. Initialize
r = requests.post(f"{API}/init", json={
    "app_id": APP_ID, "secret": SECRET, "version": "${version}"
})
print("Init:", r.json())

# 2. Register (with license key)
r = requests.post(f"{API}/register", json={
    "app_id": APP_ID, "secret": SECRET,
    "username": "player1", "password": "pass123",
    "license_key": "YOUR-KEY-HERE", "hwid": "DEVICE-HWID"
})
print("Register:", r.json())

# 3. Login
r = requests.post(f"{API}/login", json={
    "app_id": APP_ID, "secret": SECRET,
    "username": "player1", "password": "pass123",
    "hwid": "DEVICE-HWID"
})
data = r.json()
token = data.get("token")
print("Login:", data)

# 4. Check session
r = requests.post(f"{API}/check", json={
    "app_id": APP_ID, "secret": SECRET, "token": token
})
print("Check:", r.json())`;

    case 'csharp':
      return `using System.Net.Http;
using System.Text.Json;

var client = new HttpClient();
var API = "${base}";
var APP_ID = "${appId}";
var SECRET = "${secret}";

// 1. Init
var initRes = await client.PostAsJsonAsync($"{API}/init", new {
    app_id = APP_ID, secret = SECRET, version = "${version}"
});
Console.WriteLine(await initRes.Content.ReadAsStringAsync());

// 2. Login
var loginRes = await client.PostAsJsonAsync($"{API}/login", new {
    app_id = APP_ID, secret = SECRET,
    username = "player1", password = "pass123",
    hwid = Environment.MachineName
});
var loginData = JsonSerializer.Deserialize<JsonElement>(
    await loginRes.Content.ReadAsStringAsync()
);
var token = loginData.GetProperty("token").GetString();

// 3. Check Session
var checkRes = await client.PostAsJsonAsync($"{API}/check", new {
    app_id = APP_ID, secret = SECRET, token = token
});
Console.WriteLine(await checkRes.Content.ReadAsStringAsync());`;

    case 'javascript':
      return `const API = "${base}";
const APP_ID = "${appId}";
const SECRET = "${secret}";

// 1. Initialize
const init = await fetch(\`\${API}/init\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ app_id: APP_ID, secret: SECRET, version: "${version}" })
});
console.log("Init:", await init.json());

// 2. Login
const login = await fetch(\`\${API}/login\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    app_id: APP_ID, secret: SECRET,
    username: "player1", password: "pass123", hwid: "DEVICE-HWID"
  })
});
const { token } = await login.json();

// 3. Check Session
const check = await fetch(\`\${API}/check\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ app_id: APP_ID, secret: SECRET, token })
});
console.log("Session:", await check.json());`;

    case 'typescript':
      return `const API = "${base}";
const APP_ID = "${appId}";
const SECRET = "${secret}";

interface ApiResponse {
  success: boolean;
  message: string;
  token?: string;
  [key: string]: unknown;
}

async function fzPost(endpoint: string, body: object): Promise<ApiResponse> {
  const res = await fetch(\`\${API}/\${endpoint}\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: APP_ID, secret: SECRET, ...body })
  });
  return res.json();
}

// 1. Init
const init = await fzPost("init", { version: "${version}" });

// 2. Login
const login = await fzPost("login", {
  username: "player1", password: "pass123", hwid: "DEVICE-HWID"
});

// 3. Check session
if (login.token) {
  const check = await fzPost("check", { token: login.token });
  console.log("Valid:", check.success);
}`;

    case 'cpp':
      return `#include <curl/curl.h>
#include <string>

// Using libcurl - POST JSON helper
std::string post(const std::string& url, const std::string& json) {
    CURL* curl = curl_easy_init();
    std::string response;
    struct curl_slist* headers = curl_slist_append(NULL, "Content-Type: application/json");
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, +[](char* p, size_t s, size_t n, std::string* d) {
        d->append(p, s * n); return s * n;
    });
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    return response;
}

int main() {
    std::string API = "${base}";
    std::string body = R"({
        "app_id": "${appId}",
        "secret": "${secret}",
        "version": "${version}"
    })";

    // Init
    std::string res = post(API + "/init", body);
    printf("Init: %s\\n", res.c_str());
    return 0;
}`;

    case 'php':
      return `<?php
$API = "${base}";
$APP_ID = "${appId}";
$SECRET = "${secret}";

function fzPost($endpoint, $data) {
    global $API, $APP_ID, $SECRET;
    $data["app_id"] = $APP_ID;
    $data["secret"] = $SECRET;

    $ch = curl_init("$API/$endpoint");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

// 1. Init
$init = fzPost("init", ["version" => "${version}"]);
print_r($init);

// 2. Login
$login = fzPost("login", [
    "username" => "player1",
    "password" => "pass123",
    "hwid" => php_uname("n")
]);
$token = $login["token"] ?? null;

// 3. Check session
if ($token) {
    $check = fzPost("check", ["token" => $token]);
    print_r($check);
}`;

    case 'java':
      return `import java.net.http.*;
import java.net.URI;

public class FZAuth {
    static String API = "${base}";
    static String APP_ID = "${appId}";
    static String SECRET = "${secret}";

    static String post(String endpoint, String extraJson) throws Exception {
        var body = String.format(
            "{\\"app_id\\":\\"%s\\",\\"secret\\":\\"%s\\",%s}",
            APP_ID, SECRET, extraJson
        );
        var req = HttpRequest.newBuilder()
            .uri(URI.create(API + "/" + endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
        return HttpClient.newHttpClient()
            .send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    public static void main(String[] args) throws Exception {
        // Init
        System.out.println(post("init", "\\"version\\":\\"${version}\\""));

        // Login
        System.out.println(post("login",
            "\\"username\\":\\"player1\\",\\"password\\":\\"pass123\\""
        ));
    }
}`;

    case 'go':
      return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const API = "${base}"
const AppID = "${appId}"
const Secret = "${secret}"

func fzPost(endpoint string, extra map[string]string) map[string]interface{} {
    extra["app_id"] = AppID
    extra["secret"] = Secret
    body, _ := json.Marshal(extra)
    resp, _ := http.Post(API+"/"+endpoint, "application/json", bytes.NewReader(body))
    defer resp.Body.Close()
    data, _ := io.ReadAll(resp.Body)
    var result map[string]interface{}
    json.Unmarshal(data, &result)
    return result
}

func main() {
    // Init
    fmt.Println(fzPost("init", map[string]string{"version": "${version}"}))

    // Login
    fmt.Println(fzPost("login", map[string]string{
        "username": "player1", "password": "pass123",
    }))
}`;

    case 'rust':
      return `use reqwest::Client;
use serde_json::{json, Value};

const API: &str = "${base}";
const APP_ID: &str = "${appId}";
const SECRET: &str = "${secret}";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();

    // Init
    let res: Value = client.post(format!("{API}/init"))
        .json(&json!({
            "app_id": APP_ID, "secret": SECRET,
            "version": "${version}"
        }))
        .send().await?.json().await?;
    println!("Init: {res}");

    // Login
    let res: Value = client.post(format!("{API}/login"))
        .json(&json!({
            "app_id": APP_ID, "secret": SECRET,
            "username": "player1", "password": "pass123"
        }))
        .send().await?.json().await?;
    println!("Login: {res}");

    Ok(())
}`;

    case 'ruby':
      return `require 'net/http'
require 'json'

API = "${base}"
APP_ID = "${appId}"
SECRET = "${secret}"

def fz_post(endpoint, data = {})
  uri = URI("#{API}/#{endpoint}")
  data[:app_id] = APP_ID
  data[:secret] = SECRET
  res = Net::HTTP.post(uri, data.to_json, "Content-Type" => "application/json")
  JSON.parse(res.body)
end

# Init
puts fz_post("init", version: "${version}")

# Login
login = fz_post("login", username: "player1", password: "pass123")
puts login

# Check session
if login["token"]
  puts fz_post("check", token: login["token"])
end`;

    case 'lua':
      return `local http = require("socket.http")
local json = require("cjson")
local ltn12 = require("ltn12")

local API = "${base}"
local APP_ID = "${appId}"
local SECRET = "${secret}"

function fz_post(endpoint, data)
    data.app_id = APP_ID
    data.secret = SECRET
    local body = json.encode(data)
    local resp = {}
    http.request({
        url = API .. "/" .. endpoint,
        method = "POST",
        headers = {["Content-Type"] = "application/json", ["Content-Length"] = #body},
        source = ltn12.source.string(body),
        sink = ltn12.sink.table(resp)
    })
    return json.decode(table.concat(resp))
end

-- Init
local init = fz_post("init", {version = "${version}"})
print(init.message)

-- Login
local login = fz_post("login", {username = "player1", password = "pass123"})
print(login.message)`;

    case 'curl':
      return `# 1. Initialize App
curl -X POST ${base}/init \\
  -H "Content-Type: application/json" \\
  -d '{"app_id":"${appId}","secret":"${secret}","version":"${version}"}'

# 2. Register (with license key)
curl -X POST ${base}/register \\
  -H "Content-Type: application/json" \\
  -d '{"app_id":"${appId}","secret":"${secret}","username":"player1","password":"pass123","license_key":"YOUR-KEY","hwid":"DEVICE-HWID"}'

# 3. Login
curl -X POST ${base}/login \\
  -H "Content-Type: application/json" \\
  -d '{"app_id":"${appId}","secret":"${secret}","username":"player1","password":"pass123","hwid":"DEVICE-HWID"}'

# 4. Check Session (use token from login response)
curl -X POST ${base}/check \\
  -H "Content-Type: application/json" \\
  -d '{"app_id":"${appId}","secret":"${secret}","token":"TOKEN-FROM-LOGIN"}'

# 5. Get Variables
curl -X POST ${base}/var \\
  -H "Content-Type: application/json" \\
  -d '{"app_id":"${appId}","secret":"${secret}"}'`;

    default:
      return '';
  }
}

function getLangColor(lang: string): string {
  const colors: Record<string, string> = {
    python: 'text-yellow-400',
    csharp: 'text-green-400',
    javascript: 'text-yellow-300',
    typescript: 'text-violet-300',
    cpp: 'text-violet-400',
    php: 'text-purple-400',
    java: 'text-orange-400',
    go: 'text-teal-400',
    rust: 'text-orange-300',
    ruby: 'text-red-400',
    lua: 'text-indigo-400',
    curl: 'text-green-300',
  };
  return colors[lang] || 'text-white';
}

export default function CodeSnippet({ appName, ownerId, appVersion, appId, appSecret }: Props) {
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState('python');
  const [copied, setCopied] = useState(false);

  const snippet = getSnippet(lang, appId, appSecret, appVersion);

  const copyCode = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Code copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-t border-edge/50">
      {/* Toggle */}
      <div className="px-5 py-3 flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => setShow(!show)}
            className={`w-10 h-5 rounded-full transition-colors relative ${show ? 'bg-accent' : 'bg-edge'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${show ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-gray-400 font-medium">Display Code Snippet</span>
        </label>
      </div>

      {/* Code Panel */}
      {show && (
        <div className="px-5 pb-5 space-y-3">
          {/* Language Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Select Language:</span>
            <div className="relative flex-1 max-w-[250px]">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full appearance-none bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent cursor-pointer pe-8"
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Code Block */}
          <div className="relative bg-bg rounded-xl border border-edge overflow-hidden">
            <div className="absolute top-2 end-2 z-10">
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold btn-gradient text-white rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre className="p-4 pe-28 text-xs leading-relaxed overflow-x-auto font-mono max-h-[400px] overflow-y-auto">
              <code className={getLangColor(lang)}>{snippet}</code>
            </pre>
          </div>

          <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <p className="text-[11px] text-accent/80 leading-relaxed">
              <strong>Base URL:</strong> <code className="text-accent">http://localhost:3001/api/v1</code> —
              Replace with your production domain when deploying. All endpoints accept POST with JSON body.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
