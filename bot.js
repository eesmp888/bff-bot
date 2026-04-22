// ===================================
// 🤖 BFF BOT - เพื่อนแท้ในไลน์
// Node.js + LINE Messaging API
// ===================================

const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const cron = require('node-cron');

// ===== ตั้งค่า LINE =====
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);
const app = express();

// USER_ID จะถูกบันทึกอัตโนมัติเมื่อมีคนส่งข้อความมา
let USER_ID = process.env.LINE_USER_ID || '';

// ===== ข้อความแจ้งเตือน =====
const messages = {
  morning: [
    "อรุณสวัสดิ์!! ☀️ ตื่นหรือยัง? ถ้ายัง = ทำไมยังอ่านไลน์อยู่ 555",
    "กุ๊ดมอร์นิ่ง! 🌅 วันนี้จะเป็นวันดี... ถ้าตื่นนอนซะที!",
    "โอ้โห ตื่นแล้วหรอ! เก่งมากเลย 🏆 ตาแฉะอยู่ใช่มั้ย ไม่เป็นไร สู้ๆ",
    "เช้าแล้วจ้า! ☕ วันนี้มีภารกิจรอคุณอยู่นะ พร้อมหรือยัง?"
  ],
  water: [
    "💧 ดื่มน้ำด้วยน้า! ไม่งั้นแห้งเหมือนทะเลทราย",
    "น้ำ 8 แก้วต่อวันน้า 💦 ตอนนี้ดื่มไปกี่แก้วแล้ว? (อย่าโกหกนะ 👀)",
    "H2O time! 💧 สมองทำงานดีขึ้นถ้าดื่มน้ำเพียงพอนะ",
    "เฮ้! ดื่มน้ำหน่อยสิ 🥤 บอทเป็นห่วงจริงๆ ไม่ได้แค่พูด",
    "หยุดทำงานแป๊บนึง แล้วหยิบน้ำขึ้นมาดื่ม 💧 ทำได้เลย!"
  ],
  task: [
    "📋 วันนี้มี Task รออยู่นะ! มาลุยกันเถอะ ไม่งั้นค้างถึงพรุ่งนี้นะจ๊ะ",
    "To-do list ของวันนี้ 📝 อย่าลืมทำนะ บอทจับตาดูอยู่ 😤",
    "เช้าแล้ว วางแผนวันนี้กันก่อนนะ 📋 จะได้ไม่วุ่นวาย!"
  ],
  taskEvening: [
    "ใกล้เย็นแล้ว 🌆 Task วันนี้ทำครบหรือยัง? ถ้าครบ = เก่งมาก! ถ้าไม่ครบ = พรุ่งนี้สู้ใหม่ 555",
    "ก่อนเลิกงาน เช็คลิสต์หน่อยนะ ✅ ทำครบมั้ย?",
    "สรุปวันนี้หน่อย 📊 ทำอะไรสำเร็จบ้าง? บอทอยากรู้!"
  ],
  lunch: [
    "🍜 พักกินข้าวได้แล้ว! อย่าลืมออกจากหน้าจอบ้างนะ ตาจะแตก",
    "เที่ยงแล้วจ้า 🌮 กินข้าวอร่อยๆ แล้วกลับมา productive ต่อนะ!",
    "หิวข้าวหรือยัง? 🍱 ถึงเวลากินแล้ว อย่าอดนะ ไม่ดีต่อสุขภาพ!",
    "Break time! 🥗 ลุกออกจากเก้าอี้ด้วยนะ ไม่ใช่กินหน้าจออีก 555"
  ],
  money: [
    "💰 บันทึกรายจ่ายวันนี้หน่อยน้า ออมเงินด้วย ไม่งั้นแก่ตัวไปจะได้ไม่ยากจน (พูดตรงๆ นะ)",
    "เงินออม = อิสรภาพ 💵 วันนี้โอนเงินเก็บแล้วหรือยัง? ถ้ายัง = ทำเดี๋ยวนี้เลย!",
    "วันนี้ใช้เงินไปเท่าไหร่? 💳 จดไว้นะ พรุ่งนี้จะได้ไม่งงว่าเงินหายไปไหน",
    "ออมเงินวันละนิดก็รวยได้นะ 🐷 แค่วันละ 50 บาท เดือนนึงก็ 1,500 แล้ว!"
  ],
  sleep: [
    "😴 วางโทรศัพท์ได้แล้ว... แต่ถ้าอ่านข้อความนี้อยู่ก็คือยังไม่วางใช่มั้ย 555",
    "นอนได้แล้วน้า 🌙 พรุ่งนี้จะได้ตื่นสดชื่น ไม่งัวเงียเหมือนทุกวัน!",
    "22:30 แล้ว! 🛏️ นอนซะ สุขภาพดีต้องนอนพักผ่อนเพียงพอนะ",
    "ราตรีสวัสดิ์! 🌟 วางโทรศัพท์ แล้วนอนหลับฝันดีนะ พรุ่งนี้สู้ใหม่!"
  ],
  exercise: [
    "🏃 ขยับแขนขาหน่อย! แค่ 15 นาทีก็โอเค ดีกว่านอนดูซีรีส์ (แต่ก็ได้เหมือนกัน 555)",
    "ออกกำลังกายน้า 💪 ร่างกายคุณขอบคุณนะ แม้ว่าจะไม่รู้สึกอยากทำเลย",
    "เดินแค่ 10 นาทีก็ยังดี 🚶 ลุกจากเก้าอี้ก่อนเลย!",
    "Workout time! 🏋️ ร่างกายที่แข็งแรง = ชีวิตที่ดี ไปๆ!"
  ],
  quote: [
    "✨ คำคมวันนี้: 'ทุกวันที่ตื่นนอนได้คือชัยชนะแล้ว' - บอทผู้ชาญฉลาด",
    "🧘 Mindfulness ประจำวัน: หายใจเข้า... หายใจออก... ก็ยังต้องทำงานอยู่ดี 🫠",
    "💭 'ความสำเร็จคือการทำสิ่งเดิม แต่แย่น้อยลงทุกวัน' - บอทที่เป็นนักปรัชญา",
    "🌈 วันนี้จะยากแค่ไหนก็ผ่านได้! เชื่อบอทเถอะ บอทไม่เคยโกหก (มากนัก)",
    "⭐ 'คนที่ประสบความสำเร็จ ไม่ใช่คนที่ไม่ล้ม แต่คือคนที่ล้มแล้วลุกได้' - คนฉลาดบางคน"
  ]
};

