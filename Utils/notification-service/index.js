import express from "express";
import dotenv from "dotenv";
import notificationRoutes from "./src/routes/notificationRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/notifications", notificationRoutes);

app.listen(process.env.PORT, () => {
  console.log(`📢 Notification service running on port ${process.env.PORT}`);
});
