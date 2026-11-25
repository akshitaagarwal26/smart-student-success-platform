# 🎓 Smart Student Success Platform

**An intelligent, full-stack platform designed to help students track academic performance, improve skills, monitor learning progress, and prepare for their careers.**

<p align="center">
  <a href="https://smart-student-success-platform.vercel.app">Live Demo</a> •
  <a href="https://github.com/akshitaagarwal26/smart-student-success-platform">GitHub Repository</a>
</p>

---

## 🌟 Overview

Smart Student Success Platform is a full-stack web application that provides students with a centralized workspace to manage their academic performance, attendance, learning activities, skills, and career preparation.

The platform combines academic tracking, personalized learning roadmaps, career insights, resume analysis, job recommendations, and mock interview practice in one application.

It aims to help students identify areas for improvement, monitor their progress, and become career-ready.

## 🚀 Live Application

| Component | Technology | Deployment |
|---|---|---|
| Frontend | React + Vite | [Vercel](https://smart-student-success-platform.vercel.app) |
| Backend | Node.js + Express | [Render](https://smart-student-success-platform.onrender.com) |
| Database | TiDB Cloud | MySQL Compatible |

**Live Website:** https://smart-student-success-platform.vercel.app

**Backend API:** https://smart-student-success-platform.onrender.com

## ✨ Key Features

### 1. 📊 Smart Student Dashboard
- Centralized student dashboard.
- Average academic marks.
- Attendance percentage.
- Career readiness score.
- Study task completion tracking.
- Learning roadmap progress.

### 2. 📚 Academic Performance Management
- Manage academic records.
- Track subject-wise marks.
- Monitor academic progress.
- View academic performance summaries.

### 3. 📅 Attendance Management
- Record student attendance.
- Track present and total classes.
- Calculate attendance percentage.
- Monitor attendance performance.

### 4. 📖 Smart Study Planner
- Create study tasks.
- Organize learning activities.
- Track completed and pending tasks.
- Monitor daily learning progress.

### 5. 🤖 AI Student Insights
- Analyze academic performance.
- Identify areas requiring improvement.
- Generate personalized student insights.
- Provide suggestions based on student progress.

### 6. 🎯 Skill Gap Analysis
- Evaluate existing student skills.
- Identify missing career-related skills.
- Compare student skills with career requirements.
- Support career readiness improvement.

### 7. 🗺️ Personalized Learning Roadmap
- Career-oriented learning roadmap.
- Skill development activities.
- Track completed roadmap tasks.
- Monitor learning progress.

### 8. 📄 Resume Analyzer
- Upload resumes for analysis.
- Extract resume content.
- Evaluate resume quality.
- Provide ATS-oriented feedback.
- Identify missing skills and improvement areas.

### 9. 💼 Job Recommendations
- Display job opportunities.
- Recommend opportunities based on career interests.
- View job requirements.
- Save job listings.

### 10. 🎤 Mock Interview
- Practice technical and HR interview questions.
- Start interview sessions.
- Submit answers.
- Receive keyword-based answer evaluation.
- Review interview reports and performance.

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS
- React Router

### Backend
- Node.js
- Express.js
- REST APIs
- JWT Authentication
- bcryptjs
- Multer
- pdf-parse

### Database
- MySQL
- TiDB Cloud
- mysql2

### Deployment and Tools
- Git and GitHub
- Vercel
- Render
- Visual Studio Code
- Postman

## 🏗️ System Architecture

The application follows a three-tier architecture.

```text
             STUDENT
                |
                v
       React + Vite Frontend
             (Vercel)
                |
                | REST API Requests
                v
       Node.js + Express Backend
              (Render)
                |
                v
          TiDB Cloud
        MySQL Database
```

### Architecture Components

**Presentation Layer:** React frontend provides the user interface and student dashboard.

**Application Layer:** Node.js and Express handle authentication, business logic, API requests, and application processing.

**Database Layer:** TiDB Cloud stores user accounts, academic records, attendance, skills, study tasks, job listings, and other application data.

## 🗄️ Database Design

The application uses a MySQL-compatible relational database.

The database contains 17 tables:

1. users
2. academic_records
3. attendance
4. student_goals
5. study_plan_tasks
6. skill_catalog
7. career_roles
8. role_skill_requirements
9. student_skills
10. skill_learning_roadmap
11. resume_analysis
12. job_listings
13. job_skill_requirements
14. saved_jobs
15. interview_questions
16. interview_sessions
17. interview_answers

## 📁 Project Structure

```text
smart-student-success-platform/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── Dashboard.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

Follow these steps to run the project locally.

### Prerequisites

Install the following:

- Node.js and npm
- MySQL 8.0 or TiDB Cloud account
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/akshitaagarwal26/smart-student-success-platform.git
```

Navigate to the project:

```bash
cd smart-student-success-platform
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory.

Configure the following environment variables:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_student_success

DB_SSL=false

JWT_SECRET=your_secure_jwt_secret

CLIENT_URL=http://localhost:5173
```

For TiDB Cloud, configure the cloud host, port, username, password, and SSL certificate settings instead.

**Never commit your actual `.env` file or credentials to GitHub.**

Start the backend:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

### 4. Access the Application

Open your browser:

```text
http://localhost:5173
```

Register or log in to access the student dashboard and platform features.

## 🔐 Security Features

- Password hashing using bcryptjs.
- JWT-based authentication.
- Environment-based configuration.
- Database connection through environment variables.
- SSL/TLS certificate verification for cloud database connections.
- Sensitive configuration files excluded from Git.

## ☁️ Deployment

The application is deployed using separate hosting services.

**Frontend:** Vercel  
**Backend:** Render  
**Database:** TiDB Cloud

The frontend communicates with the backend through REST APIs, and the backend connects to the cloud database.

Note: Render's free service may spin down after inactivity, resulting in slower initial requests.

## 🎯 Project Objectives

- Provide centralized academic performance monitoring.
- Help students identify skill gaps.
- Encourage consistent learning habits.
- Support career-oriented skill development.
- Improve resume quality.
- Provide interview preparation facilities.
- Help students monitor their overall career readiness.

## 🔮 Future Enhancements

- Integration with advanced generative AI models.
- More personalized learning recommendations.
- Real-time notifications and reminders.
- Advanced academic performance prediction.
- Integration with external job portals.
- Mobile application development.
- Advanced analytics and reporting.

## 👩‍💻 Developer

**Project:** Smart Student Success Platform

**Developer:** Akshita Agarwal

**Degree:** B.Tech – Information Technology

**Project Type:** Full-Stack Web Application

**GitHub:** [akshitaagarwal26](https://github.com/akshitaagarwal26)

---

## 📜 License

This project is developed for educational and academic purposes.

---

**Learn. Improve. Succeed. 🎓**