// สุ่มข้อความ
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ส่งข้อความหาผู้ใช้
const pushMsg = (text) => {
  if (!USER_ID) {
    console.log('ยังไม่มี USER_ID! ส่งข้อความหาบอทใน LINE ก่อนนะ');
    return;
  }
  return client.pushMessage(USER_ID, { type: 'text', text });
};

// ===== CRON JOBS - ตั้งเวลาแจ้งเตือน (timezone Asia/Bangkok) =====
cron.schedule('0 7 * * *',  () => pushMsg(rand(messages.morning)),    { timezone: 'Asia/Bangkok' });
cron.schedule('30 8 * * *', () => pushMsg(rand(messages.task)),       { timezone: 'Asia/Bangkok' });
cron.schedule('0 9 * * *',  () => pushMsg(rand(messages.water)),      { timezone: 'Asia/Bangkok' });
cron.schedule('0 11 * * *', () => pushMsg(rand(messages.water)),      { timezone: 'Asia/Bangkok' });
cron.schedule('0 12 * * *', () => pushMsg(rand(messages.lunch)),      { timezone: 'Asia/Bangkok' });
cron.schedule('30 12 * * *',() => pushMsg(rand(messages.quote)),      { timezone: 'Asia/Bangkok' });
cron.schedule('0 14 * * *', () => pushMsg(rand(messages.water)),      { timezone: 'Asia/Bangkok' });
cron.schedule('0 16 * * *', () => pushMsg(rand(messages.water)),      { timezone: 'Asia/Bangkok' });
cron.schedule('0 17 * * *', () => pushMsg(rand(messages.taskEvening)),{ timezone: 'Asia/Bangkok' });
cron.schedule('30 18 * * *',() => pushMsg(rand(messages.exercise)),   { timezone: 'Asia/Bangkok' });
cron.schedule('0 20 * * *', () => pushMsg(rand(messages.money)),      { timezone: 'Asia/Bangkok' });
cron.schedule('30 22 * * *',() => pushMsg(rand(messages.sleep)),      { timezone: 'Asia/Bangkok' });

