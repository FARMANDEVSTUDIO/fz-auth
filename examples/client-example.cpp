/*
 * FZ Auth — C++ Client Example (uses libcurl + nlohmann/json)
 *
 * Dependencies:
 *   - libcurl: https://curl.se/libcurl/
 *   - nlohmann/json: https://github.com/nlohmann/json (single header)
 *
 * Compile (Windows):
 *   g++ -o fzauth client-example.cpp -lcurl -lws2_32 -std=c++17
 *
 * Compile (Linux/macOS):
 *   g++ -o fzauth client-example.cpp -lcurl -std=c++17
 *
 * Usage:
 *   1. Create an app in the FZ Auth panel and copy app_id + secret
 *   2. Generate a license key in the panel
 *   3. Set the constants below and compile + run
 */

#include <iostream>
#include <string>
#include <curl/curl.h>
#include "json.hpp" // nlohmann/json single header

#ifdef _WIN32
  #include <winsock2.h>
  #pragma comment(lib, "ws2_32.lib")
#else
  #include <unistd.h>
#endif

using json = nlohmann::json;

// ── Replace these with your real values from the panel ──────────────
const std::string BASE       = "http://localhost:3001";
const std::string APP_ID     = "YOUR_APP_ID_HERE";
const std::string APP_SECRET = "YOUR_APP_SECRET_HERE";
const std::string VERSION    = "1.0";
// ────────────────────────────────────────────────────────────────────

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* out) {
    out->append(static_cast<char*>(contents), size * nmemb);
    return size * nmemb;
}

json api(const std::string& endpoint, json body = {}) {
    body["app_id"] = APP_ID;
    body["secret"] = APP_SECRET;

    CURL* curl = curl_easy_init();
    std::string response;

    if (!curl) {
        return json{{"success", false}, {"message", "Failed to init curl"}};
    }

    std::string url = BASE + "/api/v1/" + endpoint;
    std::string payload = body.dump();

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        return json{{"success", false}, {"message", std::string("Request failed: ") + curl_easy_strerror(res)}};
    }

    try {
        return json::parse(response);
    } catch (...) {
        return json{{"success", false}, {"message", "Invalid JSON response"}};
    }
}

std::string getHWID() {
    char name[256] = {0};
#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
    gethostname(name, sizeof(name));
    WSACleanup();
#else
    gethostname(name, sizeof(name));
#endif
    return std::string(name) + "-cpp-client";
}

int main() {
    curl_global_init(CURL_GLOBAL_ALL);
    std::cout << "FZ Auth - C++ Client\n\n";

    std::string hwid = getHWID();
    std::cout << "HWID: " << hwid << "\n\n";

    // 1) Initialize
    std::cout << "[1] Initializing...\n";
    auto init = api("init", {{"version", VERSION}});
    if (!init.value("success", false)) {
        std::cerr << "    FAILED: " << init.value("message", "Unknown error") << "\n";
        curl_global_cleanup();
        return 1;
    }
    std::cout << "    App: " << init.value("app_name", "") << " v" << init.value("version", "") << "\n";
    std::cout << "    Users: " << init.value("user_count", 0) << " | Sessions: " << init.value("active_sessions", 0) << "\n\n";

    // 2) Login
    std::string username, password;
    std::cout << "    Username: ";
    std::getline(std::cin, username);
    std::cout << "    Password: ";
    std::getline(std::cin, password);

    std::cout << "\n[2] Logging in as '" << username << "'...\n";
    auto login = api("login", {{"username", username}, {"password", password}, {"hwid", hwid}});
    if (!login.value("success", false)) {
        std::cerr << "    FAILED: " << login.value("message", "Unknown error") << "\n";
        curl_global_cleanup();
        return 1;
    }
    std::string token = login.value("token", "");
    std::cout << "    Logged in! Token: " << token.substr(0, 12) << "...\n";
    std::cout << "    Expiry: " << login.value("expiry", "N/A") << "\n\n";

    // 3) Check session
    std::cout << "[3] Validating session...\n";
    auto check = api("check", {{"token", token}});
    if (!check.value("success", false)) {
        std::cerr << "    FAILED: " << check.value("message", "Unknown error") << "\n";
        curl_global_cleanup();
        return 1;
    }
    std::cout << "    Session valid for: " << check.value("username", "") << "\n\n";

    // 4) Fetch variables
    std::cout << "[4] Fetching variables...\n";
    auto vars = api("var");
    if (vars.value("success", false) && vars.contains("variables")) {
        for (auto& [k, v] : vars["variables"].items()) {
            std::cout << "    " << k << " = " << v << "\n";
        }
    } else {
        std::cout << "    No variables found.\n";
    }

    std::cout << "\nAuthentication successful!\n";

    curl_global_cleanup();
    return 0;
}