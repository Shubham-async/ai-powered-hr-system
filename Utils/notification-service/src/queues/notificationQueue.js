import Queue from "bull";
import { sendMail } from "../services/mailService.js";
import dotenv from "dotenv";
dotenv.config();

const redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};


const NotificationQueue = new Queue("notification-queue", { redis });

NotificationQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  console.log(`📨 Processing email to: ${to}`);
  await sendMail(to, subject, html);
  return { to, status: "sent" };
});

NotificationQueue.on("completed", (job) => {
  console.log(`✅ Notification Job ${job.id} sent successfully.`);
});

NotificationQueue.on("failed", (job, err) => {
  console.error(`❌ Notification Job ${job.id} failed: ${err.message}`);
});

export default NotificationQueue;
