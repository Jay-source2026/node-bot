require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(port, () => console.log(`Express server running on port ${port}`));

const token = process.env.BOT_TOKEN;'7567384896:AAHBlzaVtx_KXnO2THaepTWw2ne5KcWM6Vk'
if (!token) {
  console.error("❌ BOT_TOKEN not found in environment variables!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('🤖 Bot is running...');

const products = {
  'lizzy_and_bro': { name: 'Lizzy And Bro', price: 25, videoPath: './Previas/lizzy.mp4' },
  'savannah': { name: 'Savannah', price: 30, videoPath: './Previas/savannah.mp4' },
  'amelia_blonde': { name: 'Amelia Blonde', price: 35, videoPath: 'https://bescontent.shop/Previas/amelia_blonde.mp4' },
  'ivanka_and_bro': { name: 'Ivanka And Bro', price: 28, videoPath: 'https://bescontent.shop/Previas/ivanka_and_bro.mp4' },
  'abbi': { name: 'Abbi', price: 22, videoPath: 'https://bescontent.shop/Previas/abbi.mp4' },
  'anita': { name: 'Anita', price: 28, videoPath: 'https://bescontent.shop/Previas/anita.mp4' },
  'darkzadie': { name: 'Darkzadie', price: 23, videoPath: 'https://bescontent.shop/Previas/darkzadie.mp4' },
  'desire_garcia': { name: 'Desire Garcia', price: 20, videoPath: 'https://bescontent.shop/Previas/desire_garcia.mp4' },
  'cp1': { name: 'CP1', price: 35, videoPath: 'https://bescontent.shop/Previas/cp1.mp4' },
  'cp2': {  name: 'CP2',   price: 38, videoPath: 'https://bescontent.shop/Previas/cp2.mp4'},
  'cp3': { name: 'CP3', price: 42, videoPath: 'https://bescontent.shop/Previas/cp3.mp4'},
  'cp4': { name: 'CP4', price: 48, videoPath: 'https://bescontent.shop/Previas/cp4.mp4' },
  'baby_ashlee': { name: 'Baby Ashlee', price: 28, videoPath: 'https://bescontent.shop/Previas/babyashlee.mp4'},
  'anxious_panda': { name: 'Anxious Panda', price: 32, videoPath: 'https://bescontent.shop/Previas/panda.mp4' },
  'izzy': { name: 'Izzy', price: 38, videoPath: 'https://bescontent.shop/Previas/izzy.mp4'},
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

// Função para resetar estado do usuário
function resetState(chatId) {
  states[chatId] = { step: 'awaiting_product' };
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

// Comando /start
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

// Escuta mensagens texto (fluxo principal)
bot.on('message', (msg) => {
  if (!msg.text) return; // Ignora mensagens sem texto

  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase().trim();

  if (text.startsWith('/')) return; // Ignora comandos (menos /start que é tratado)

  if (!states[chatId]) {
    return bot.sendMessage(chatId, '⚠️ Please type /start to begin.');
  }

  const currentState = states[chatId];

  if (currentState.step === 'awaiting_product') {
    const productKey = nameToKey[text];

    if (productKey && products[productKey]) {
      const prod = products[productKey];
      currentState.product = productKey;
      currentState.step = 'awaiting_interest';

      if (prod.videoPath) {
        bot.sendVideo(chatId, fs.createReadStream(prod.videoPath))
          .then(() => {
            bot.sendMessage(chatId, `💬 *Interested in buying ${prod.name}?*`, {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✅ Yes', callback_data: 'interested_yes' },
                    { text: '❌ No', callback_data: 'interested_no' }
                  ]
                ]
              }
            });
          })
          .catch(err => {
            console.error('Error sending video preview:', err);
            bot.sendMessage(chatId, '⚠️ Could not load the product preview.');
          });
      } else {
        bot.sendMessage(chatId, `💬 *Interested in buying ${prod.name}?*`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Yes', callback_data: 'interested_yes' },
                { text: '❌ No', callback_data: 'interested_no' }
              ]
            ]
          }
        });
      }

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

      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown', disable_web_page_preview: false });
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

// Callback query (botões inline)
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  const currentState = states[chatId];
  if (!currentState) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: 'Type /start to begin.' });
  }

  if (currentState.step === 'awaiting_interest') {
    if (data === 'interested_yes') {
      currentState.step = 'awaiting_method';
      const prod = products[currentState.product];

      const methodMsg = 
`✨ You selected: *${prod.name}* — *${formatPrice(prod.price)}*.

Please choose a payment method:

💳 *paypal*  
🪙 *binance*  
💼 *checkout*`;

      bot.sendMessage(chatId, methodMsg, { parse_mode: 'Markdown' });
      bot.answerCallbackQuery(callbackQuery.id);

    } else if (data === 'interested_no') {
      bot.sendMessage(chatId,
`😌 No problem!

Thanks for checking out our products. You're always welcome back.

🛒 Here are the available products again:`);

      resetState(chatId);
      bot.answerCallbackQuery(callbackQuery.id);

      bot.emit('text', { chat: { id: chatId }, text: '/start' });
    }
  }
});