// ===== WEBHOOK - รับข้อความจากผู้ใช้ =====
app.post('/webhook', middleware(config), (req, res) => {
  res.json({ status: 'ok' });

  req.body.events.forEach(event => {
    // บันทึก USER_ID อัตโนมัติจากคนแรกที่ส่งข้อความ
    if (event.source && event.source.userId) {
      USER_ID = event.source.userId;
      console.log('USER_ID:', USER_ID);
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.toLowerCase().trim();
      let reply = '😄 พิมพ์ "ช่วย" เพื่อดูคำสั่งทั้งหมดนะ!';

      if (text.includes('ช่วย') || text === 'help') {
        reply = '🤖 BFF Bot ช่วยได้เรื่อง:\n\n💧 พิมพ์ "น้ำ" - เตือนดื่มน้ำ\n📋 พิมพ์ "task" - ดู task วันนี้\n💰 พิมพ์ "เงิน" - แจ้งเตือนออม\n🏃 พิมพ์ "exercise" - กระตุ้นออกกำลังกาย\n✨ พิมพ์ "คำคม" - รับแรงบันดาลใจ\n☀️ พิมพ์ "เช้า" - ทักทายเช้า\n😴 พิมพ์ "นอน" - เตือนเวลานอน';
      } else if (text.includes('น้ำ')) {
        reply = rand(messages.water);
      } else if (text.includes('คำคม')) {
        reply = rand(messages.quote);
      } else if (text.includes('เงิน') || text.includes('ออม')) {
        reply = rand(messages.money);
      } else if (text.includes('exercise') || text.includes('ออกกำลัง')) {
        reply = rand(messages.exercise);
      } else if (text.includes('task') || text.includes('งาน')) {
        reply = rand(messages.task);
      } else if (text.includes('เช้า') || text.includes('หวัดดี') || text.includes('สวัสดี')) {
        reply = rand(messages.morning);
      } else if (text.includes('นอน') || text.includes('ราตรี')) {
        reply = rand(messages.sleep);
      } else if (text.includes('ขอบคุณ') || text.includes('thanks')) {
        reply = 'ยินดีเลย! 💚 บอทเป็นห่วงคุณเสมอนะ เพื่อนแท้ไม่มีวันทิ้งกัน 🤖';
      } else if (text.includes('เบื่อ')) {
        reply = 'เบื่อหรอ? 😅 ลองออกไปเดินเล่นดูสิ หรือดื่มน้ำก็ได้ บอทแนะนำเรื่องนี้ได้เรื่องเดียว 555';
      }

      client.replyMessage(event.replyToken, { type: 'text', text: reply });
    }

    // เมื่อเพิ่มบอทเป็นเพื่อน
    if (event.type === 'follow') {
      USER_ID = event.source.userId;
      client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🎉 ยินดีต้อนรับสู่ BFF Bot!\n\nบอทจะคอยแจ้งเตือนคุณตลอดวันเลยนะ\n\n💧 ดื่มน้ำ\n📋 Task ประจำวัน\n🧘 กำลังใจ\n💰 ออมเงิน\n😴 เวลานอน\n\nพิมพ์ "ช่วย" เพื่อดูคำสั่งทั้งหมด! 💚'
      });
    }
  });
});

// Health check
app.get('/', (req, res) => res.send('🤖 BFF Bot กำลังทำงานอยู่นะ!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 BFF Bot รันที่ port ${PORT}`));
