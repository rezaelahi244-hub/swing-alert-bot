const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// ── Config from environment variables ──────────────────────────────────────
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'mysecret';
const PORT = process.env.PORT || 3000;

// ── Emoji map for swing direction ──────────────────────────────────────────
const DIRECTION_EMOJI = {
  high: '🟢📈',
  low:  '🔴📉',
};

const TF_LABELS = {
  '240': 'H4',
  '60':  'H1',
  '30':  '30m',
  '15':  '15m',
  '5':   '5m',
};

// ── Send Telegram message ──────────────────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }
    );
    console.log('[Telegram] Message sent');
  } catch (err) {
    console.error('[Telegram] Error:', err.response?.data || err.message);
  }
}

// ── Send Discord message ───────────────────────────────────────────────────
async function sendDiscord(content, embed) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content, embeds: embed ? [embed] : undefined });
    console.log('[Discord] Message sent');
  } catch (err) {
    console.error('[Discord] Error:', err.response?.data || err.message);
  }
}

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'Swing Alert Bot is running 🚀', time: new Date().toISOString() });
});

// ── Main webhook endpoint ──────────────────────────────────────────────────
// TradingView will POST to: https://your-server.com/webhook?secret=mysecret
app.post('/webhook', async (req, res) => {
  // Validate secret
  const secret = req.query.secret || req.body.secret;
  if (secret !== WEBHOOK_SECRET) {
    console.warn('[Webhook] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;
  console.log('[Webhook] Received:', JSON.stringify(body, null, 2));

  // Expected payload from Pine Script:
  // {
  //   "symbol": "EURUSD",
  //   "timeframe": "60",
  //   "direction": "high",   // "high" or "low"
  //   "price": "1.08542",
  //   "time": "2024-01-15 14:30"
  // }

  const { symbol, timeframe, direction, price, time } = body;

  if (!symbol || !timeframe || !direction || !price) {
    return res.status(400).json({ error: 'Missing required fields: symbol, timeframe, direction, price' });
  }

  const tfLabel = TF_LABELS[timeframe] || timeframe;
  const dirLabel = direction === 'high' ? 'Swing High' : 'Swing Low';
  const emoji = DIRECTION_EMOJI[direction] || '⚡';
  const timestamp = time || new Date().toUTCString();

  // ── Telegram message ─────────────────────────────────────────────────────
  const telegramMsg =
    `${emoji} <b>SWING ALERT</b>\n\n` +
    `<b>Symbol:</b> ${symbol}\n` +
    `<b>Timeframe:</b> ${tfLabel}\n` +
    `<b>Signal:</b> ${dirLabel} <b>touched</b>\n` +
    `<b>Price:</b> <code>${parseFloat(price).toFixed(5)}</code>\n` +
    `<b>Time:</b> ${timestamp}\n\n` +
    `<i>Last ${tfLabel} ${dirLabel} has been reached.</i>`;

  // ── Discord embed ─────────────────────────────────────────────────────────
  const discordColor = direction === 'high' ? 0x22c55e : 0xef4444;
  const discordEmbed = {
    title: `${emoji} Swing Alert — ${symbol}`,
    color: discordColor,
    fields: [
      { name: 'Symbol',    value: symbol,                              inline: true },
      { name: 'Timeframe', value: tfLabel,                             inline: true },
      { name: 'Signal',    value: `${dirLabel} touched`,               inline: true },
      { name: 'Price',     value: `\`${parseFloat(price).toFixed(5)}\``, inline: true },
      { name: 'Time',      value: timestamp,                           inline: false },
    ],
    footer: { text: 'Swing Alert Bot' },
    timestamp: new Date().toISOString(),
  };

  // ── Fire both notifications ───────────────────────────────────────────────
  await Promise.all([
    sendTelegram(telegramMsg),
    sendDiscord(`**${symbol} ${tfLabel} ${dirLabel} touched at ${price}**`, discordEmbed),
  ]);

  res.json({ success: true, message: `Alert sent for ${symbol} ${tfLabel} ${dirLabel}` });
});

// ── Test endpoint — hit this to verify Telegram/Discord work ──────────────
app.get('/test', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await Promise.all([
    sendTelegram(
      '✅ <b>Swing Alert Bot — Test</b>\n\nYour bot is connected and working correctly!'
    ),
    sendDiscord('', {
      title: '✅ Swing Alert Bot — Test',
      color: 0x3b82f6,
      description: 'Your bot is connected and working correctly!',
      timestamp: new Date().toISOString(),
    }),
  ]);

  res.json({ success: true, message: 'Test notifications sent!' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Swing Alert Bot running on port ${PORT}`);
  console.log(`   Webhook URL: http://localhost:${PORT}/webhook?secret=${WEBHOOK_SECRET}`);
  console.log(`   Test URL:    http://localhost:${PORT}/test?secret=${WEBHOOK_SECRET}\n`);
});
