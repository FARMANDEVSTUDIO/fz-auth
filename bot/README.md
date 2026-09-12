# FZ Auth — Discord Bot (Phase 2)

Discord slash-command bot jo FZ Auth API ke `/admin/*` endpoints ko call karta hai.

---

## Setup

### 1. Discord Application banao

1. https://discord.com/developers/applications → **New Application**
2. **Bot** tab → Add Bot → copy **Token** → `.env` me `BOT_TOKEN` me dalo
3. Application ID copy karo → `CLIENT_ID`
4. Privileged Intents: koi enable nahi karna (slash commands only)

### 2. Bot invite karo

OAuth2 → URL Generator:
- Scopes: `bot`, `applications.commands`
- Permissions: Send Messages, Embed Links, Use Slash Commands

Generated URL open karo aur apne server me add karo.

### 3. Environment variables

`.env` me ye add karo (`.env.example` dekho):

```
BOT_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id
ADMIN_ROLE_ID=role-id-allowed-to-use-commands
API_URL=http://localhost:3000
APP_ID=the-app-id
ADMIN_KEY=the-admin-key
```

`APP_ID` aur `ADMIN_KEY` wahi hai jo `/admin/apps` se milta hai jab tum naya app banate ho.

### 4. Install + Run

```bash
npm install          # discord.js install hoga

npm run bot:deploy   # slash commands register karo (guild me instant)
npm run bot          # bot start karo
```

---

## Commands

| Command | Kaam |
|---|---|
| `/createkey` | License keys generate karo (ephemeral reply) |
| `/userinfo` | User ki detail embed me |
| `/users` | User list |
| `/ban` | User ban karo |
| `/unban` | User unban karo |
| `/resethwid` | HWID reset |
| `/addtime` | Subscription time badhao |
| `/deluser` | User delete (confirmation button) |
| `/blacklist` | HWID/IP blacklist |
| `/stats` | App statistics |

---

## Permission

Sirf wahi log commands use kar sakte hain jo:
- Server **Administrator** hain, ya
- `.env` me diye `ADMIN_ROLE_ID` role rakhte hain

---

## Notes

- Bot sirf ek app manage karta hai (jo `APP_ID` me set hai)
- API server pehle se chalna chahiye (`npm start`)
- `GUILD_ID` se commands turant register hote hain (global registration me 1 hour lag sakta hai)
