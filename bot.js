// ===================================
// 🤖 กาก้าบอท - เพื่อนแท้ + ที่ปรึกษา
// LINE Bot + Gemini AI
// ===================================

const express = require('express');
const { Client } = require('@line/bot-sdk');
const cron = require('node-cron');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);
const app = express();
let USER_ID = process.env.LINE_USER_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ===== เรียกใช้ Gemini AI =====
async function askGemini(userMessage) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      system_instruction: {
        parts: [{
          text: `คุณคือ "กาก้าบอท" เพื่อนแท้และที่ปรึกษาส่วนตัวในไลน์

บุคลิก:
- ถ้าผู้ใช้คุยเล่น ตลก ไม่จริงจัง → ตอบสนุกๆ มีมุก ใช้ภาษาวัยรุ่น มีอิโมจิ
- ถ้าผู้ใช้ถามจริงจัง เช่น งาน สุขภาพ การเงิน → ตอบฉลาด จริงจัง ให้คำแนะนำดีๆ
- พูดภาษาไทยเสมอ
- ตอบสั้นกระชับ เหมาะกับไลน์`
        }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Gemini status:', response.status);

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    console.log('Gemini error:', JSON.stringify(data?.error));
    return 'ขอโทษนะ บอทงงนิดนึง ลองใหม่ได้เลย 😅';

  } catch (err) {
    console.log('fetch error:', err.message);
    return 'ขอโทษนะ บอทมีปัญหาซักครู่ ลองใหม่ได้เลย 😅';
  }
}

