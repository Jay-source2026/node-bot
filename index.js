// ==========================
// 🤖 TELEGRAM SALES BOT
// ==========================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Root route
app.get('/', (req, res) => res.send('Bot is alive!'));

// Status route for monitoring
app.get('/status', (req, res) => {
  const productFreq = {};
  stats.selectedProducts.forEach(p => {
    productFreq[p] = (productFreq[p] || 0) + 1;
  });
  const mostCommon = Object.entries(productFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  res.json({
    active_users: stats.activeUsers.size,
    most_selected_product: mostCommon,
    last_check: new Date().toISOString()
  });
});

app.listen(port, () => console.log(`🚀 Express server running on port ${port}`));

// ==============
// 🔑 BOT TOKEN
// ==============
const token = process.env.BOT_TOKEN || 'PASTE_YOUR_TOKEN_HERE';

if (!token) {
  console.error("❌ BOT_TOKEN not found in environment variables!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// ========================
// 📊 Bot Statistics
// ========================
const stats = {
  activeUsers: new Set(),
  selectedProducts: []
};

// ============
// 🔗 FIXED LINKS
// ============
const SUPPORT_USERNAME = '@vendospay';
const GROUP_LINK = 'https://t.me/+JPyEZ5JQ1h4zYmY5';

console.log('🤖 Bot is running...');

// ====================
// 📦 Product List
// ====================
const products = {
  'lizzy_and_bro': { name: 'Lizzy And Bro', price: 25, videoPath: './Previas/lizzy.mp4' },
  'savannah': { name: 'Savannah', price: 30, videoPath: './Previas/savannah.mp4' },
  'amelia_blonde': { name: 'Amelia Blonde', price: 35, videoPath: './Previas/amelia_blonde.mp4' },
  'ivanka_and_bro': { name: 'Ivanka And Bro', price: 28, videoPath: './Previas/ivanka_and_bro.mp4' },
  'abbi': { name: 'Abbi', price: 22, videoPath: './Previas/abbi.mp4' },
  'anita': { name: 'Anita', price: 28, videoPath: './Previas/anita.mp4' },
  'darkzadie': { name: 'Darkzadie', price: 23, videoPath: './Previas/darkzadie.mp4' },
  'desire_garcia': { name: 'Desire Garcia', price: 20, videoPath: './Previas/desire_garcia.mp4' },
  'cp1': { name: 'CP1', price: 35, videoPath: './Previas/cp1.mp4' },
  'cp2': { name: 'CP2', price: 38, videoPath: './Previas/cp2.mp4' },
  'cp3': { name: 'CP3', price: 42, videoPath: './Previas/cp3.mp4' },
  'cp4': { name: 'CP4', price: 48, videoPath: './Previas/cp4.mp4' },
  'baby_ashlee': { name: 'Baby Ashlee', price: 28, videoPath: './Previas/babyashlee.mp4' },
  'anxious_panda': { name: 'Anxious Panda', price: 32, videoPath: './Previas/panda.mp4' },
  'izzy': { name: 'Izzy', price: 38, videoPath: './Previas/izzy.mp4' },
};

const nameToKey = {};
Object.keys(products).forEach(key => {
  nameToKey[products[key].name.toLowerCase()] = key;
});

const methods = ['paypal', 'binance', 'checkout', 'giftcard'];
const states = {};

// ==============
// 🔁 Helper Functions
// ==============
function resetState(chatId) {
  states[chatId] = { step: 'awaiting_product' };
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function handleProductSelection(chatId, productKey) {
  const prod = products[productKey];
  states[chatId] = { step: 'awaiting_method', product: productKey };
  stats.selectedProducts.push(productKey);

  const msgText = `✨ You selected: *${prod.name}* — *${formatPrice(prod.price)}*\n\nPlease choose a payment method below:`;

  bot.sendMessage(chatId, msgText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💳 PayPal', callback_data: 'method_paypal' }],
        [{ text: '🪙 Binance', callback_data: 'method_binance' }],
        [{ text: '💼 Checkout', callback_data: 'method_checkout' }],
        [{ text: '🎁 Gift Card', callback_data: 'method_giftcard' }]
      ]
    }
  });
}

function confirmPayment(chatId) {
  const currentState = states[chatId];
  if (!currentState || !currentState.product) return;

  const prod = products[currentState.product];
  bot.sendMessage(chatId,
`✅ *Payment confirmed!*

Thanks for purchasing *${prod.name}*. 🎉

📩 Please send your proof of payment and the product name to our support:
👉 [Contact Support](https://t.me/${SUPPORT_USERNAME.replace('@', '')})

📝 Example:  
\\I paid for ${prod.name}\\`, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });

  resetState(chatId);
}

// =========================
// ▶️ /start command
// =========================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetState(chatId);
  stats.activeUsers.add(chatId);

  const productButtons = Object.values(products).map(p => [{
    text: `${p.name} — ${formatPrice(p.price)}`,
    callback_data: `product_${nameToKey[p.name.toLowerCase()]}`
  }]);

  const topButtons = [
    [
      { text: '📢 Product Group', url: GROUP_LINK },
      { text: '🛎️ Support', url: `https://t.me/${SUPPORT_USERNAME.replace('@', '')}` }
    ]
  ];

  const welcomeMsg =
