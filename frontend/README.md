# Comfort Haven Mobile Application

This is the mobile frontend for the Comfort Haven platform, built specifically for end-users to browse, book, and interact with properties and hosts.

## 🛠 Tech Stack

- **Framework**: React Native with Expo (SDK 54)
- **Navigation**: Expo Router & React Navigation
- **HTTP Client**: Axios
- **State/Storage**: AsyncStorage
- **Authentication**: Expo Auth Session & Google OAuth integration
- **Icons & UI**: Expo Vector Icons & Lucide React Native

## 📋 Prerequisites

To run this application locally, you will need:

- Node.js (v18 or higher recommended)
- Yarn package manager
- [Expo Go app](https://expo.dev/client) installed on your iOS or Android device, OR a working local emulator (Android Studio / Xcode).

## 🚀 Getting Started

### 1. Installation

Navigate into the `frontend` directory and install the required dependencies using Yarn:

```bash
yarn install
```

### 2. Configuration

Ensure the backend API is running, and configure your mobile app to point to your local machine's IP address if running on a physical device. You may need to create a `.env` file to store your API base URL or OAuth keys (handled via `react-native-dotenv`).

### 3. Running the Application

Start the Expo development server:

```bash
yarn start
# or
npx expo start
```

This command will output a QR code in your terminal.

### 4. Launching the App

- **Physical Device**: Open the standard Camera app (iOS) or the Expo Go app (Android) and scan the generated QR code.
- **Emulator**: Press `a` in the terminal to open in an Android emulator, or `i` to open in an iOS simulator.

## 🏗 Available Scripts

- `yarn start`: Starts the Expo Metro bundler.
- `yarn android`: Starts the bundler and attempts to open the app on a connected Android device/emulator.
- `yarn ios`: Starts the bundler and attempts to open the app on an iOS simulator.
- `yarn web`: Opens the application in a web browser (if web support is enabled).
