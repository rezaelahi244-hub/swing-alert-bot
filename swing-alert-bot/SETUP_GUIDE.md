# Swing Alert Bot — Setup Guide

A TradingView webhook server that sends you Telegram (and/or Discord) notifications
when price touches the last swing high/low on any of your configured timeframes.

---

## How it works

```
TradingView detects swing touch (Pine Script)
          ↓
POST webhook → your server (Railway/Render — free)
          ↓
Server sends Telegram message to your bot chat
```

---

## Step 1 — Create your Telegram bot (5 min)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g. `My Swing Alerts`)
4. Choose a username (e.g. `myswingalerts_bot`)
5. BotFather gives you a **token** like:
   ```
   7312456789:AAFxyz_your_token_here
   ```
   → Copy this, it goes in `TELEGRAM_TOKEN`

6. Search for **@userinfobot** on Telegram and send `/start`
7. It replies with your **Chat ID** like `123456789`
   → Copy this, it goes in `TELEGRAM_CHAT_ID`

8. Start a conversation with your new bot (search its username, hit Start)

---

## Step 2 — Deploy to Railway (free, 5 min)

1. Go to **railway.app** and sign up (free)
2. Click **New Project → Deploy from GitHub repo**
3. Upload or push this folder to a GitHub repo, then connect it
4. In Railway, go to your project → **Variables** tab → add:

   | Variable | Value |
   |---|---|
   | `TELEGRAM_TOKEN` | your token from BotFather |
   | `TELEGRAM_CHAT_ID` | your chat ID from userinfobot |
   | `WEBHOOK_SECRET` | any password you choose (e.g. `swing123`) |
   | `DISCORD_WEBHOOK_URL` | (optional) your Discord webhook URL |

5. Railway auto-deploys and gives you a URL like:
   ```
   https://swing-alert-bot-production.up.railway.app
   ```

6. Test it by opening:
   ```
   https://your-railway-url.up.railway.app/test?secret=swing123
   ```
   You should get a Telegram message! ✅

---

## Step 3 — Add Pine Script to TradingView (3 min)

1. Open TradingView → Pine Editor (bottom panel)
2. Paste the contents of `swing_alert_bot.pine`
3. Click **Add to chart**
4. In the indicator settings (⚙️ icon), set your swing directions:
   - H4: High or Low
   - H1: High or Low
   - 30m: High or Low
   - 15m: High or Low
   - 5m: High or Low

You'll see coloured horizontal lines on your chart — green = swing high, red = swing low.

---

## Step 4 — Create the alert in TradingView (2 min — only once!)

1. Press **Ctrl+A** (or the Alert clock icon) → Create Alert
2. **Condition:** Select `Swing Alert Bot` → `Any alert() function call`
3. **Trigger:** Once Per Bar Close (or Once Per Bar)
4. **Notifications:** Check ✅ **Webhook URL**
5. **Webhook URL:** paste your Railway URL:
   ```
   https://your-railway-url.up.railway.app/webhook?secret=swing123
   ```
6. **Alert name:** `Swing Alert Bot — EURUSD` (or your symbol)
7. Leave the **Message** field as-is (Pine Script sends the JSON payload itself)
8. Click **Create** ✅

That's it! This single alert covers ALL 5 timeframes simultaneously.
When any swing is touched, TradingView fires the webhook, your server
sends you a Telegram message instantly.

---

## What a Telegram notification looks like

```
🟢📈 SWING ALERT

Symbol:    EURUSD
Timeframe: H1
Signal:    Swing High touched
Price:     1.08542
Time:      2024-01-15 14:30

Last H1 Swing High has been reached.
```

---

## Changing swing directions

Go to your chart → click the ⚙️ on the indicator → change High/Low per timeframe.
The Pine Script updates the levels instantly. No need to recreate the alert.

---

## Optional: Discord notifications

1. Go to your Discord server → channel settings → Integrations → Webhooks
2. Create a new webhook → Copy URL
3. Add it as `DISCORD_WEBHOOK_URL` in your Railway variables
4. Both Telegram and Discord will receive every alert

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No Telegram message on test | Check `TELEGRAM_TOKEN` and `TELEGRAM_CHAT_ID` are correct. Did you start a chat with your bot? |
| TradingView says webhook failed | Make sure Railway is deployed and the URL is correct including `?secret=...` |
| Alerts not firing | In TradingView, check the alert is active (green dot in Alerts panel) |
| Wrong swing levels | Increase the Lookback value in indicator settings |

---

## Files in this project

```
swing-alert-bot/
├── src/
│   └── server.js          ← The webhook server
├── swing_alert_bot.pine   ← Paste this into TradingView Pine Editor
├── package.json
├── railway.toml           ← Railway deployment config
├── .env.example           ← Copy to .env and fill in your values
└── .gitignore
```
