# Openbox Codebase Analysis 📂

This document provides a comprehensive, deep-dive analysis of the **Openbox** repository. It is designed to give you a complete understanding of how the frontend and backend communicate, the file structure, the logical flow, and what each major module does. Use this guide to confidently answer any technical questions during your interview.

## 🏗️ Architecture Overview

The Openbox application follows a decoupled full-stack architecture:
- **Frontend:** Built with **Next.js (App Router)**, React 19, Tailwind CSS v4, Framer Motion, and a large suite of Radix UI / Shadcn UI components. For the core editing experience, it integrates **Monaco Editor** (`@monaco-editor/react`).
- **Backend:** A RESTful API built with **Node.js, Express, and MongoDB (Mongoose)**. It uses **Passport.js** for authentication (Google OAuth / Local), **Multer** for file handling, and JWT for secure authorization.

---

## 📂 Folder Structure Deep Dive

### 1. Backend (`/backend`)
The backend is set up to provide secure APIs to handle user identity, repository (project) management, code file management, commit tracking, and real-time collaboration signals.

*   `package.json`: Defines the Express server entry points and dependencies like `mongoose`, `passport`, `jsonwebtoken`, and `node-cron`.
*   `src/app.js`: The central Express application configuration file. It sets up CORS (allowing traffic from localhost and Vercel domains), body limits (`50mb` for large file uploads), Passport sessions, and mounts all the application routes.
*   `src/server.js`: The application's entry point. Connects the API to a specified port and sets up a `node-cron` job that pings the server every 10 minutes to prevent the Render free tier from spinning down.

#### 🗂️ Core Directories in `backend/src`
*   **`config/`**:
    *   `db.js`: Contains the logic to connect to the MongoDB instance using Mongoose.
    *   `passport.js`: Sets up authentication strategies (e.g., Google OAuth 2.0). 
*   **`models/`** *(MongoDB Schemas)*:
    *   `user.model.js`: Stores user details (email, password hash, OAuth IDs).
    *   `repo.model.js` (Project): Represents a repository or workspace container.
    *   `file.model.js`: Represents individual files or nodes inside a project tree.
    *   `commit.model.js`: Tracks version history, diffs, and changes on files to allow rollback or versioning.
    *   `collaboration.model.js`: Tracks access rights and active collaborators for a project.
*   **`middlewares/`**:
    *   `auth.middleware.js`: Intercepts protected requests to verify JWT tokens or active Passport sessions.
    *   `multer.middleware.js`: Handles multipart/form-data parsing for uploading files and assets into the project.
*   **`controllers/ & routes/`** *(The Business Logic)*:
    *   **Auth** (`auth.controller.js` / `auth.route.js`): Handles login, registration, OAuth callbacks, and token generation.
    *   **Project** (`project.controller.js` / `project.route.js`): Logic for creating, deleting, and fetching repositories (`repos`).
    *   **File** (`file.controller.js` / `file.route.js`): Handles CRUD operations for actual code files. Probably includes logic to parse directory trees.
    *   **Commit** (`commit.controller.js` / `commit.route.js`): Logic for saving snapshots of code state.
    *   **Collaboration** (`collaboration.controller.js`): Manages inviting users, sharing links, and tracking who has access to edit or view a specific repository.

### 2. Frontend (`/frontend`)
The presentation layer is a robust Next.js application leveraging the new App Router (`app/` directory).

*   `package.json`: Contains Next.js scripts, UI dependencies (Radix, Tailwind), and `monaco-editor`.
*   **`app/`** *(Next.js App Router)*:
    *   `page.tsx` & `layout.tsx`: The root definitions of the app. `layout.tsx` wraps the app in global providers (like ThemeProvider).
    *   `login/`, `signup/`, `oauth/`: Pages dealing with authentication.
    *   `projects/page.tsx`: The dashboard view showing the user's available repositories.
    *   `project/[id]/page.tsx` & `project/[id]/editor/`: The core IDE view. This is where the Monaco Editor is mounted. It fetches the project tree using the `id` param and renders the code.
    *   `profile/`, `dashboard/`, `activity/`, `admin/`: Additional views for managing the user profile, viewing commit history/activity, and administrative dashboards.
    *   `service/app.js`: Acts as the central Axios/Fetch wrapper module to coordinate API calls to the Express backend (e.g., `getProjectData`, `updateFileContent`).
