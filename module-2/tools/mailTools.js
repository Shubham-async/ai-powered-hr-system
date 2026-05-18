import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import * as Brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';
dotenv.config();

const getModel = (name) => {
  try { return mongoose.model(name); } catch { return null; }
};

// ─── SMTP Configuration ──────────────────────────────────────────────────────
const FROM_EMAIL = process.env.MAIL_FROM || "onboarding@company.com";
const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587;
const MAIL_SECURE = process.env.MAIL_SECURE === 'true';
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

let smtpTransporter = null;
if (MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
}
const smtpEnabled = !!smtpTransporter;

// ─── Brevo Configuration (fallback) ───────────────────────────────────────────
let brevoClient = null;
if (!smtpEnabled && process.env.BREVO_API_KEY) {
  brevoClient = new Brevo.BrevoClient({
    apiKey: process.env.BREVO_API_KEY
  });
}
const brevoEnabled = !!brevoClient;


// ─── Internal helper: emit to socket ─────────────────────────────────────────
// This is populated by socket.js at runtime to allow tools to emit events
let _ioRef = null;
export const setIoRef = (io) => { _ioRef = io; };

const emitToRoom = (room, event, data) => {
  if (_ioRef) _ioRef.to(room).emit(event, data);
};

// ─── 1. Send/Log a mail ──────────────────────────────────────────────────────
export const sendMail = async ({ to, subject, body, toEmployeeId = null, triggeredBy = "agent", triggeredByEmployeeId = null, relatedModule = "general", refModel = null, refId = null, isHtml = false }) => {
  try {
    const MailLog = getModel("MailLog");
    if (!MailLog) return { status: "error", message: "MailLog model not loaded." };

    let status = "simulated";
    let errorDetail = null;

    // Reject generic group aliases used as placeholders
    const genericAliasPattern = /^(all|everyone|staff|team|employees|members)(@[\w.-]+)?$/i;
    if (genericAliasPattern.test(to.trim())) {
      return { status: "error", message: `Invalid recipient address: ${to}. Please send to real individual email addresses, not generic aliases.` };
    }

    // Check if we have SMTP credentials to send a real mail
    if (smtpEnabled) {
      try {
        const mailOptions = {
          from: FROM_EMAIL,
          to,
          subject,
          text: isHtml ? undefined : body,
          html: isHtml ? body : undefined,
        };

        await smtpTransporter.sendMail(mailOptions);
        status = "sent";
        console.log(`📧 Real Mail sent via SMTP to ${to}: ${subject}`);
      } catch (err) {
        console.error("❌ SMTP send failed, falling back to Brevo if available:", err.message);
        status = "failed";
        errorDetail = err.message || JSON.stringify(err);
      }
    } else if (brevoEnabled) {
      try {
        const sendOptions = {
          subject: subject,
          sender: { "name": "Aurion AI", "email": FROM_EMAIL },
          to: [{ "email": to }],
        };
        
        if (isHtml) {
          sendOptions.htmlContent = body;
        } else {
          sendOptions.textContent = body;
        }

        const data = await brevoClient.transactionalEmails.sendTransacEmail(sendOptions);
        
        status = "sent";
        console.log(`📧 Real Mail sent via Brevo to ${to}: ${subject}`);
      } catch (err) {
        console.error("❌ Brevo Send failed, falling back to simulation:", err.message);
        status = "failed";
        errorDetail = err.message || JSON.stringify(err);
      }
    }

    const mail = new MailLog({
      to, subject, body, toEmployeeId,
      triggeredBy, triggeredByEmployeeId,
      relatedModule, refModel, refId,
      isHtml,
      status,
      errorDetail,
      sentAt: new Date()
    });

    await mail.save();

    // Emit real-time preview to the relevant socket room
    // If toEmployeeId is known, emit to their personal room
    const room = toEmployeeId ? `emp_${toEmployeeId}` : "hr_room";
    emitToRoom(room, "mail-preview", {
      mailId: mail._id,
      to, subject,
      excerpt: body.substring(0, 150) + (body.length > 150 ? "..." : ""),
      triggeredBy, sentAt: mail.sentAt
    });

    return {
      status: "success",
      message: `Mail to "${to}" logged successfully. Subject: "${subject}". A preview has been sent to the UI.`,
      mailId: mail._id
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 2. Get mail log for an employee ──────────────────────────────────────────
export const getMailLog = async (employeeId, limit = 20) => {
  try {
    const MailLog = getModel("MailLog");
    if (!MailLog) return { status: "error", message: "MailLog model not loaded." };

    const mails = await MailLog.find({ toEmployeeId: employeeId })
      .sort({ createdAt: -1 }).limit(limit).lean();

    return { status: "success", count: mails.length, data: mails };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 3. Get all mails by module ───────────────────────────────────────────────
export const getMailsByModule = async (relatedModule, limit = 20) => {
  try {
    const MailLog = getModel("MailLog");
    if (!MailLog) return { status: "error", message: "MailLog model not loaded." };

    const mails = await MailLog.find({ relatedModule })
      .sort({ createdAt: -1 }).limit(limit).lean();

    return { status: "success", count: mails.length, data: mails };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 4. Compose & Send Onboarding Welcome Mail ────────────────────────────────
export const sendOnboardingWelcomeMail = async (employeeId, employeeName, role, startDate) => {
  const subject = `Welcome to the Team, ${employeeName}! 🎉`;
  
  // Sanitize name for email handle (remove non-alphanumeric characters except dots)
  const sanitizedHandle = employeeName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove symbols like / ' ! etc
    .replace(/\s+/g, ".");

  const body = `Dear ${employeeName},

We are thrilled to welcome you as our new ${role}!

Your start date is ${startDate}. Here's what you can expect in your onboarding:
1. Company orientation on Day 1
2. Team introductions and workspace setup
3. Role-specific training plan (shared separately)
4. HR & policy walkthrough

Please don't hesitate to reach out if you have any questions before your start date.

Warm regards,
Aurion AI HR System`;

  return await sendMail({
    to: `${sanitizedHandle}@company.com`,
    subject, body, toEmployeeId: employeeId,
    triggeredBy: "agent", relatedModule: "onboarding"
  });
};

// ─── 5. Compose Interview Invite Mail ─────────────────────────────────────────
export const sendInterviewInviteMail = async (candidateEmail, candidateName, role, dateStr, interviewerName) => {
  const subject = `Interview Invitation — ${role} at Our Company`;
  const body = `Dear ${candidateName},

We are pleased to invite you for an interview for the position of ${role}.

Interview Details:
- Date & Time: ${dateStr}
- Interviewer: ${interviewerName}
- Format: Video Call (Link will be shared separately)

Please confirm your availability by replying to this message.

Best regards,
HR Team | Powered by Aurion AI`;

  return await sendMail({
    to: candidateEmail, subject, body,
    triggeredBy: "agent", relatedModule: "hiring",
    refModel: "Candidate"
  });
};
