# Contributing to Comfort Haven

Welcome to the Comfort Haven repository! We appreciate your interest in contributing. This guide will help you understand the project structure, how to set it up locally, and how to start making changes.

## Project Architecture Overview

Comfort Haven consists of three main applications working together:

1.  **Backend (`/backend`)**: Built with **NestJS**, **TypeORM**, and **PostgreSQL**. This is our central API server that handles all database operations, business logic, authentication, and serves data to both frontends.
2.  **Frontend (`/frontend`)**: Built with **React Native** and **Expo**. This is the mobile application that end-users (guests and hosts) interact with.
3.  **Admin Dashboard (`/admin-dashboard`)**: Built with **React** and **Vite**. This is a web application used for managing users, properties, and system-wide settings.

## Local Environment Setup

To run the full stack locally, you need to set up environment variables and configure the services to talk to each other correctly.

### 1. Database Setup (Backend)

The backend requires a running PostgreSQL instance.

1.  Navigate to the `backend` folder.
2.  Duplicate `.env.example` and rename it to `.env`:
    ```bash
    cp .env.example .env
    ```
3.  Update the values in `.env` with your local PostgreSQL credentials (specifically `DB_PASSWORD`, `DB_USERNAME`, and `DB_NAME`).
4.  Run `yarn start:dev` to start the server. By default, it runs on `http://localhost:3000`.

### 2. Network Configuration for Frontends

Because the mobile app (testing via Expo on a physical device or emulator) needs to connect to your local backend, **`localhost` will not work**. You must configure both frontends to use your computer's local network IP address.

#### Finding your Local IP Address

- **Mac/Linux**: Open terminal and run `ifconfig` or `ipconfig getifaddr en0`.
- **Windows**: Open command prompt and run `ipconfig`. Look for the "IPv4 Address".
  _(Example: `192.168.1.15`)_

#### Updating the Mobile App (`/frontend`)

1.  Open `/frontend/services/api.ts`.
2.  Locate `API_BASE_URL` at the top of the file:
    ```typescript
    const API_BASE_URL = "http://YOUR_LOCAL_IP:3000"; // Change 192.168.43.200 to your IP
    ```
3.  Update it with your machine's IP address.

#### Updating the Admin Dashboard (`/admin-dashboard`)

1.  Open `/admin-dashboard/src/services/api.ts`.
2.  Locate the `baseURL` inside `axios.create`:
    ```typescript
    const api = axios.create({
      baseURL: "http://YOUR_LOCAL_IP:3000", // Change 192.168.43.200 to your IP
    });
    ```
3.  Update it with your machine's IP address.

## Where to Make Changes

When you need to add a feature or fix a bug, here is where you should look:

### Adding a New Feature (Full Stack)

1.  **Backend First**: Always start by creating the API endpoint in the `/backend` folder. You will typically add a new Entity (database model), Controller (to handle API routes), and Service (for business logic).
2.  **Define DTOs**: Ensure your Data Transfer Objects (DTOs) are typed correctly and validated.
3.  **Frontend/Admin**: Once the API works (test via Postman or Swagger), move to the `/frontend` or `/admin-dashboard` to consume it. First, add the new API call to the respective `services/api.ts` file.

### UI & Styling Changes

- **Mobile App (`/frontend`)**: We use React Native components. Look in `/frontend/components` for reusable UI pieces and `/frontend/app` for screens/routing.
- **Admin Dashboard (`/admin-dashboard`)**: We use React + CSS/Tailwind (if applicable). Look in `/admin-dashboard/src/components` and `/admin-dashboard/src/pages`. Global CSS is in `index.css` and `App.css`.

### Making an API Call

If you need to fetch data from the backend, DO NOT write `axios.get` directly inside your React components. Instead:

1.  Open `services/api.ts` in the respective frontend project.
2.  Add a new method under the relevant category (e.g., `usersAPI`, `propertiesAPI`).
3.  Import and call that method from your component.

---

Thank you for contributing! If you run into issues, please open a GitHub issue to discuss them.
