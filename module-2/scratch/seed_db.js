import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'hr', 'manager', 'employee', 'candidate'], default: 'employee' },
  employeeId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  status: { type: String, default: "Active" },
  salary: Number,
  joiningDate: Date
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, default: "Active" },
  priority: { type: String, default: "Medium" },
  members: [
    {
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      role: { type: String, default: "Member" }
    }
  ],
  healthScore: { type: Number, default: 50 },
  completionPercent: { type: Number, default: 0 }
}, { timestamps: true });

async function seed() {
  try {
    console.log("Connecting to:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const tablesToDrop = ['users', 'employees', 'projects', 'candidates', 'jobdescriptions', 'candidateapplieds', 'leaverequests', 'maillogs', 'notifications'];
    
    for (const name of tablesToDrop) {
      if (collectionNames.includes(name)) {
        await db.dropCollection(name);
        console.log(`Dropped: ${name}`);
      }
    }

    const User = mongoose.model('User', userSchema);
    const Employee = mongoose.model('Employee', employeeSchema);
    const Project = mongoose.model('Project', projectSchema);

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create 5 Employees
    const employeesData = [
      { id: 'E001', first: 'Sazid', last: 'Husain', email: 'sazidhusain2004@gmail.com', role: 'hr', salary: 2500000 },
      { id: 'E002', first: 'Ahmad', last: 'Shah', email: 'suggalsugga@gmail.com', role: 'manager', salary: 1800000 },
      { id: 'E003', first: 'Zoya', last: 'Khan', email: 'zoya.khan@example.com', role: 'employee', salary: 1200000 },
      { id: 'E004', first: 'Kabir', last: 'Singh', email: 'kabir.s@example.com', role: 'employee', salary: 1400000 },
      { id: 'E005', first: 'Ananya', last: 'Iyer', email: 'ananya.i@example.com', role: 'employee', salary: 1100000 },
    ];

    const employees = [];
    for (const data of employeesData) {
      const emp = await Employee.create({
        employeeId: data.id,
        firstName: data.first,
        lastName: data.last,
        email: data.email,
        salary: data.salary,
        joiningDate: new Date('2025-01-15')
      });
      
      await User.create({
        name: `${data.first} ${data.last}`,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        employeeId: data.id
      });
      
      employees.push(emp);
    }
    console.log("✅ Seeded 5 Employees and Auth Users (Password: password123)");

    // 2. Create 4 Projects
    const projectsData = [
      { name: "Skyline Infra", desc: "Building the core cloud backbone for Aurion Enterprise.", priority: "Critical", health: 92, progress: 65 },
      { name: "Pulse HRM", desc: "Next-gen employee sentiment and engagement tracking module.", priority: "High", health: 78, progress: 40 },
      { name: "Project X", desc: "Experimental AI-driven recruitment mediation system.", priority: "Medium", health: 45, progress: 15 },
      { name: "Atlas Payroll", desc: "Consolidated multi-country currency payroll automation.", priority: "Low", health: 98, progress: 85 },
    ];

    for (const data of projectsData) {
      const shuffled = [...employees].sort(() => 0.5 - Math.random());
      const selectedMembers = shuffled.slice(0, Math.floor(Math.random() * 2) + 2).map(e => ({
        employeeId: e._id,
        role: "Member"
      }));

      await Project.create({
        name: data.name,
        description: data.desc,
        status: "Active",
        priority: data.priority,
        members: selectedMembers,
        healthScore: data.health,
        completionPercent: data.progress
      });
    }
    console.log("✅ Seeded 4 Projects with random team assignments");

    console.log("\nDB REFRESH COMPLETE");
    console.log("Login with: sazidhusain2004@gmail.com / password123");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
