require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(port, () => console.log(`Express server running on port ${port}`));

const token = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
if (!token) {
  console.error("❌ BOT_TOKEN not found in environment variables!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('🤖 Bot is running...');

const products = {
  'lizzy_and_bro': { name: 'Lizzy And Bro', price: 25 },
  'savannah': { name: 'Savannah', price: 30 },
  'amelia_blonde': { name: 'Amelia Blonde', price: 35 },
  'ivanka_and_bro': { name: 'Ivanka And Bro', price: 28 },
  'abbi': { name: 'Abbi', price: 22 },
  'anita': { name: 'Anita', price: 28 },
  'darkzadie': { name: 'Darkzadie', price: 23 },
  'desire_garcia': { name: 'Desire Garcia', price: 20 },
  'cp1': { name: 'CP1', price: 35 },
  'cp2': { name: 'CP2', price: 38 },
  'cp3': { name: 'CP3', price: 42 },
  'cp4': { name: 'CP4', price: 48 },
  'baby_ashlee': { name: 'Baby Ashlee', price: 28 },
  'anxious_panda': { name: 'Anxious Panda', price: 32 },
  'izzy': { name: 'Izzy', price: 38 },
};

const nameToKey = {
  'lizzy and bro': 'lizzy_and_bro',
  'savannah': 'savannah',
  'amelia blonde': 'amelia_blonde',
  'ivanka and bro': 'ivanka_and_bro',
  'abbi': 'abbi',
  'anita': 'anita',
  'darkzadie': 'darkzadie',
  'desire garcia': 'desire_garcia',
  'cp1': 'cp1',
  'cp2': 'cp2',
  'cp3': 'cp3',
  'cp4': 'cp4',
  'baby ashlee': 'baby_ashlee',
  'anxious panda': 'anxious_panda',
  'izzy': 'izzy'
};

const methods = ['paypal', 'binance', 'checkout'];
const states = {};

function resetState(chatId) {
  states[chatId] = { step: 'awaiting_product' };
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetState(chatId);

  const welcomeMsg = 
`👋 Welcome to *Best Services Store*!

🛍️ To begin, please type the *exact name* of the product you want to purchase.

📦 Available products:
${Object.keys(products).map(key => `• *${products[key].name}* — ${formatPrice(products[key].price)}`).join('\n')}

💡 Tip: type the name exactly as shown.`;

  bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase().trim();

  if (text.startsWith('/')) return;

  if (!states[chatId]) {
    return bot.sendMessage(chatId, '⚠️ Please type /start to begin.');
  }

  const currentState = states[chatId];

  if (currentState.step === 'awaiting_product') {
    const productKey = nameToKey[text];

    if (productKey && products[productKey]) {
      const prod = products[productKey];
      currentState.product = productKey;
      currentState.step = 'awaiting_method';

      const methodMsg = 
`✨ You selected: *${prod.name}* — *${formatPrice(prod.price)}*.

Please choose a payment method:

💳 *paypal*  
🪙 *binance*  
💼 *checkout*`;

      bot.sendMessage(chatId, methodMsg, { parse_mode: 'Markdown' });

    } else {
      bot.sendMessage(chatId, '❌ Invalid product name. Please type exactly as shown.');
    }

  } else if (currentState.step === 'awaiting_method') {
    if (methods.includes(text)) {
      currentState.method = text;
      const prod = products[currentState.product];

      let reply = 
`🧾 *Order summary:*

• Product: *${prod.name}*
• Price: *${formatPrice(prod.price)}*
• Payment Method: *${text.toUpperCase()}*\n\n`;

      if (text === 'paypal') {
        reply +=
`💳 *PayPal Payment*

Send to: \`merakiii@outlook.pt\`  
Then type *confirm* to finish.`;
      } else if (text === 'binance') {
        reply +=
`🪙 *Binance Payment*

• BTC: \`bc1qs4wy29fp4jh49x40hcnduatftkewu6nk5da8tk\`  
• USDT: \`0x8B2Eb4C56dFC583edb11109821212b0bb91faE04\`  

Then type *confirm* after sending.`;
      } else if (text === 'checkout') {
        reply +=
`💼 *Checkout Payment*

[Click here to contact support](https://t.me/vipadminii)  
We will send you the CashApp / Apple Pay invoice.`;
      }

      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown', disable_web_page_preview: true });
      currentState.step = 'awaiting_confirmation';

    } else {
      bot.sendMessage(chatId,
`❌ Invalid payment method.

Please type one of the following:

💳 *paypal*  
🪙 *binance*  
💼 *checkout*`, { parse_mode: 'Markdown' });
    }

  } else if (currentState.step === 'awaiting_confirmation') {
    if (text === 'confirm') {
      const prod = products[currentState.product];

      bot.sendMessage(chatId,
`✅ *Payment confirmed!*

Thanks for purchasing *${prod.name}*. 🎉

📦 To receive your order, please send proof of payment with the product name:
👉 [Contact support here](https://t.me/vipadminii)

📝 Example:  
\`I paid for ${prod.name}\`

Type /start to make another purchase.`, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      resetState(chatId);

    } else {
      bot.sendMessage(chatId, `⌛ Waiting for confirmation. Type *confirm* once payment is sent.`, { parse_mode: 'Markdown' });
    }
  }
});
