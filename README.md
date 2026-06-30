# AI-Powered On-Duty (OD) Request & Approval Management System

A modern, glassmorphic full-stack web application that automates On-Duty (OD) request submissions, multi-level academic approval workflows, calendar planning, statistics tracking, and secure verification certificates via QR Codes.

---

## 🛠️ Tech Stack
- **Frontend:** React.js (Vite), Lucide Icons, Custom CSS UI System (Outfit & Inter fonts)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JSON Web Tokens (JWT) + bcryptjs
- **File Handling:** Multer
- **Utilities:** QRCode Generator, NodeMailer (Ethereal test accounts)

---

## 📂 Folder Structure
```text
edu-od-system/
├── backend/
│   ├── config/          # MongoDB connectivity
│   ├── middleware/      # Auth & role-validation guards
│   ├── models/          # User & ODRequest schemas
│   ├── routes/          # Auth, OD, stats, and chatbot APIs
│   ├── uploads/         # Destination for Multer files
│   ├── utils/           # AI audits, QR code and email helpers
│   ├── .env             # Server variables
│   └── server.js        # Express app entrypoint
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/  # Chatbot, Calendar, QRCard components
    │   ├── pages/       # Landing, Login, Register, Dashboards, VerifyOD
    │   ├── App.jsx      # Navigation router
    │   ├── index.css    # Responsive styles and theme
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## 🚀 Setup & Execution Guide (VS Code)

### Prerequisites
Make sure you have the following installed:
1. **Node.js** (v16.x or newer)
2. **MongoDB Community Server** (running locally on port `27017`) or a **MongoDB Atlas** connection string.

---

### Step 1: Clone / Open Project
1. Open VS Code.
2. Select **File > Open Folder** and select the root directory `Edu OD`.

---

### Step 3: Running the Backend
1. Open a new terminal in VS Code (`Ctrl + ~` or `Cmd + ~`).
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *You should see `MongoDB Connected: localhost` and `Server running on port 5000`.*

---

### Step 4: Running the Frontend
1. Open a **second terminal split/pane** in VS Code.
2. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Launch Vite developer environment:
   ```bash
   npm run dev
   ```
   *Vite will host the web portal at `http://localhost:5173/`.*

---

## 🧪 Testing the Multi-Level Approval Workflow

Follow these steps to test the full system:

1. **Open the browser** and navigate to `http://localhost:5173/`. You will see the new premium Landing page detailing features.
2. **Register a Student Account:**
   - Click **Get Started**, fill in credentials, choose **Student** role, enter register number, and submit.
3. **Submit an OD Request:**
   - On the student dashboard, complete the form, upload a **mandatory PDF or image**, and click submit.
   - Note the **AI Recommendation Audit** summary that runs.
4. **Register a Faculty Account:**
   - Log out, click **Get Started**, register with role **Faculty Advisor** (select the *same department* as the student).
5. **Recommend the Request (Faculty Stage):**
   - Log in as the Faculty Advisor. You'll see the student's request in the list.
   - Click it, review the **AI Audit risk score**, add a comment, and click **Recommend** (moves status to `Faculty_Approved`).
6. **Register/Log in as HOD (Admin Stage):**
   - Register or log in with the **HOD / Admin** role.
   - HOD has final verification control. You'll see the request under the recommended status.
   - Review AI audits, add final comments, and click **Final Approve** (status moves to `Approved`).
7. **View and Verify the QR Code Letter:**
   - Log back into the **Student Account**.
   - Your request status is now green **Approved**.
   - Click **View OD Letter** to view the printable certificate.
   - Scan the **QR Code** using any mobile scanner—it will redirect you to the public verification portal verifying the clearance registry!
8. **Test the Chatbot:**
   - Click the chat icon on the bottom right.
   - Logged-in students can type **"Check my OD status"** for a context-aware report.
   - Anyone can type **"How do I apply?"** or **"Who approves my OD?"** to receive faq responses.
