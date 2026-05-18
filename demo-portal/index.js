const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

app.use(cors({
    origin: "*",
    
}));
app.use(express.json());

// Set up storage for uploaded resumes
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Persistence Layer for Demo Portal
const DB_FILE = path.join(__dirname, 'db.json');

const loadData = () => {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(data);
            return {
                jobs: parsed.jobs || [],
                applications: parsed.applications || []
            };
        } catch (e) {
            console.error("[Demo Portal] Error loading db.json, starting fresh.");
            return { jobs: [], applications: [] };
        }
    }
    return { jobs: [], applications: [] };
};

const saveData = () => {
    const data = JSON.stringify({ jobs, applications }, null, 2);
    fs.writeFileSync(DB_FILE, data);
};

const database = loadData();
const jobs = database.jobs;
const applications = database.applications;

const REQUIRED_API_KEY = "sk_demo_portal_12345";
const AURION_API_URL = "http://localhost:5000/api/hiring";

// Middleware to check API key
const checkApiKey = (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (key !== REQUIRED_API_KEY) {
        return res.status(401).json({ error: "Unauthorized. Invalid Platform API Key." });
    }
    next();
};

// Endpoints for Aurion to POST to
app.post('/api/external/jobs', checkApiKey, (req, res) => {
    const job = req.body;
    // Preserve job_id from Aurion, or generate a fallback only if missing
    job.id = job.job_id || Date.now().toString();
    job.postedAt = new Date();
    jobs.push(job);
    saveData(); // Persist to disk
    console.log(`[Demo Portal] New Job Received: ${job.role || job.title}`);
    res.status(201).json({ success: true, message: "Job successfully posted to Demo Portal", job });
});

