import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToDatabase } from './database/db.js';
import { initializeAllModels } from './tools/universalDbTools.js';

dotenv.config();

const seedDB = async () => {
  try {
    await connectToDatabase();
    await initializeAllModels();

    const Employee = mongoose.model('Employee');
    const LeaveRequest = mongoose.model('LeaveRequest');
    const Project = mongoose.model('Project');
    const Notification = mongoose.model('Notification');

    console.log("🧹 Clearing DB Collections...");
    await Employee.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Project.deleteMany({});
    await Notification.deleteMany({});

    console.log("🌱 Seeding Employees...");
    
    // Create HR
    const hr = new Employee({
      employeeId: "EMP001",
      firstName: "Ahmad",
      lastName: "HR",
      email: "hr@company.com",
      roleId: new mongoose.Types.ObjectId(), // Mock HR role
      employmentType: "Full-time",
      status: "Active",
      salary: 95000,
    });
    
    // Create normal employee
    const emp1 = new Employee({
      employeeId: "EMP002",
      firstName: "Sazid",
      lastName: "Developer",
      email: "emp@company.com",
      roleId: new mongoose.Types.ObjectId(), // Mock Dev role
      employmentType: "Full-time",
      status: "Active",
      salary: 80000,
      managerId: hr._id,
    });

    await hr.save();
    await emp1.save();

    console.log("🌱 Seeding Projects...");
    const project = new Project({
      name: "Aurion Platform Refactor",
      description: "Migrating HR system to real-time microservices architecture with LLM reasoning.",
      projectLeadId: emp1._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      priority: "Critical",
      status: "Active",
      completionPercent: 45,
      healthScore: 82,
      members: [
        { employeeId: emp1._id, role: "Lead" },
        { employeeId: hr._id, role: "Reviewer" }
      ],
      milestones: [
        { title: "Socket.io Upgrade", status: "Completed", deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
        { title: "React Frontend Wiring", status: "In Progress", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
        { title: "Voice Agent Polish", status: "Not Started", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) }
      ],
      feedbackLog: [
        { 
          employeeId: emp1._id, 
          message: "The new socket layer is incredibly fast. Great job on the refactor. Loving the real-time mail logs.", 
          sentiment: "Positive", 
          submittedVia: "chat" 
        }
      ]
    });
    await project.save();

    console.log("🌱 Seeding Leave Requests...");
    const leaves = [
      {
        employeeId: emp1._id,
        leaveType: "Sick",
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
        totalDays: 2,
        reason: "Caught a viral fever, attached doctor's note.",
        status: "Pending",
        agentNote: "Sazid is requesting 2 days of sick leave due to viral fever. The request is fully compliant with company policy and balance permits. Recommended action: Approve.",
        mediatedBy: "agent"
      },
      {
        employeeId: emp1._id,
        leaveType: "Casual",
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
        totalDays: 1,
        reason: "Personal errands in the city.",
        status: "Approved",
        hrComment: "Approved, have a good day off.",
        mediatedBy: "manual"
      }
    ];
    await LeaveRequest.insertMany(leaves);

    console.log("🌱 Seeding Notifications...");
    const notifs = [
      {
        recipientId: hr._id,
        type: "leave_filed",
        title: "New Leave Request",
        message: "Sazid Developer filed a 2-day Sick leave via Aurion.",
        read: false
      },
      {
        recipientId: emp1._id,
        type: "project_assigned",
        title: "Project Assignment",
        message: "You were added as Lead to Aurion Platform Refactor.",
        read: false
      }
    ];
    await Notification.insertMany(notifs);

    console.log("✅ Seeding complete! You can now test the modules.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();