`👋 *Welcome to Best Services Store!*

📦 Select a product below to see previews and payment options.

❓ If you have questions, click the *Support* button below.`;

  bot.sendMessage(chatId, welcomeMsg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [...topButtons, ...productButtons]
    }
  });
});

// ==============================
// 💬 Text fallback messages
// ==============================
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
      handleProductSelection(chatId, productKey);
    } else {
      bot.sendMessage(chatId,
`❌ Product not found. Please double-check the name or click one of the buttons.

🛎️ Need help? Contact support: ${SUPPORT_USERNAME}`);
    }
  } else if (currentState.step === 'awaiting_confirmation') {
    if (text === 'confirm') {
      confirmPayment(chatId);
    } else {
      bot.sendMessage(chatId, `⌛ Waiting for confirmation. Type *confirm* after sending the payment.`, {
        parse_mode: 'Markdown'
      });
    }
  }
});

// =========================
// 🔘 Inline Button Callbacks
// =========================
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  const currentState = states[chatId] || {};

  if (data.startsWith('product_')) {
    const productKey = data.replace('product_', '');
    if (products[productKey]) {
      handleProductSelection(chatId, productKey);
    }
    return bot.answerCallbackQuery(callbackQuery.id);
  }

  if (data.startsWith('method_')) {
    const method = data.replace('method_', '');
    if (!methods.includes(method)) {
      return bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid method.' });
    }

    currentState.method = method;
    currentState.step = 'awaiting_confirmation';
    states[chatId] = currentState;

    const prod = products[currentState.product];

    let reply =
`🧾 *Order Summary:*

• Product: *${prod.name}*  
• Price: *${formatPrice(prod.price)}*  
• Payment Method: *${method.toUpperCase()}*\n\n`;

    if (method === 'paypal') {
      reply += `💳 *PayPal Payment*\n\n[CLICK TO BUY NOW](https://www.paypal.com/ncp/payment/FHB2D9HYLWMNU)\n\nThen type *confirm* once done.`;
    } else if (method === 'binance') {
      reply += `🪙 *Binance Payment*\n\n• BTC: \`bc1qs4wy29fp4jh49x40hcnduatftkewu6nk5da8tk\`  
• USDT: \`0x8B2Eb4C56dFC583edb11109821212b0bb91faE04\`\n\nThen type *confirm* once done.`;
    } else if (method === 'checkout') {
      reply += `💼 *Checkout Payment*\n\n[Contact support](https://t.me/${SUPPORT_USERNAME.replace('@', '')}) to receive your invoice via CashApp / Apple Pay.`;
    } else if (method === 'giftcard') {
      reply += `🎁 *Gift Card Payment*\n\nBuy a REWARBLE gift card and send it here (${SUPPORT_USERNAME}) to receive your product.`;
    }

    bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    return bot.answerCallbackQuery(callbackQuery.id);
  }

  if (data === 'confirm_payment') {
    if (currentState.step === 'awaiting_confirmation') {
      confirmPayment(chatId);
    } else {
      bot.sendMessage(chatId, '❌ No payment to confirm right now.');
    }
    return bot.answerCallbackQuery(callbackQuery.id);
  }
  // ========== Gamificação - Sistema de Pontos ===========
const userPoints = {};

function addPoints(chatId, points) {
  if (!userPoints[chatId]) userPoints[chatId] = 0;
  userPoints[chatId] += points;
}

function checkPoints(chatId) {
  return userPoints[chatId] || 0;
}

// Atualize confirmPayment para adicionar pontos
function confirmPayment(chatId) {
  const currentState = states[chatId];
  if (!currentState || !currentState.product) return;

  const prod = products[currentState.product];
  bot.sendMessage(chatId,
`✅ *Payment confirmed!*

Thanks for purchasing *${prod.name}*. 🎉

You earned 10 points for this purchase!

📩 Please send your proof of payment and the product name to our support:
👉 [Contact Support](https://t.me/${SUPPORT_USERNAME.replace('@', '')})`, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });

  addPoints(chatId, 10); // 10 pontos por compra
  resetState(chatId);
}

// Comando para o usuário consultar pontos
bot.onText(/\/points/, (msg) => {
  const chatId = msg.chat.id;
  const pts = checkPoints(chatId);
  bot.sendMessage(chatId, `Você tem *${pts}* pontos acumulados! 🎉`, { parse_mode: 'Markdown' });
});


// ========== Notificações Personalizadas ===========

// Função para enviar broadcast para todos usuários ativos
function sendBroadcast(message) {
  stats.activeUsers.forEach(chatId => {
    bot.sendMessage(chatId, message);
  });
}

// Defina seu chatId admin aqui para controle do comando
const ADMIN_CHAT_ID = 123456789; // substitua pelo seu Telegram chatId

// Comando para enviar promoções (só admin)
bot.onText(/\/promo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const promoMsg = match[1];

  if (chatId === ADMIN_CHAT_ID) {
    sendBroadcast(`🎉 PROMOÇÃO: ${promoMsg}`);
    bot.sendMessage(chatId, 'Promoção enviada para todos os usuários!');
  } else {
    bot.sendMessage(chatId, '❌ Você não tem permissão para usar este comando.');
  }
});


  bot.answerCallbackQuery(callbackQuery.id);
});