// Candidate Application Endpoint - Forwards to Module-1
app.post('/apply', upload.single('resume'), async (req, res) => {
    const { job_id, name, email } = req.body;
    const resume = req.file;

    if (!resume || !job_id) {
        return res.status(400).send("<h3>Error: Job ID and Resume are required.</h3><a href='/'>Go back</a>");
    }

    try {
        console.log(`[Demo Portal] Forwarding application for Job ${job_id} to Aurion Platform...`);
        
        // Prepare multipart form data for Aurion
        const form = new FormData();
        form.append('job_id', job_id);
        form.append('name', name || "Candidate");
        form.append('email', email || `cand_${Date.now()}@example.com`);
        form.append('resume', fs.createReadStream(resume.path), {
            filename: resume.originalname,
            contentType: resume.mimetype
        });

        const response = await axios.post(`${AURION_API_URL}/apply`, form, {
            headers: { ...form.getHeaders() }
        });

        // Clean up local temp file
        fs.unlinkSync(resume.path);

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Success | Aurion Careers</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Outfit', sans-serif; background: #030712; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(51, 65, 85, 0.5); padding: 50px; border-radius: 32px; text-align: center; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                    h1 { color: #60a5fa; margin-bottom: 20px; font-size: 42px; }
                    p { color: #94a3b8; font-size: 18px; line-height: 1.6; margin-bottom: 40px; }
                    a { background: #3b82f6; color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; display: inline-block; }
                    a:hover { background: #2563eb; transform: scale(1.05); }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>✅ Success!</h1>
                    <p>Your profile and resume have been synchronized with our AI-HR system. We will contact you soon if there's a match.</p>
                    <a href="/">Return to Portal</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("[Demo Portal] Error forwarding to Aurion:", error.message);
        if (resume) fs.unlinkSync(resume.path);
        res.status(500).send(`
            <body style="background: #030712; color: #ef4444; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
                <div style="text-align: center; background: rgba(30,41,59,0.7); padding: 50px; border-radius: 20px; border: 1px solid #ef4444;">
                    <h2>❌ Submission Error</h2>
                    <p style="color: #94a3b8;">${error.message}</p>
                    <a href="/" style="color: #60a5fa; text-decoration: none;">Try Again</a>
                </div>
            </body>
        `);
    }
});

// Mock UI Endpoint for the user to view the portal
app.get('/', (req, res) => {
    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Aurion | Career Portal</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg: #030712;
                    --card-bg: rgba(30, 41, 59, 0.7);
                    --accent: #3b82f6;
                    --accent-light: #60a5fa;
                    --text: #f8fafc;
                    --text-dim: #94a3b8;
                    --border: rgba(51, 65, 85, 0.5);
                }
                * { box-sizing: border-box; transition: all 0.3s ease; }
                body { 
                    font-family: 'Outfit', sans-serif; 
                    background: var(--bg); 
                    background-image: radial-gradient(circle at 50% -20%, #1e3a8a, transparent);
                    color: var(--text); 
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                }
                .container { max-width: 1000px; margin: 0 auto; padding: 60px 20px; }
                header { text-align: center; margin-bottom: 80px; }
                h1 { font-size: 48px; font-weight: 700; background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 15px; letter-spacing: -0.02em; }
                .subtitle { color: var(--text-dim); font-size: 18px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
                
                .job-grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
                .card { 
                    background: var(--card-bg); 
                    backdrop-filter: blur(12px);
                    border: 1px solid var(--border);
                    border-radius: 24px; 
                    padding: 40px; 
                    position: relative;
                    overflow: hidden;
                }
                .card:hover { border-color: var(--accent); transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                .card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--accent); opacity: 0.8; }
                
                .role { font-size: 32px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
                .meta { display: flex; gap: 20px; color: var(--text-dim); font-size: 15px; margin-bottom: 25px; }
                .tag { background: rgba(59, 130, 246, 0.1); color: var(--accent-light); padding: 4px 12px; border-radius: 20px; font-weight: 500; }
                
                .reqs { color: var(--text-dim); line-height: 1.7; margin-bottom: 35px; white-space: pre-wrap; font-size: 16px; border-bottom: 1px solid var(--border); padding-bottom: 30px; }
                
                .apply-section h3 { font-size: 22px; margin-top: 0; margin-bottom: 20px; color: var(--text); }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-dim); font-weight: 500; }
                input[type="text"], input[type="email"], input[type="file"] { 
                    width: 100%; 
                    padding: 14px 18px; 
                    border-radius: 12px; 
                    border: 1px solid var(--border); 
                    background: rgba(15, 23, 42, 0.5); 
                    color: white; 
                    font-size: 16px;
                    outline: none;
                }
                input:focus { border-color: var(--accent); ring: 2px solid var(--accent); }
                
                button { 
                    background: var(--accent); 
                    color: white; 
                    border: none; 
                    padding: 16px 32px; 
                    border-radius: 12px; 
                    cursor: pointer; 
                    font-weight: 700; 
                    font-size: 17px; 
                    width: 100%;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                button:hover { background: #2563eb; transform: scale(1.01); }
                
                .empty-state { text-align: center; padding: 100px; color: var(--text-dim); font-style: italic; }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>🌍 Aurion Career Portal</h1>
                    <p class="subtitle">Join our world-class team. Browse open positions and apply in minutes. Your application will be processed instantly by our AI-HR system.</p>
                </header>

                <div class="job-grid">
    `;
    
    if(jobs.length === 0) {
        html += `<div class="empty-state">No positions are currently open. Check back later or ask Aurion to broadcast new roles!</div>`;
    } else {
        jobs.forEach(j => {
            html += `
                <div class="card">
                    <div class="role">${j.role || j.title || 'Untitled Position'}</div>
                    <div class="meta">
                        <span class="tag">${j.experienceLevel || 'Mid-Senior'}</span>
                        <span>⏰ Posted ${new Date(j.postedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="reqs">${j.requirements || j.description || 'No description provided.'}</div>
                    
                    <div class="apply-section">
                        <h3>Quick Apply</h3>
                        <form action="/apply" method="POST" enctype="multipart/form-data">
                            <input type="hidden" name="job_id" value="${j.job_id || j.id}">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" name="name" placeholder="Alex Rivera" required>
                            </div>
                            <div class="form-group">
                                <label>Professional Email</label>
                                <input type="email" name="email" placeholder="alex.rivera@example.com" required>
                            </div>
                            <div class="form-group">
                                <label>Resume / CV (PDF Preferred)</label>
                                <input type="file" name="resume" required>
                            </div>
                            <button type="submit">Submit Application</button>
                        </form>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div></body></html>`;
    res.send(html);
});


app.listen(PORT, () => {
    console.log(`Demo Portal running on http://localhost:${PORT}`);
});
