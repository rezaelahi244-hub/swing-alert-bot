const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'mysecret';
const PORT = process.env.PORT || 3000;

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    });
    console.log('[Telegram] Sent');
  } catch (err) {
    console.error('[Telegram] Error:', err.response?.data || err.message);
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'Swing Alert Bot running', time: new Date().toISOString() });
});

app.post('/webhook', async (req, res) => {
  const secret = req.query.secret || req.body.secret;
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const { symbol, timeframe, swing, price, time } = req.body;
  console.log('[Webhook]', req.body);

  if (!symbol || !timeframe || !swing || !price) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const isHH = swing === 'Higher High';
  const emoji = isHH ? '🟢📈' : '🔴📉';
  const trend = isHH ? 'UPTREND' : 'DOWNTREND';

  const msg =
    `${emoji} <b>SWING ALERT</b>\n\n` +
    `<b>Symbol:</b> ${symbol}\n` +
    `<b>Timeframe:</b> ${timeframe}\n` +
    `<b>Swing:</b> ${swing} <i>(${trend})</i>\n` +
    `<b>Price:</b> <code>${parseFloat(price).toFixed(5)}</code>\n` +
    `<b>Time:</b> ${time}\n\n` +
    `<i>Price crossed the last valid swing level.</i>`;

  await sendTelegram(msg);
  res.json({ success: true });
});

app.get('/test', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  await sendTelegram('✅ <b>Swing Alert Bot</b> — connected and working!');
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Swing Alert Bot running on port ${PORT}`);
});
