# Comfort Haven Backend API

This is the core backend API for the Comfort Haven application, serving both the mobile app and the admin dashboard. Built with NestJS, it handles business logic, database interactions, user authentication, and serves as the single source of truth for the platform.

## 🛠 Tech Stack

- **Framework**: NestJS (v11)
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT & Passport (bcrypt for password hashing)
- **API Documentation**: Swagger UI Express
- **API Layer**: REST & tRPC

## 📋 Prerequisites

Ensure you have the following installed:

- Node.js (v18 or higher recommended)
- Yarn package manager
- PostgreSQL server running locally or remotely

## 🚀 Getting Started

### 1. Installation

Install the required dependencies using Yarn:

```bash
yarn install
```

### 2. Environment Configuration

Create a `.env` file in the root of the `backend` directory based on the provided `.env.example` file (or set these required variables):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=comfort_haven
JWT_SECRET=your_jwt_secret
```

### 3. Database Seeding (Optional)

If you need to populate the database with initial seed data, run:

```bash
yarn seed
```

### 4. Running the API Server

Start the NestJS development server:

```bash
# development
yarn start

# watch mode (recommended for development)
yarn start:dev

# production mode
yarn start:prod
```

The API will be available at [http://localhost:3000](http://localhost:3000).

## 📚 API Documentation

The backend uses Swagger for API documentation. Once the server is running, navigate to the configured Swagger endpoint (e.g., `/api`) to explore the API routes.

## 🏗 Available Scripts

- `yarn start:dev`: Starts the server in watch mode.
- `yarn build`: Builds the production-ready application.
- `yarn format`: Formats code using Prettier.
- `yarn lint`: Lints the codebase using ESLint.
- `yarn test`, `yarn test:e2e`, `yarn test:cov`: Commands for running unit and end-to-end tests.
