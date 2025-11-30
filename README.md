<div align="center">

# Cloud Productivity Planner

**A smart, AI-powered daily planner built for synchronization and focus.**

[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)](https://deepmind.google/technologies/gemini/)

[View Live Demo](https://productivity-planner-2371e.web.app/) | [Report Bug](https://github.com/jeevanjoseph03/productivity-planner/issues)

</div>

---

## Interface

![App Interface](src/assets/Screenshot1.png)

## About The Project

This project is a full-stack Progressive Web App (PWA) designed to address the issue of fragmented planning. Unlike standard to-do lists, this planner enforces the "Eat the Frog" methodology and utilizes AI to enhance productivity.

## Key Features

- **Real-Time Cloud Sync**: Built on Firebase Firestore, allowing you to start planning on one device and check off items on another instantly.
- **AI Assistant**: Integrated with Google Gemini API. The "Brain Dump" section allows users to input unstructured thoughts, which the AI automatically organizes into actionable tasks.
- **Streak System**: A gamified streak counter designed to encourage daily planning consistency.
- **Priority Focus**: A dedicated section for the top 3 absolute priorities of the day, following the "Eat the Frog" methodology.
- **Time Blocking**: A full-day scheduler (6:00 AM – 12:00 AM) to help visualize and structure the day.
- **Mobile Optimized**: Fully responsive design providing a native app-like experience.

## Technical Depth

This project demonstrates proficiency in modern React patterns and Serverless architecture.

- **Frontend**: React (Vite), Tailwind CSS for styling, Lucide React for iconography.
- **Backend as a Service**: Firebase Auth (Email/Password), Firebase Firestore (NoSQL Database).
- **AI Integration**: Direct REST API calls to the Google Gemini 2.5 Flash model.
- **State Management**: React Hooks (`useState`, `useEffect`) and real-time Firestore listeners (`onSnapshot`).

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- Node.js (v18 or higher)
- A Firebase Project
- Google AI Studio API Key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/jeevanjoseph03/productivity-planner.git
   cd productivity-planner
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory and add your keys:

   ```env
   VITE_API_KEY=your_firebase_api_key
   VITE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_PROJECT_ID=your_project_id
   VITE_STORAGE_BUCKET=your_bucket.appspot.com
   VITE_MESSAGING_SENDER_ID=your_sender_id
   VITE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the application**

   ```bash
   npm run dev
   ```

## Project Structure

```text
productivity-planner/
├── src/
│   ├── assets/         # Images and icons
│   ├── App.jsx         # Main application logic
│   ├── firebase.js     # Firebase configuration
│   ├── index.css       # Tailwind imports
│   └── main.jsx        # Entry point
├── .env                # API Keys (Not uploaded to Git)
├── tailwind.config.js  # Tailwind configuration
└── README.md
```

## Future Improvements

- [ ] **Google Calendar Integration**: Sync time blocks with Google Calendar.
- [ ] **Push Notifications**: Use Firebase Cloud Messaging for offline alerts.
- [ ] **Dark Mode**: Implementation of a system-wide dark mode toggle.
- [ ] **Weekly Analytics**: A dashboard showing study hours versus task completion rates.

## Contact

**Jeevan George** - [LinkedIn](https://www.linkedin.com/in/jeevanjoseph03/)

Project Link: [https://github.com/jeevanjoseph03/productivity-planner](https://github.com/jeevanjoseph03/productivity-planner)
