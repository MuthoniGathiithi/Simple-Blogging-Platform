# Facial Recognition Attendance System - Frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

- **Landing Page**: Sign In / Sign Up navigation
- **Dashboard**: Create and manage classes
- **Student Registration**: Video-based facial capture with 4 poses (right, left, up, down)
- **Attendance Marking**: Upload 2-8 photos to mark attendance
- **Attendance Sheet**: View persistent attendance records per class

## Tech Stack

- React 18
- React Router v6
- Vite
- Axios for API calls
- Lucide React for icons

## Project Structure

```
src/
  components/     # Reusable components
  pages/          # Page components
  services/       # API service layer
  contexts/       # React contexts (Auth)
  utils/          # Utility functions
```

