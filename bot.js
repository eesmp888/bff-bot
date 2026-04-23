// ===================================
// 🤖 BFF BOT - กาก้า เพื่อนแท้ในไลน์
// ===================================

const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const cron = require('node-cron');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);
const app = express();
let USER_ID = process.env.LINE_USER_ID || '';

// ===== ข้อความแจ้งเตือน =====

const messages = {

  // ⏰ 06:00 - ปลุก
  wake: [
    "🌅 ตี 6 แล้วนะจ๊ะ!! ลืมตาได้แล้ว อย่านอนต่ออีกแล้วนะ 😤",
    "☀️ อรุณสวัสดิ์!! โลกหมุนรอเธออยู่นะ ตื่นได้แล้ว!",
    "🐓 ไก่ขันแล้ว!! (บอทขันแทน) ตื่นเช้าวันนี้ก็เก่งแล้ว 💪",
    "🌄 6 โมงเช้า วันใหม่มาแล้ว! วันนี้จะดีกว่าเมื่อวันแน่นอน ✨",
    "😴➡️😎 ได้เวลาเปลี่ยนโหมดจากนอนหลับเป็นพิชิตโลกแล้ว!",
    "🔔 ดิ้งดง! เช้าแล้วจ้า หายใจเข้าลึกๆ แล้วลุกขึ้นมาสู้ชีวิต!",
    "🌞 Good Morning!! บอทรอเธออยู่นะ ลุกขึ้นมาสู้ๆ เลย!",
  ],

  // 🛍️ 19:30 - ลงสินค้า
  product: [
    "📦 19:30 แล้ว! ลงสินค้าวันนี้ยัง? อย่าลืมนะ ลูกค้ารอซื้ออยู่! 🛒",
    "🏪 เฮ้! ได้เวลาลงสินค้าแล้ว วันนี้จะลงอะไรดี? รีบๆ หน่อยนะ 😄",
    "💰 สินค้า 1 ชิ้นต่อวัน = รายได้เพิ่มขึ้นทุกวัน! ลงเลยนะ 🚀",
    "📸 ถ่ายรูปสวยๆ เขียนแคปชั่นปัง แล้วลงขายเลย! บอทเชียร์อยู่ 📣",
    "🛍️ ของดีต้องโชว์! ลงสินค้าวันนี้ซะ อย่าเก็บไว้คนเดียวนะ 😆",
    "⏰ 19:30 แล้ว ตอนนี้คนออนไลน์เยอะมาก! รีบลงสินค้าก่อนใครเลย 🔥",
    "🎯 Mission ตอนเย็น: ลงสินค้า 1 ชิ้น ทำได้ = วันนี้สำเร็จแล้ว! ✅",
  ],

  // 🥗 12:00 - กินข้าว
  lunch: [
    "🍱 เที่ยงแล้ว! อย่าลืมกินข้าวนะ และกินของมีประโยชน์ด้วยนะ ไม่ใช่แค่ขนม 😅",
    "🥗 12 โมงตรง! ร่างกายต้องการพลังงาน กินผักด้วยนะ ไม่ใช่แค่ข้าวขาวล้วน 🙏",
    "🍚 หิวหรือยัง? ถึงเวลากินข้าวแล้ว! เลือกอาหารดีๆ ให้ร่างกายหน่อยนะ 💚",
    "🌿 กินข้าวกลางวันแล้วหรือยัง? จำไว้นะ โปรตีน + ผัก = พลังงานทั้งบ่าย! 💪",
    "🍜 พักกินข้าวได้แล้ว! วันนี้ลองกินอะไรที่มีประโยชน์หน่อยได้มั้ย? บอทขอร้อง 🥺",
    "🥦 เที่ยงแล้วจ้า! กินข้าวด้วยนะ อย่างน้อยขอผักหน่อยนึงก็ยังดี 555",
    "🍳 อาหารดี = สุขภาพดี = ชีวิตดี! ไปกินข้าวได้แล้วนะ เลือกดีๆ ด้วย ✨",
  ],

  // 🏃 17:15 - ออกกำลังกาย
  exercise: [
    "🏃 17:15 แล้ว! ออกกำลังกายแล้วรึยัง? ถ้ายัง = ลุกขึ้นมาตอนนี้เลย! 💪",
    "🔥 ได้เวลาขยับร่างกายแล้ว! แค่ 20-30 นาที ก็ดีกว่าไม่ทำเลยนะ 🏋️",
    "😤 อย่าบอกว่าเหนื่อยแล้ว! ยังไม่ได้ออกกำลังกายเลยนะวันนี้ ลุกมาเลย!",
    "🚶 เดินแค่ 10 นาทีก็ยังดี! ดีกว่านอนดูซีรีส์ (แต่ก็ดูได้หลังออกกำลังกาย 555)",
    "💦 เหงื่อออกซักหน่อยนะ! ร่างกายจะขอบคุณเธอมากเลย บอทรับประกัน 🏆",
    "🎯 ออกกำลังกายวันนี้แล้วรึยัง? ถ้ายังไม่ได้ทำ = นี่คือสัญญาณ! ไปเลย! 🚀",
    "🌟 คนที่ออกกำลังกายทุกวัน ชีวิตดีกว่าคนที่ไม่ออก... บอทพูดเองแต่จริงนะ! 😄",
  ],
};

// สุ่มข้อความ
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ส่งข้อความ
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
app.post('/webhook', middleware(config), (req, res) => {
  res.json({ status: 'ok' });

  req.body.events.forEach(event => {
    if (event.source && event.source.userId) {
      USER_ID = event.source.userId;
    }

    if (event.type === 'follow') {
      client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🎉 สวัสดี! กาก้าบอทพร้อมเป็นเพื่อนแท้แล้ว! 💚\n\nบอทจะแจ้งเตือนคุณทุกวันดังนี้:\n🌅 06:00 - ปลุกตื่น\n🍱 12:00 - เตือนกินข้าว\n🏃 17:15 - เตือนออกกำลังกาย\n📦 19:30 - เตือนลงสินค้า\n\nพิมพ์ "ช่วย" เพื่อดูคำสั่งทั้งหมด!'
      });
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.toLowerCase().trim();
      let reply = '😄 พิมพ์ "ช่วย" เพื่อดูคำสั่งทั้งหมดนะ!';

      if (text.includes('ช่วย') || text === 'help') {
        reply = '🤖 กาก้าบอทช่วยได้เรื่อง:\n\n🌅 พิมพ์ "ปลุก" - ทดสอบข้อความตื่นเช้า\n🍱 พิมพ์ "ข้าว" - ทดสอบเตือนกินข้าว\n🏃 พิมพ์ "exercise" - ทดสอบเตือนออกกำลังกาย\n📦 พิมพ์ "สินค้า" - ทดสอบเตือนลงสินค้า';
      } else if (text.includes('ปลุก') || text.includes('เช้า')) {
        reply = rand(messages.wake);
      } else if (text.includes('ข้าว') || text.includes('กิน')) {
        reply = rand(messages.lunch);
      } else if (text.includes('exercise') || text.includes('ออกกำลัง') || text.includes('วิ่ง')) {
        reply = rand(messages.exercise);
      } else if (text.includes('สินค้า') || text.includes('ลงของ')) {
        reply = rand(messages.product);
      }

      client.replyMessage(event.replyToken, { type: 'text', text: reply });
    }
  });
});

app.get('/', (req, res) => res.send('🤖 กาก้าบอท กำลังทำงานอยู่!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 กาก้าบอท รันที่ port ${PORT}`));