// ===== ข้อความแจ้งเตือนประจำวัน =====
const messages = {
  wake: [
    "🌅 ตี 6 แล้วนะจ๊ะ!! ลืมตาได้แล้ว อย่านอนต่ออีกแล้วนะ 😤",
    "☀️ อรุณสวัสดิ์!! โลกหมุนรอเธออยู่นะ ตื่นได้แล้ว!",
    "🐓 ไก่ขันแล้ว!! (บอทขันแทน) ตื่นเช้าวันนี้ก็เก่งแล้ว 💪",
    "🌄 6 โมงเช้า วันใหม่มาแล้ว! วันนี้จะดีกว่าเมื่อวันแน่นอน ✨",
    "😴➡️😎 ได้เวลาเปลี่ยนโหมดจากนอนหลับเป็นพิชิตโลกแล้ว!",
    "🔔 เช้าแล้วจ้า! หายใจเข้าลึกๆ แล้วลุกขึ้นมาสู้ชีวิต!",
    "🌞 Good Morning!! บอทรอเธออยู่นะ ลุกขึ้นมาสู้ๆ เลย!",
  ],
  product: [
    "📦 19:30 แล้ว! ลงสินค้าวันนี้ยัง? อย่าลืมนะ ลูกค้ารอซื้ออยู่! 🛒",
    "🏪 ได้เวลาลงสินค้าแล้ว วันนี้จะลงอะไรดี? รีบๆ หน่อยนะ 😄",
    "💰 สินค้า 1 ชิ้นต่อวัน = รายได้เพิ่มขึ้นทุกวัน! ลงเลยนะ 🚀",
    "📸 ถ่ายรูปสวยๆ เขียนแคปชั่นปัง แล้วลงขายเลย! บอทเชียร์อยู่ 📣",
    "🛍️ ของดีต้องโชว์! ลงสินค้าวันนี้ซะ อย่าเก็บไว้คนเดียวนะ 😆",
    "⏰ 19:30 แล้ว คนออนไลน์เยอะมาก! รีบลงสินค้าก่อนใครเลย 🔥",
    "🎯 Mission ตอนเย็น: ลงสินค้า 1 ชิ้น ทำได้ = วันนี้สำเร็จแล้ว! ✅",
  ],
  lunch: [
    "🍱 เที่ยงแล้ว! อย่าลืมกินข้าวนะ กินของมีประโยชน์ด้วย ไม่ใช่แค่ขนม 😅",
    "🥗 12 โมงตรง! กินผักด้วยนะ ไม่ใช่แค่ข้าวขาวล้วน 🙏",
    "🍚 ถึงเวลากินข้าวแล้ว! เลือกอาหารดีๆ ให้ร่างกายหน่อยนะ 💚",
    "🌿 โปรตีน + ผัก = พลังงานทั้งบ่าย! ไปกินข้าวได้เลย 💪",
    "🍜 พักกินข้าวได้แล้ว! ลองกินอะไรที่มีประโยชน์หน่อยได้มั้ย? 🥺",
    "🥦 เที่ยงแล้วจ้า! กินข้าวด้วยนะ ขอผักหน่อยนึงก็ยังดี 555",
    "🍳 อาหารดี = สุขภาพดี = ชีวิตดี! เลือกดีๆ ด้วยนะ ✨",
  ],
  exercise: [
    "🏃 17:15 แล้ว! ออกกำลังกายแล้วรึยัง? ลุกขึ้นมาตอนนี้เลย! 💪",
    "🔥 ได้เวลาขยับร่างกายแล้ว! แค่ 20-30 นาที ก็ดีกว่าไม่ทำเลยนะ 🏋️",
    "😤 ยังไม่ได้ออกกำลังกายเลยนะวันนี้ ลุกมาเลย!",
    "🚶 เดินแค่ 10 นาทีก็ยังดี! ดีกว่านอนดูซีรีส์ 555",
    "💦 เหงื่อออกซักหน่อยนะ! ร่างกายจะขอบคุณมากเลย 🏆",
    "🎯 ออกกำลังกายวันนี้แล้วรึยัง? ถ้ายัง = ไปเลย! 🚀",
    "🌟 คนที่ออกกำลังกายทุกวัน ชีวิตดีกว่าแน่นอน! 😄",
  ],
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pushMsg = (text) => {
  if (!USER_ID) return;
  return client.pushMessage(USER_ID, { type: 'text', text });
};

// ===== CRON JOBS =====
cron.schedule('0 6 * * *',   () => pushMsg(rand(messages.wake)),     { timezone: 'Asia/Bangkok' });
cron.schedule('0 12 * * *',  () => pushMsg(rand(messages.lunch)),    { timezone: 'Asia/Bangkok' });
cron.schedule('15 17 * * *', () => pushMsg(rand(messages.exercise)), { timezone: 'Asia/Bangkok' });
cron.schedule('30 19 * * *', () => pushMsg(rand(messages.product)),  { timezone: 'Asia/Bangkok' });

// ===== WEBHOOK =====
app.use('/webhook', express.json());

app.post('/webhook', async (req, res) => {
  res.json({ status: 'ok' });

  const events = req.body?.events || [];
  console.log(`📨 ได้รับ ${events.length} events`);

  for (const event of events) {
    if (event.source?.userId) {
      USER_ID = event.source.userId;
    }

    if (event.type === 'follow') {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🎉 สวัสดี! กาก้าบอทพร้อมแล้ว! 💚\n\nจะแจ้งเตือนทุกวัน:\n🌅 06:00 - ปลุกตื่น\n🍱 12:00 - เตือนกินข้าว\n🏃 17:15 - เตือนออกกำลังกาย\n📦 19:30 - เตือนลงสินค้า\n\nถามอะไรก็ได้นะ บอทตอบทุกเรื่อง! 🤖'
      });
      continue;
    }

    if (event.type === 'message' && event.message?.type === 'text') {
      const userText = event.message.text.trim();
      console.log('ข้อความ:', userText);

      const aiReply = await askGemini(userText);
      console.log('AI ตอบ:', aiReply.substring(0, 50));

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: aiReply
      });
    }
  }
});

app.get('/', (req, res) => res.send('🤖 กาก้าบอท กำลังทำงานอยู่!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 กาก้าบอท รันที่ port ${PORT}`));