*   **`components/`**:
    *   `ui/`: Highly reusable, atomic UI components (buttons, dialogs, modals, navbars) primarily scaffolded by Shadcn UI.
    *   `layout/`: Structural UI components like `navbar.tsx`, `sidebar.tsx`, and `app-layout.tsx`.
*   **`hooks/`**: Custom React hooks handling client-side logic (`use-toast.ts` for notifications, `use-mobile.ts` for responsiveness).

---

## 🔄 User Flows & Data Lifecycles

### 1. Authentication Flow
1. **Action:** User clicks "Login with Google" on the Frontend (`/app/login/page.tsx`).
2. **Network:** Request hits `$BACKEND_URL/api/auth/google`.
3. **Backend:** Passport.js (`config/passport.js`) redirects to Google. Upon success, Google redirects to the callback route.
4. **Token Generation:** `auth.controller.js` generates a secure JWT or establishes a session.
5. **Client State:** The frontend receives the token, stores it locally (cookies/localStorage), and redirects the user to `/projects`.

### 2. Opening & Editing a Project
1. **Action:** User opens a project from the dashboard. Frontend navigates to `/project/123XYZ/editor`.
2. **Data Fetching:** The `[id]` page uses a React `useEffect` or Next.js server component to call the `service/app.js` which hits `/projects/123XYZ`.
3. **Backend Response:** `project.controller.js` queries `repo.model.js` and `file.model.js` to return the folder structure and file names.
4. **Rendering:** The Frontend renders a Sidebar with the file tree.
5. **Editing:** 
   - User clicks a file. 
   - Frontend fetches the file contents via `/api/files/:fileId`.
   - Monaco Editor mounts the file contents.
6. **Saving/Committing:** 
   - User presses `Ctrl+S` or clicks Save.
   - Frontend posts the updated string to `/api/files/update`.
   - Backend `file.controller.js` updates the MongoDB document.
   - If a commit is triggered, `commit.controller.js` saves a snapshot of the repo state using `diff-match-patch` (found in backend `package.json`) to track changes.

### 3. Collaboration Flow (Hypothesized based on folders)
1. **Inviting:** User generates an invite link via `/api/collaboration/invite`.
2. **Access Check:** When a second user opens the link, `auth.middleware.js` and `collaboration.controller.js` check if User B is authorized for Project A.
3. **Real-time constraints:** Since no WebSocket (`socket.io`) is installed, collaboration relies on REST polling or manual locking/pulling. If two people edit the same file, the last REST API `PUT` might overwrite, or `diff-match-patch` handles merge conflicts during commits.

---

## 🎯 Interview Talking Points & Tips

If the interviewer asks:

*   **"How does authentication work in your app?"**
    > "We use a dual approach: Passport.js on the backend handles standard Email/Password and Google OAuth integrations. Once authenticated, we distribute JSON Web Tokens (JWT) mapped to HTTP Request headers via Axios interceptors in `frontend/app/service/app.js`."
*   **"How did you implement the code editor?"**
    > "I leveraged `@monaco-editor/react` inside my Next.js frontend. The source code files are parsed into a file-tree component. When a file is active, its raw text content is injected into the Monaco editor. Updates are sent to the backend and saved in MongoDB's `file` collections."
*   **"How are you preventing your background processes from sleeping on Render?"**
    > "I implemented a Keep-Alive script using `node-cron` and `axios` right in `server.js` (`backend/src/server.js`). Every 10 minutes, the server pings its own `/ping` route. This prevents the Render free-tier instance from hibernating, ensuring fast cold starts for users."
*   **"How do you handle routing and SEO on the frontend?"**
    > "The frontend uses Next.js 14/15's App Router (`app/` directory). This gives us powerful Server Components for pages like the dashboard or marketing landing pages, while the interactive IDE parts (`project/[id]/editor`) are designated as Client Components to properly mount React hooks and Monaco."
*   **"What happens when the codebase scales?"**
    > "The architecture is modular. Controllers and Routes are neatly split. Mongoose models are decoupled. We could easily replace MongoDB with a relational database by swapping out the `controllers` and `models`, leaving `routes` and the frontend completely intact."
