# Comfort Haven

Comfort Haven is a full-stack application comprising three main components: a robust backend API, a user-friendly mobile application, and a comprehensive admin dashboard.

## Overview

- **Backend**: NestJS API server handling business logic and database interactions.
- **Frontend**: React Native (Expo) mobile application for end-users.
- **Admin Dashboard**: React (Vite) web application for administrative tasks.

---

## 🚀 Getting Started for Developers

Are you looking to contribute, fork, or run this project locally for development?

👉 **Please start by reading our [Contributing Guide](CONTRIBUTING.md).**

It covers critical setup steps, including:

- **Project architecture** and where to make your changes.
- Setting up your local **PostgreSQL database**.
- **CRITICAL**: Configuring your local network IP address so the mobile app and admin dashboard can successfully connect to the local backend API.

---

## Technical Stack Overview

### 1. Backend

Built with **NestJS**, **TypeORM**, and **PostgreSQL**.

Navigate to the backend directory to get started:

```bash
cd backend
yarn install
cp .env.example .env # And configure your database credentials
yarn start:dev
```

The API becomes available at `http://localhost:3000`.

### 2. Frontend (Mobile App)

Built with **React Native** and **Expo**.

_Note: Always update `services/api.ts` with your local IP address before starting if you are running the backend locally._

```bash
cd frontend
yarn install
npx expo start
```

Scan the QR code with the Expo Go app.

### 3. Admin Dashboard

Built with **React**, **TypeScript**, and **Vite**.

_Note: Always update `src/services/api.ts` with your local IP address before starting if you are running the backend locally._

```bash
cd admin-dashboard
npm install
npm run dev
```

The dashboard becomes available at `http://localhost:5173`.
