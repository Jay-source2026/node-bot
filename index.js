// ==========================
// 🤖 BOT DE VENDAS TELEGRAM
// ==========================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Página inicial do servidor
app.get('/', (req, res) => res.send('Bot is alive!'));

// Rota de status (útil para monitoramento)
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
// 🔑 TOKEN DO BOT
// ==============
const token = process.env.BOT_TOKEN || 'COLOQUE_SEU_TOKEN_AQUI';

if (!token) {
  console.error("❌ BOT_TOKEN not found in environment variables!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// ========================
// 📊 Estatísticas do Bot
// ========================
const stats = {
  activeUsers: new Set(),
  selectedProducts: []
};

// ============
// 🔗 LINKS FIXOS
// ============
const SUPPORT_USERNAME = '@oficialsellerr'; // Suporte do Telegram
const GROUP_LINK = 'https://t.me/seugrupo_aqui'; // <-- EDITAR AQUI quando você tiver o link do grupo

console.log('🤖 Bot is running...');

// ====================
// 📦 Lista de Produtos
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

// Para reconhecer nomes digitados manualmente
const nameToKey = {};
Object.keys(products).forEach(key => {
  nameToKey[products[key].name.toLowerCase()] = key;
});

const methods = ['paypal', 'binance', 'checkout'];
const states = {};

// ==============
// 🔁 Funções Úteis
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
        [{ text: '💼 Checkout', callback_data: 'method_checkout' }]
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

📩 Please send proof of payment along with the product name to receive your order:
👉 [Contact Support](https://t.me/${@oficialsellerr.replace('@', '')})

📝 Example:  
\\I paid for ${prod.name}\\`, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });

  resetState(chatId);
}

// =========================
// ▶️ Comando /start atualizado
// =========================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetState(chatId);
  stats.activeUsers.add(chatId);

  const productButtons = Object.values(products).map(p => [{
    text: `${p.name} — ${formatPrice(p.price)}`,
    callback_data: `product_${nameToKey[p.name.toLowerCase()]}`
  }]);

  // Botões de Suporte e Grupo no topo
  const topButtons = [
    [
      { text: '📢 Previews Group', url: GROUP_LINK },
      { text: '🛎️ Support', url: `https://t.me/${@oficialsellerr.replace('@', '')}` }
    ]
  ];

  const welcomeMsg =
`👋 *Welcome to Best Services Store!*

📦 Choose a product below to view previews and payment methods.

❓ If you have any questions, contact us using the *Support* button below.`;

  bot.sendMessage(chatId, welcomeMsg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [...topButtons, ...productButtons]
    }
  });
});

// ==============================
// 💬 Mensagens manuais (fallback)
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
      // ❗ Produto não encontrado → mostra link do suporte
      bot.sendMessage(chatId,
`❌ Produto não encontrado. Verifique se digitou corretamente ou clique em um dos botões.

🛎️ Se precisar de ajuda, fale com nosso suporte: ${SUPPORT_USERNAME}`);
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
// 🔘 Botões Inline Callback
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

  bot.answerCallbackQuery(callbackQuery.id);
});

