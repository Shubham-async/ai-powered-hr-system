import React, { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { speak, initVoice, stopSpeaking } from "../../utils/speechService";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Mic, MicOff, Send, Bot, User, ChevronDown, Briefcase, Calendar, ClipboardList, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const SOCKET_URL = import.meta.env.VITE_MAIN_API_URL?.replace('/api', '') || "http://localhost:5000";
const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa"];

type Message = {
  id: string;
  role: "user" | "aurion" | "system";
  content: string;
  timestamp: Date;
  graph?: any;
  confirmAction?: any;
};

// ── Prettier/Markdown Formatter ──
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        
        // Check for lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="pl-4 flex gap-2">
              <span className="text-primary">•</span> 
              <span>{trimmed.substring(2)}</span>
            </div>
          );
        }
        
        // Handle bold (**text**)
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, pi) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pi} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

const HuriaPage: React.FC = () => {
  const { user, isHR } = useAuth();
  
  const modules = [
    { id: "general", label: "General", icon: <Bot className="w-3.5 h-3.5" />, restricted: false },
    { id: "hiring", label: "Hiring", icon: <Briefcase className="w-3.5 h-3.5" />, restricted: true },
    { id: "leave", label: "Leave", icon: <Calendar className="w-3.5 h-3.5" />, restricted: false },
    { id: "projects", label: "Projects", icon: <ClipboardList className="w-3.5 h-3.5" />, restricted: false },
    { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-3.5 h-3.5" />, restricted: true },
  ].filter(m => !m.restricted || isHR);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [activeModule, setActiveModule] = useState("general");
  const [pendingAction, setPendingAction] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected");
      
      const sessionKey = `aurion_welcome_${user?.id || user?._id || 'guest'}`;
      const welcomeShown = sessionStorage.getItem(sessionKey);

      socket.emit("identify", {
        employeeId: user?.id || user?._id || "unknown",
        employeeRole: user?.role || "employee",
        contextModule: activeModule,
        skipWelcome: !!welcomeShown,
      });

      if (!welcomeShown) {
        sessionStorage.setItem(sessionKey, "true");
      }
    });

    socket.on("status", (data: any) => setStatus(data.message || "Ready"));

    socket.on("agent-response", (data: any) => {
      setLoading(false);
      const msg: Message = {
        id: crypto.randomUUID(),
        role: "aurion",
        content: data.reply || "",
        timestamp: new Date(),
        graph: data.render_graph ? data.graphPayload : undefined,
        confirmAction: data.confirmation_required ? data.pending_action : undefined,
      };
      setMessages(prev => [...prev, msg]);
      if (data.reply) speak(data.reply);
      if (data.confirmation_required) setPendingAction(data.pending_action);
      else setPendingAction(null);
    });

    socket.on("disconnect", () => setStatus("Disconnected"));

    initVoice();
    initRecognition();

    return () => {
      socket.disconnect();
      stopVisualizer();
    };
  }, []);

  const switchModule = (mod: string) => {
    setActiveModule(mod);
    socketRef.current?.emit("switch-module", { contextModule: mod });
  };

  const initRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { 
      setListening(true); 
      stopSpeaking();
      startVisualizer(); 
    };
    recognition.onend = () => { setListening(false); stopVisualizer(); };
    recognition.onresult = (event: any) => {
      stopSpeaking();
      const text = event.results[0][0].transcript;
      sendMessage(text, "voice");
    };
    recognitionRef.current = recognition;
  };
  
  const handleToggleListening = () => {
    if (!recognitionRef.current) initRecognition();
    
    if (listening) {
      recognitionRef.current?.abort();
      setListening(false);
      stopVisualizer();
    } else {
      try {
        stopSpeaking();
        recognitionRef.current?.start();
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    }
  };

  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      audioCtxRef.current.createMediaStreamSource(stream).connect(analyserRef.current);
      drawWave();
    } catch {}
  };

  const stopVisualizer = () => {
    cancelAnimationFrame(animRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const drawWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bw = canvas.width / data.length;
      data.forEach((v, i) => {
        const h = (v / 255) * canvas.height;
        const alpha = 0.4 + (v / 255) * 0.6;
        ctx.fillStyle = `rgba(99,102,241,${alpha})`;
        ctx.beginPath();
        ctx.roundRect(i * bw, canvas.height - h, bw - 1, h, 2);
        ctx.fill();
      });
    };
    draw();
  };

  const sendMessage = (text: string, via: "chat" | "voice" = "chat") => {
    if (!text.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStatus("Aurion is thinking...");

    socketRef.current?.emit("manual-chat", {
      message: text,
      sessionId: sessionId.current,
      employeeId: user?.id || user?._id || "unknown",
      employeeRole: user?.role || "employee",
      contextModule: activeModule,
      isConfirmation: !!pendingAction,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const renderChart = (payload: any) => {
    const tooltipStyle = { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9", borderRadius: 8 };
    if (payload.type === "bar") return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={payload.dataItems}>
          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {payload.dataKeys.map((k: string, i: number) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4,4,0,0]} />)}
        </BarChart>
      </ResponsiveContainer>
    );
    if (payload.type === "line") return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={payload.dataItems}>
          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {payload.dataKeys.map((k: string, i: number) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />)}
        </LineChart>
      </ResponsiveContainer>
    );
    if (payload.type === "pie") return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={payload.dataItems} dataKey={payload.dataKeys[0]} nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {payload.dataItems.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            Huria — Aurion AI Assistant
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Status: <span className={cn("font-medium", loading ? "text-yellow-400" : "text-green-400")}>{status}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => switchModule(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                activeModule === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {m.icon}{m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Aurion is ready</p>
              <p className="text-sm text-muted-foreground mt-1 text-balance max-w-xs mx-auto">
                Type or speak a command. Aurion will help you with HR, Project, and Hiring tasks.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              msg.role === "aurion" ? "bg-primary/20" : "bg-muted"
            )}>
              {msg.role === "aurion" ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className={cn("max-w-[80%] space-y-2", msg.role === "user" ? "items-end" : "items-start")}>
              <div className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "aurion"
                  ? "bg-card border border-border/50 rounded-tl-sm prose prose-invert prose-sm max-w-none shadow-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/10"
              )}>
                {msg.role === "aurion" ? <FormattedContent content={msg.content} /> : msg.content}
              </div>
              {msg.graph && (
                <div className="bg-card border border-border/50 rounded-xl p-4 w-full min-w-[340px]">
                  <p className="text-xs font-semibold mb-3 text-muted-foreground">{msg.graph.title}</p>
                  {renderChart(msg.graph)}
                </div>
              )}
              {msg.confirmAction && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs space-y-2">
                  <p className="font-medium text-yellow-400">⚠️ Action requires your confirmation</p>
                  <p>Action: <strong>{msg.confirmAction.action}</strong></p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700" onClick={() => sendMessage("Yes, confirm")}>Approve</Button>
                    <Button size="sm" variant="destructive" className="h-7" onClick={() => sendMessage("No, cancel")}>Reject</Button>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground/60 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {listening && (
        <div className="mb-2">
          <canvas ref={canvasRef} width={600} height={50} className="w-full rounded-lg" />
        </div>
      )}

      <div className="flex items-end gap-2 pt-2 border-t border-border/50">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message Aurion (${modules.find(m => m.id === activeModule)?.label} module)...`}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-28"
          style={{ lineHeight: "1.5" }}
        />
        <Button
          size="icon"
          variant={listening ? "destructive" : "outline"}
          onClick={handleToggleListening}
          className={cn("h-11 w-11 shrink-0 rounded-xl transition-all", listening && "animate-pulse shadow-lg shadow-destructive/20")}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          size="icon"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="h-11 w-11 shrink-0 rounded-xl"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default HuriaPage;