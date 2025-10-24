# 💡 Mini GitHub Clone – Collaborative Code Hosting Platform  
**Team Name:** CodeVerse  

---

## 📄 1. Project Overview  

In the modern era of software development, collaboration and version control are crucial. However, most open-source platforms like GitHub are massive in scale and feature-rich — often unnecessary for smaller teams or educational environments.  

**Mini GitHub Clone** is a lightweight web application that mimics the core functionality of GitHub — allowing users to create repositories, upload files, edit code in a collaborative environment (like Google Colab), and track commits — all in a simplified, self-hosted format.  

The platform aims to provide developers and students an easy-to-use version control and collaboration system without the complexity of enterprise-grade tools.

---

## ⚙️ 2. Key Features  

- **User Authentication (JWT):** Secure login and signup for users.  
- **Repository Management:** Create, view, and delete repositories.  
- **File Upload & Editing:** Upload code files and edit them using an integrated code editor.  
- **Commit Tracker:** Record commits with timestamps, messages, and file diffs.  
- **Collaborative Editing:** Edit code simultaneously in a shared workspace (Colab-style).  
- **Branch Simulation:** Create and switch between branches for testing changes.  
- **Search & Filter Repos:** Easily locate repositories by name, language, or user.  
- **Activity Log:** Track user actions like commits, pushes, and merges.  
- **Profile Management:** Each user can manage their own repositories and commits.  
- **Responsive UI:** Fully optimized for desktop and mobile views.  

---

## 👥 3. User Roles  

### 🧑‍💻 Developer/User  
- Can create, edit, and delete repositories.  
- Can upload files, edit code, and commit changes.  
- Can collaborate on shared repositories.  

### 👩‍💼 Admin  
- Has access to all repositories and users.  
- Can manage users, repositories, and activity logs.  
- Can remove or restrict access to users violating terms.  

---

## 🖥️ 4. Frontend Pages / Screens  

| Page | Description |
|------|--------------|
| **Landing Page** | Introduction and CTA to sign up or log in |
| **Login / Signup Page** | Secure authentication using JWT |
| **Dashboard** | Displays user’s repositories and quick stats |
| **Create Repository Page** | Form to create a new repository |
| **Repository View** | Displays files, commits, and contributors |
| **File Editor Page** | Integrated code editor for editing or viewing files |
| **Commit History Page** | Shows commit messages, diffs, and timestamps |
| **User Profile Page** | Displays user details, repositories, and activity |
| **Admin Panel (Optional)** | Manage users, reports, and global settings |
| **Activity Log Page** | System-wide tracking of user and repo actions |

---

## 🗃️ 5. Database Design (MySQL Draft)  

| Table | Description |
|--------|--------------|
| **users** | Stores user details and authentication info |
| **repositories** | Each repository with owner info and visibility |
| **files** | Stores file metadata, path, and linked repository |
| **commits** | Records commit messages, timestamps, and file changes |
| **branches** | Simulates repository branching and history tracking |
| **collaborators** | Manages user access for shared repositories |
| **activity_logs** | Tracks actions like commit, push, or delete |

---

## 🧰 6. Tech Stack  

| Layer | Technology |
|--------|-------------|
| **Frontend** | React.js / Next.js + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL |
| **Authentication** | JWT (JSON Web Tokens) |
| **Storage** | Cloud storage for code files and commit data |
| **Code Editing** | Monaco Editor / CodeMirror for in-browser editing |
| **Version Control Simulation** | Custom commit-tracking logic via backend APIs |

---

## 🔄 7. Workflow  

1. User signs up or logs in via JWT authentication.  
2. After login, the dashboard displays all repositories owned by the user.  
3. The user can create a new repository and upload files.  
4. Files can be edited in the built-in editor (collaboratively if shared).  
5. When changes are saved, a **commit** is created and stored with metadata.  
6. Commit logs are displayed chronologically for each repository.  
7. Other collaborators can view, edit, or fork the repository (based on permissions).  
8. Admins can monitor system activity and manage global data.  

---

## 🎯 8. Expected Outcomes  

- Functional lightweight GitHub-like platform  
- Secure JWT-based authentication and session handling  
- Real-time collaborative code editing (Colab-style)  
- Commit tracking with proper timestamps and history  
- Scalable database design with user-role management  
- Clean, minimal, and responsive UI/UX  

---

## 🚀 9. Future Enhancements  

- Integration with **Git CLI** for real repository cloning and pushing  
- **AI-assisted code suggestions** for commit messages or code improvements  
- **File diff visualization** similar to GitHub’s commit viewer  
- **Docker-based deployment** for scalability  
- **Notification system** for commits and collaborations  
- **CI/CD simulation** for automated code testing  

---

> 🧑‍💻 **Team CodeVerse** aims to bring the essence of GitHub to a minimal, educational, and collaborative environment — simplifying version control for everyone.
