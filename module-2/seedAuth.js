import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/AIHRDB';

const seedAuth = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for auth seeding...");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users.");

    const users = [
      {
        name: "Sazid Admin",
        email: "admin@aurion.ai",
        password: "password123",
        role: "admin",
        permissions: ["manage_users", "manage_settings", "view_all"]
      },
      {
        name: "Aurion HR",
        email: "hr@aurion.ai",
        password: "password123",
        role: "hr",
        permissions: ["manage_hiring", "manage_attendance", "view_employees"]
      },
      {
        name: "Project Manager",
        email: "manager@aurion.ai",
        password: "password123",
        role: "manager",
        permissions: ["manage_projects", "view_team"]
      }
    ];

    for (const u of users) {
      await User.create(u);
      console.log(`Created user: ${u.name} (${u.role})`);
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedAuth();
