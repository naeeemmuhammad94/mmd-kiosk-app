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

## 📱 Building for Production

We use **EAS Build** (Expo Application Services) for production-ready binaries.

### iOS Deployment (TestFlight)

1. **Build for Staging (Preview)**:

   ```bash
   npx eas-cli build --platform ios --profile preview --auto-submit
   ```

   _Uses bundle identifier: `com.mmd.kioskapp.staging`_

2. **Build for Production**:

   ```bash
   npx eas-cli build --platform ios --profile production --auto-submit
   ```

   _Uses bundle identifier: `com.mmd.kioskapp`_

3. **Manual Submission** (if auto-submit is skipped):
   ```bash
   npx eas-cli submit --platform ios --latest
   ```

### Android Deployment

1. **Build APK (For Testing)**:

   ```bash
   npx eas-cli build --platform android --profile preview
   ```

2. **Build AAB (For Play Store)**:
   ```bash
   npx eas-cli build --platform android --profile production
   ```

### Prerequisites

- Ensure you are logged into EAS: `npx eas-cli login`
- For iOS, the App Store Connect API Key and Team IDs are pre-configured in `eas.json` for non-interactive builds.

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
