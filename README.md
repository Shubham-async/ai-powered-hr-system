# 🚀 AI-Powered HR Management System

> **Enterprise-grade Human Resource Management System** leveraging AI and machine learning to revolutionize recruitment, employee evaluation, and workforce analytics.

---

## 📋 Overview

A comprehensive, full-stack MERN application designed to streamline HR operations by automating critical workforce management tasks. This system integrates advanced NLP and machine learning capabilities to enhance decision-making, reduce hiring time, and improve overall employee experience.

**Live Demo:** [https://aurion-6ivs.onrender.com](https://aurion-6ivs.onrender.com)  
**Health Check:** [https://aurion-6ivs.onrender.com/Healthz](https://aurion-6ivs.onrender.com/Healthz)

---

## ✨ Core Features

### 🎯 Recruitment Automation
- **AI-Powered Resume Screening** - Intelligent candidate shortlisting using NLP and ML algorithms
- **Job Description Management** - Automated JD creation and optimization with AI
- **Candidate Matching** - Smart matching between candidates and job requirements
- **Resume Analysis** - Comprehensive resume parsing and candidate profiling

### 📊 Interview Management
- **Automated Interview Scheduling** - Intelligent scheduling with calendar integration
- **Candidate Assessment** - Customizable testing and scoring system
- **Performance Tracking** - Real-time evaluation and feedback mechanism

### 💼 Offer & Onboarding
- **AI-Generated Offers** - Automated offer letter generation with context-aware compensation
- **Salary Benchmarking** - Market-based salary recommendations using AI analysis
- **Onboarding Workflows** - Streamlined task management for new hires

### 🔔 Communication
- **Notification Service** - Real-time email notifications for all HR events
- **Multi-channel Alerts** - Queue-based notification processing for reliability

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js with Express.js
- **Database:** MongoDB
- **Message Queue:** Job queue processing for async operations
- **Authentication:** JWT-based multi-role authentication

### AI/ML
- **GenAI Integration:** Advanced NLP for resume analysis and content generation
- **Machine Learning:** Candidate scoring and matching algorithms

### Architecture
- **Microservices Pattern:** Modular service-based architecture
- **Queue Processing:** Async job handling for resume screening, notifications, and scheduling
- **RESTful APIs:** Complete API endpoints for all HR operations

---

## 📁 Project Structure

```
AI-powered-HR-System/
├── module-1/                           # Main HR service
│   ├── controllers/                    # Business logic controllers
│   │   ├── jdController.js            # Job description management
│   │   ├── resumeController/          # Resume processing
│   │   ├── Candidate Assessment/      # Assessment scoring
│   │   ├── Interview Scheduling/      # Interview coordination
│   │   └── Offer and Onboarding/      # Offer generation
│   ├── services/                       # Service layer
│   │   ├── aiService.js               # Core AI operations
│   │   ├── aiResumeShortListService.js# Resume screening AI
│   │   ├── aiOfferService.js          # Offer generation AI
│   │   ├── aiSchedulingService.js     # Interview scheduling AI
│   │   ├── salaryBenchmarkService.js  # Compensation analysis
│   │   └── calendarService.js         # Calendar integration
│   ├── models/                         # Database schemas
│   ├── routes/                         # API endpoints
│   ├── queues/                         # Async job queues
│   └── middleware/                     # Authentication & validation
│
└── Utils/                              # Supporting services
    ├── auth/                           # Authentication module
    │   ├── controllers/                # Auth logic
    │   ├── models/                     # User schemas
    │   └── utils/                      # Token generation
    └── notification-service/           # Email notifications
        ├── queues/                     # Notification queue
        ├── services/                   # Mail service
        └── config/                     # Email configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/sugga-cloud/AI-powered-HR-System.git
cd AI-powered-HR-System

# Install dependencies for main module
cd module-1
npm install

# Install auth service dependencies
cd ../Utils/auth
npm install

# Install notification service dependencies
cd ../notification-service
npm install
```

### Configuration
See `Utils/auth/ReadMe.md` for detailed setup instructions, environment variables, and API usage examples.

---

## 📚 API Documentation

### Authentication Module
- **Endpoint:** [https://aurion-6ivs.onrender.com](https://aurion-6ivs.onrender.com)
- **Health Check:** [https://aurion-6ivs.onrender.com/Healthz](https://aurion-6ivs.onrender.com/Healthz)
- **Documentation:** See `Utils/auth/ReadMe.md`

### Main HR Services
Comprehensive API endpoints for:
- Job Description management (`/api/jd/*`)
- Resume screening and shortlisting (`/api/resume/*`)
- Candidate assessment (`/api/assessment/*`)
- Interview scheduling (`/api/interviews/*`)
- Offer management (`/api/offers/*`)
- Notification services (`/api/notifications/*`)

---

## 🤖 AI Capabilities

- **Resume Parsing:** Extract and analyze candidate information
- **Job Matching:** Intelligent candidate-to-job matching
- **Offer Generation:** Context-aware compensation packages
- **Salary Benchmarking:** Market analysis and recommendations
- **Interview Scheduling:** Optimal time slot selection

---

## 🔐 Security Features

- **JWT Authentication:** Secure token-based authentication
- **Role-Based Access Control:** Multi-tier user permissions (Employee, HR, Admin)
- **Data Validation:** Comprehensive input validation and sanitization
- **Middleware Protection:** Custom authentication middleware

---

## 📈 Performance & Scalability

- **Asynchronous Processing:** Queue-based job handling prevents bottlenecks
- **Modular Architecture:** Independent service scaling
- **Database Optimization:** Indexed MongoDB schemas for fast queries
- **Cloud Deployment:** Render.com for reliable hosting

---

## 🛣️ Roadmap

- [ ] Advanced analytics dashboard
- [ ] Mobile application (React Native)
- [ ] Multi-language support
- [ ] Advanced video interview integration
- [ ] Predictive analytics for retention
- [ ] Real-time collaboration features

---

## 👨‍💻 Developers

**Vansh** - Full Stack Developer
- Specializing in AI/ML-powered web applications
- MERN stack expert with machine learning integration
- Building scalable, enterprise-grade HR solutions

**Sazid Husain** - Full Stack Developer
- Expertise in scalable backend architecture
- AI/ML integration and optimization
- Cloud deployment and DevOps

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Contact & Support

For API documentation, setup issues, or feature inquiries:
- 📖 See `Utils/auth/ReadMe.md` for detailed API documentation
- 📧 Check individual service README files for specific configurations

---

