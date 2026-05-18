import { Server } from 'socket.io';
import { runAgent } from '../agent/langGraphAgent.js';
import { setIoRef } from '../tools/mailTools.js';

const sessionBuffers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  // Expose io reference to mail tools for real-time mail previews
  setIoRef(io);

  io.on("connection", async (socket) => {
    console.log(`📡 Aurion Connection: ${socket.id}`);

    // ─── Initialize session buffer ──────────────────────────────────────────
    sessionBuffers.set(socket.id, {
      text: "",
      timer: null,
      waitingForConfirmation: false,
      employeeId: "EMP001",
      employeeRole: "employee",
      contextModule: "general"
    });

    // ─── Join role-based rooms ──────────────────────────────────────────────
    // The client sends identity on connection via auth or first event
    socket.on("identify", async ({ employeeId, employeeRole, contextModule, skipWelcome }) => {
      const session = sessionBuffers.get(socket.id);
      if (!session) return;

      session.employeeId = employeeId || "EMP001";
      session.employeeRole = employeeRole || "employee";
      session.contextModule = contextModule || "general";

      // Join personal room for targeted notifications
      socket.join(`emp_${employeeId}`);

      // HR and Admins also join the HR broadcast room
      if (employeeRole === "hr" || employeeRole === "admin") {
        socket.join("hr_room");
      }

      console.log(`👤 ${employeeRole.toUpperCase()} ${employeeId} identified [skipWelcome: ${!!skipWelcome}]`);

      // Emit welcome only if not skipped
      if (!skipWelcome) {
        try {
          socket.emit("status", { message: "Aurion is preparing..." });

          const welcomeReply = await runAgent({
            userInput: "GREETING_SHORT: Good morning/afternoon. Briefly ask how you can help.",
            sessionId: socket.id,
            employeeId,
            employeeRole,
            contextModule
          });

          socket.emit("agent-response", { reply: welcomeReply });
        } catch (error) {
          console.error("Welcome Error:", error);
          socket.emit("agent-response", { reply: "Good morning! How can I assist you today?" });
        }
      } else {
        socket.emit("status", { message: "Aurion is ready" });
      }
    });

    // ─── Voice streaming input ──────────────────────────────────────────────
    socket.on("stream-text", async (data) => {
      const { text, sessionId, isFinal, employeeId, employeeRole, contextModule } = data;
      const session = sessionBuffers.get(socket.id);
      if (!session) return;

      // Update session context if provided
      if (employeeId) session.employeeId = employeeId;
      if (employeeRole) session.employeeRole = employeeRole;
      if (contextModule) session.contextModule = contextModule;

      session.text += " " + text;
      if (session.timer) clearTimeout(session.timer);

      const triggerProcess = async () => {
        const command = session.text.trim();
        session.text = "";

        if (command.length > 2) {
          socket.emit("status", { message: "Aurion is thinking..." });
          try {
            const replyObj = await runAgent({
              userInput: command,
              sessionId: sessionId || socket.id,
              employeeId: session.employeeId,
              employeeRole: session.employeeRole,
              contextModule: session.contextModule,
              isConfirmation: session.waitingForConfirmation
            });

            session.waitingForConfirmation = false;

            if (typeof replyObj === 'object') {
              if (replyObj.confirmation_required) {
                session.waitingForConfirmation = true;
                socket.emit("agent-response", {
                  reply: replyObj.reply,
                  confirmation_required: true,
                  pending_action: replyObj.pending_action
                });
              } else if (replyObj.render_graph) {
                socket.emit("agent-response", {
                  reply: replyObj.reply,
                  render_graph: true,
                  graphPayload: replyObj.graphPayload
                });
              } else {
                socket.emit("agent-response", { reply: replyObj.reply || JSON.stringify(replyObj) });
              }
            } else {
              socket.emit("agent-response", { reply: replyObj });
            }

            socket.emit("status", { message: "Ready" });
          } catch (err) {
            console.error("Agent error:", err);
            socket.emit("agent-response", { reply: "Sorry, I encountered an error processing that." });
            socket.emit("status", { message: "Error — Ready" });
          }
        }
      };

      if (isFinal) {
        await triggerProcess();
      } else {
        session.timer = setTimeout(triggerProcess, 1200);
      }
    });

    // ─── Manual text chat (non-voice) ──────────────────────────────────────
    socket.on("manual-chat", async (data) => {
      const { message, sessionId, employeeId, employeeRole, contextModule, isConfirmation } = data;
      const session = sessionBuffers.get(socket.id);

      if (employeeId && session) session.employeeId = employeeId;
      if (employeeRole && session) session.employeeRole = employeeRole;
      if (contextModule && session) session.contextModule = contextModule;

      if (!message || message.trim().length < 2) return;

      socket.emit("status", { message: "Aurion is thinking..." });

      try {
        const replyObj = await runAgent({
          userInput: message,
          sessionId: sessionId || socket.id,
          employeeId: session?.employeeId || employeeId || "EMP001",
          employeeRole: session?.employeeRole || employeeRole || "employee",
          contextModule: session?.contextModule || contextModule || "general",
          isConfirmation: isConfirmation || (session?.waitingForConfirmation ?? false)
        });

        if (session) session.waitingForConfirmation = false;

        if (typeof replyObj === 'object') {
          if (replyObj.confirmation_required) {
            if (session) session.waitingForConfirmation = true;
            socket.emit("agent-response", {
              reply: replyObj.reply,
              confirmation_required: true,
              pending_action: replyObj.pending_action
            });
          } else if (replyObj.render_graph) {
            socket.emit("agent-response", {
              reply: replyObj.reply,
              render_graph: true,
              graphPayload: replyObj.graphPayload
            });
          } else {
            socket.emit("agent-response", { reply: replyObj.reply || JSON.stringify(replyObj) });
          }
        } else {
          socket.emit("agent-response", { reply: replyObj });
        }

        socket.emit("status", { message: "Ready" });
      } catch (err) {
        console.error("Manual chat error:", err);
        socket.emit("agent-response", { reply: "Sorry, I hit an issue. Please try again." });
      }
    });

    // ─── Module context switch ──────────────────────────────────────────────
    socket.on("switch-module", ({ contextModule }) => {
      const session = sessionBuffers.get(socket.id);
      if (session) {
        session.contextModule = contextModule;
        socket.emit("status", { message: `Switched to ${contextModule} module.` });
      }
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const session = sessionBuffers.get(socket.id);
      if (session?.timer) clearTimeout(session.timer);
      sessionBuffers.delete(socket.id);
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });

  // ─── Server-side helpers (for controllers to push real-time events) ────────
  io.notifyEmployee = (employeeId, event, data) => {
    io.to(`emp_${employeeId}`).emit(event, data);
  };

  io.notifyHR = (event, data) => {
    io.to("hr_room").emit(event, data);
  };

  return io;
};