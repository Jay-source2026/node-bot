require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(port, () => console.log(`Express server running on port ${port}`));

const token = process.env.BOT_TOKEN || '7567384896:AAHBlzaVtx_KXnO2THaepTWw2ne5KcWM6Vk';
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

const nameToKey = {};
Object.keys(products).forEach(key => {
  nameToKey[products[key].name.toLowerCase()] = key;
});

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

🛍️ To begin, type the *exact name* of the product you want to purchase.

📦 Available products:
${Object.values(products).map(p => `• *${p.name}* — ${formatPrice(p.price)}`).join('\n')}

💡 Tip: copy & paste the product name.`;

  bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim().toLowerCase();

  if (text.startsWith('/')) return;

  const currentState = states[chatId];
  if (!currentState) {
    return bot.sendMessage(chatId, '⚠️ Please type /start to begin.');
  }

  if (currentState.step === 'awaiting_product') {
    const productKey = nameToKey[text];

    if (productKey && products[productKey]) {
      const prod = products[productKey];
      currentState.product = productKey;
      currentState.step = 'awaiting_method';

      const msgText = 
`✨ You selected: *${prod.name}* — *${formatPrice(prod.price)}*

Please choose a payment method below:`;

      bot.sendMessage(chatId, msgText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 PayPal', callback_data: 'method_paypal' }],
            [{ text: '🪙 Binance', callback_data: 'method_binance' }],
            [{ text: '💼 Checkout', callback_data: 'method_checkout' }]
          ]
        }
      });

    } else {
      bot.sendMessage(chatId, '❌ Product not found. Please type the exact name shown in the list.');
    }

  } else if (currentState.step === 'awaiting_confirmation') {
    if (text === 'confirm') {
      const prod = products[currentState.product];
      bot.sendMessage(chatId,
`✅ *Payment confirmed!*

Thank you for purchasing *${prod.name}*! 🎉

📩 Please send proof of payment along with the product name to receive your order:
👉 [Contact Support](https://t.me/vipadminii)

📝 Example:  
\`I paid for ${prod.name}\`

Type /start to make another purchase.`, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      resetState(chatId);

    } else {
      bot.sendMessage(chatId, `⌛ Waiting for confirmation. Type *confirm* after sending the payment.`, { parse_mode: 'Markdown' });
    }
  }
});

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  const currentState = states[chatId];
  if (!currentState || !currentState.product) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: 'Start with /start.' });
  }

  if (data.startsWith('method_')) {
    const method = data.replace('method_', '');
    if (!methods.includes(method)) {
      return bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid method.' });
    }

    currentState.method = method;
    currentState.step = 'awaiting_confirmation';

    const prod = products[currentState.product];

    let reply = 
`🧾 *Order Summary:*

• Product: *${prod.name}*  
• Price: *${formatPrice(prod.price)}*  
• Payment Method: *${method.toUpperCase()}*\n\n`;

    if (method === 'paypal') {
      reply +=
`💳 *PayPal Payment*

Send to: \`merakiii@outlook.pt\`  
Then click the button below or type *confirm* to finish.`;
    } else if (method === 'binance') {
      reply +=
`🪙 *Binance Payment*

• BTC: \`bc1qs4wy29fp4jh49x40hcnduatftkewu6nk5da8tk\`  
• USDT: \`0x8B2Eb4C56dFC583edb11109821212b0bb91faE04\`

Then click the button below or type *confirm*.`;
    } else if (method === 'checkout') {
      reply +=
`💼 *Checkout Payment*

[Click here to contact support](https://t.me/vipadminii)  
We will send you the CashApp / Apple Pay invoice.`;
    }

    bot.sendMessage(chatId, reply, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Confirm Payment', callback_data: 'confirm_payment' }],
          [{ text: '❌ Cancel', callback_data: 'cancel_order' }]
        ]
      }
    });

    bot.answerCallbackQuery(callbackQuery.id);
  }

  if (data === 'confirm_payment') {
    const prod = products[currentState.product];
    bot.sendMessage(chatId,
`✅ *Payment confirmed!*

Thanks for purchasing *${prod.name}*. 🎉

📩 Please send proof of payment along with the product name to receive your order:
👉 [Contact Support](https://t.me/vipadminii)

📝 Example:  
\`I paid for ${prod.name}\``, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    resetState(chatId);
    bot.answerCallbackQuery(callbackQuery.id);
  }

  if (data === 'cancel_order') {
    bot.sendMessage(chatId, `❌ Order cancelled. Type /start to begin again.`);
    resetState(chatId);
    bot.answerCallbackQuery(callbackQuery.id, { text: 'Order cancelled.' });
  }
});
