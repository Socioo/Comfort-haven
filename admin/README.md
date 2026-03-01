# Comfort Haven Admin Dashboard

This is the administrative dashboard for the Comfort Haven application. It provides a web-based interface for managing users, hosts, properties, and system settings.

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM (v7)
- **Styling/UI**: Tailwind CSS (assumed based on standard Vite setups) & Lucide React for icons
- **HTTP Client**: Axios
- **Authentication**: JWT-based (jwt-decode)

## 📋 Prerequisites

Ensure you have the following installed on your local machine:

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

## 🚀 Getting Started

### 1. Installation

Navigate into the `admin-dashboard` directory and install the dependencies:

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root of the `admin-dashboard` directory (if required) and add any necessary environment variables, such as the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

The dashboard will be available at [http://localhost:5173](http://localhost:5173).

## 🏗 Available Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run lint`: Runs ESLint to identify and report on patterns in JavaScript/TypeScript.
- `npm run preview`: Bootstraps a local web server that serves the production build for testing.
