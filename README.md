# MMD Kiosk App

A modern, production-ready React Native application built with Expo, TypeScript, and the latest best practices.

## 🚀 Features

- **Expo SDK 54** with React 19
- **Expo Router v6** - File-based routing
- **TypeScript** - Strict type checking
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **React Native Paper** - Material Design components
- **React Hook Form + Zod** - Form handling and validation
- **ESLint + Prettier** - Code quality and formatting
- **Jest + Testing Library** - Comprehensive testing
- **Husky** - Git hooks for pre-commit checks
- **Dark Mode** - Built-in theme support

## 📦 Installation

1. Install dependencies:

```bash
npm install
```

2. Initialize Husky (git hooks):

```bash
npx husky install
```

3. Start the development server:

```bash
npm start
```

3. Run on your preferred platform:

```bash
npm start        # Start dev server (works without Android SDK)
npm run android  # Start dev server (use Expo Go app on your phone)
npm run android:emulator  # Run on Android emulator (requires Android SDK)
npm run ios      # Run on iOS simulator (requires Xcode on macOS)
npm run web      # Run on web browser
```

**Note:** To run on Android without installing Android SDK:

1. Install [Expo Go](https://expo.dev/client) on your Android device
2. Run `npm run android` or `npm start`
3. Scan the QR code with Expo Go app

To use Android emulator, install Android Studio and set `ANDROID_HOME` environment variable.

## 🏗️ Project Structure

```
mmd-kiosk-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   └── profile.tsx    # Profile screen
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 page
├── src/
│   ├── components/        # Reusable components
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom hooks
│   ├── store/            # Zustand stores
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── constants/        # App constants
│   └── theme/            # Theme configuration
├── assets/               # Images, fonts, etc.
└── ...
```

## 🛠️ Available Scripts

- `npm start` - Start Expo dev server
- `npm run android` - Start dev server (use Expo Go app)
- `npm run android:emulator` - Run on Android emulator (requires Android SDK)
- `npm run ios` - Run on iOS simulator (requires Xcode)
- `npm run web` - Run on web browser
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking

## 🎨 Theming

The app supports light and dark themes using React Native Paper. Theme configuration is in `src/theme/index.ts`.

To toggle theme:

```typescript
import { useThemeStore } from '@/store/useThemeStore';

const { setTheme } = useThemeStore();
setTheme('dark'); // 'light' | 'dark' | 'auto'
```

## 📝 State Management

### Client State (Zustand)

```typescript
import { useAppStore } from '@/store/useAppStore';

const { user, setUser } = useAppStore();
```

### Server State (TanStack Query)

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

## 🧪 Testing

Run tests with:

```bash
npm test
```

Tests are located in `src/__tests__/` directory.

## 📱 Building & Deploying

We use **EAS Build** with local builds and App Store Connect API Key authentication for reliable, non-interactive builds.

### Prerequisites

- Node.js installed (version in `.nvmrc`)
- EAS CLI: `npm install -g eas-cli`
- Logged into EAS: `npx eas-cli login`
- For iOS: Xcode installed, Apple credentials configured in `.env`
- For Android: Android SDK installed

### Quick Reference

| Command                         | What it does                        |
| ------------------------------- | ----------------------------------- |
| `npm run build:ios`             | Build iOS production `.ipa`         |
| `npm run build:android`         | Build Android production `.aab`     |
| `npm run submit:ios`            | Submit `.ipa` to App Store Connect  |
| `npm run submit:android`        | Submit `.aab` to Google Play        |
| `npm run build:ios:staging`     | Build + auto-submit iOS staging     |
| `npm run build:android:staging` | Build + auto-submit Android staging |

---

### iOS Production Deployment

**Step 1: Build locally**

```bash
npm run build:ios
```

This creates a `.ipa` file in the project root using App Store Connect API Key (no interactive login required).

**Step 2: Submit to App Store Connect**

```bash
npm run submit:ios
```

This uploads the `.ipa` to TestFlight. You can also specify a specific file:

```bash
./scripts/submit_ios.sh ./my-specific-build.ipa
```

---

### Android Production Deployment

**Step 1: Build locally**

```bash
npm run build:android
```

This creates an `.aab` file in the project root.

**Step 2: Submit to Google Play**

```bash
npm run submit:android
```

This uploads the `.aab` to Google Play Console.

---

### Staging Deployment (Auto-Submit)

For quick staging releases with automatic submission:

**iOS Staging:**

```bash
npm run build:ios:staging
```

Builds with `APP_VARIANT=preview` and staging API URL, then auto-submits to TestFlight.

**Android Staging:**

```bash
npm run build:android:staging
```

Builds with `APP_VARIANT=preview` and staging API URL, then auto-submits to Google Play Internal Track.

---

### Apple Credentials Setup

The following environment variables must be set in `.env` for iOS builds:

```bash
ASC_KEY_ID=your_key_id
ASC_ISSUER_ID=your_issuer_id
ASC_API_KEY_PATH=./scripts/AuthKey_XXXXX.p8
APPLE_TEAM_ID=your_team_id
```

The API key file (`.p8`) should be placed in the `scripts/` directory.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## 📄 License

MIT

## 🙏 Acknowledgments

- Expo team for the amazing framework
- React Native Paper for beautiful components
- All the open-source contributors
