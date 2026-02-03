# MMD Kiosk App - Development Rules & Guidelines

## 📱 Project Purpose & Priority

**This is a TABLET-FIRST application.** All design and development decisions must prioritize tablet displays (iPad) as the primary target device.

### Device Priority Order

1. **iPad Pro 13-inch** - Primary development target
2. **iPad Pro 11-inch** - Secondary tablet target
3. **iPad Air 13-inch** - Tertiary tablet target
4. **iPad mini** - Minimum tablet size to support
5. **iPhone** - Mobile support (secondary priority)

> **CRITICAL:** Never design for phone-first and scale up. Always design for tablet and ensure it degrades gracefully to smaller screens.

---

## 🏗️ Architecture Overview

### Tech Stack

- **Framework:** Expo SDK 54 with React 19
- **Router:** Expo Router v6 (file-based routing)
- **Language:** TypeScript (strict mode enabled)
- **State Management:** Zustand (client state) + TanStack Query (server state)
- **UI Library:** React Native Paper (Material Design 3)
- **Forms:** React Hook Form + Zod validation
- **Storage:** expo-secure-store (tokens) + AsyncStorage (non-sensitive data)
- **HTTP Client:** Axios with interceptors

### Project Structure

```
mmd-kiosk-app/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (auth)/            # Auth group (onboarding, login, forgot-password)
│   ├── (tabs)/            # Tab navigation (home, profile)
│   ├── _layout.tsx        # Root layout with auth routing
│   └── +not-found.tsx     # 404 page
├── src/
│   ├── components/        # Reusable components
│   │   ├── auth/         # Auth-specific components
│   │   └── ui/           # Generic UI components
│   ├── config/           # App configuration (API endpoints)
│   ├── constants/        # Static constants
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services (axios, authService)
│   ├── store/            # Zustand stores
│   ├── theme/            # Theme configuration
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── validations/      # Zod schemas
├── assets/               # SVG illustrations and images
└── .agent/               # AI assistant configuration
```

---

## 🎨 Design Standards

### Brand Colors

```
Primary Blue:        #4A7DFF
Primary Blue Light:  #4A90D9, #5EA0E8, #72B0F5 (gradient)
Text Dark:           #1F2937
Text Gray:           #6B7280
Text Light Gray:     #9CA3AF
Border:              #E5E7EB
Error Red:           #EF4444
Success Green:       #22C55E
Background:          #FFFFFF
```

### Typography

- **Titles:** fontSize 28, fontWeight 700
- **Section Headers:** fontSize 24, fontWeight 700
- **Body:** fontSize 16, fontWeight 400
- **Descriptions:** fontSize 14-16, fontWeight 400, color #6B7280
- **Buttons:** fontSize 16, fontWeight 600

### Button Styles

```typescript
// Primary Button
{
  height: 52,
  backgroundColor: '#4A7DFF',
  borderRadius: 26, // Fully rounded
  shadowColor: '#4A7DFF',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
}

// Secondary Button (Text Link)
{
  color: '#4A7DFF',
  fontSize: 14,
  fontWeight: '500',
}
```

### Input Fields

```typescript
{
  height: 52,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 8,
  paddingHorizontal: 16,
  fontSize: 16,
  color: '#1F2937',
}
```

### Card Styles

```typescript
{
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  paddingHorizontal: 24,
  paddingVertical: 32,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 24,
  elevation: 8,
}
```

---

## 📐 Tablet-First Layout Rules

### Screen Dimensions

Always use `Dimensions.get('window')` for responsive layouts:

```typescript
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
```

### Content Width Guidelines

- **Max content width on tablets:** 80-85% of screen width for forms
- **Illustration sizing:** ~80% width, ~38-45% height
- **Horizontal padding:** 32-40px
- **Card max-width:** Consider constraining on very large tablets

### Responsive Breakpoints

```typescript
// Tablet detection
const isTablet = SCREEN_WIDTH >= 768;
const isLargeTablet = SCREEN_WIDTH >= 1024;

// Adjust sizing accordingly
const illustrationWidth = SCREEN_WIDTH * 0.8;
const illustrationHeight = SCREEN_HEIGHT * 0.38;
```

### Landscape Considerations

- Support both portrait and landscape modes on tablets
- Content should reflow appropriately
- Critical: Test login/forms in landscape mode

---

## 🔐 Authentication Patterns

### API Configuration

- **Base URL:** `https://staging-api.managemydojo.com/api/v1`
- **Env Variable:** `EXPO_PUBLIC_API_BASE_URL` or `API_BASE_URL`

### Login Flow

1. User enters `userName` (not email) + password
2. Call `POST /user/login` with `{ userName, password, rememberMe: true }`
3. Store `accessToken` and `refreshToken` in expo-secure-store
4. Store user data in expo-secure-store (JSON stringified)

### Token Handling

```typescript
// Axios interceptor automatically:
// 1. Attaches Authorization header from secure storage
// 2. Clears tokens on 401 response
// 3. Uses token format: config.headers.Authorization = token (no "Bearer " prefix)
```

### Password Reset

- Uses `userName` (not email) for CRM compatibility
- Endpoint: `POST /user/send-email-to-reset-password`
- Payload: `{ userName: string, email?: string }`

---

## 📍 Navigation & Routing

### Auth Flow

```
1. App Start → Check onboarding state
2. First time (no onboarding) → /(auth)/onboarding
3. Onboarding complete, not authenticated → /(auth)/login
4. Authenticated → /(tabs)
```

### Route Groups

- `(auth)` - Authentication screens (no bottom tabs)
- `(tabs)` - Main app with bottom tab navigation

### Protected Routes

Handled in `app/_layout.tsx` via `useProtectedRoute()` hook.

---

## 📦 State Management

### Zustand Stores

| Store                | Purpose                                         | Storage           |
| -------------------- | ----------------------------------------------- | ----------------- |
| `useAuthStore`       | Auth state, user, tokens                        | expo-secure-store |
| `useOnboardingStore` | Onboarding completion, notification permissions | AsyncStorage      |
| `useThemeStore`      | Theme preference (light/dark/auto)              | N/A               |
| `useAppStore`        | General app state                               | N/A               |

### TanStack Query

Use for all server-state operations:

```typescript
// Mutations for actions
const loginMutation = useMutation({
  mutationKey: ['login'],
  mutationFn: async data => {
    /* ... */
  },
  onSuccess: () => {
    /* navigate */
  },
  onError: error => {
    /* show alert */
  },
});

// Queries for data fetching
const { data, isLoading } = useQuery({
  queryKey: ['attendance', date],
  queryFn: () => attendanceService.getByDate(date),
});
```

---

## ✅ Form Validation

### Zod Schemas

All form validation uses Zod:

```typescript
const loginSchema = z.object({
  userName: z.string().min(1, 'Username is required').max(50, 'Username is too long'),
  password: z.string().min(1, 'Password is required').max(50, 'Password is too long'),
});
```

### React Hook Form Integration

```typescript
const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(loginSchema),
  defaultValues: { userName: '', password: '' },
});
```

---

## 🎨 SVG Assets

### Asset Location

All SVG illustrations in `assets/`:

- `Frame-welcome.svg` - Welcome onboarding
- `Frame-attendee.svg` - Attendance management onboarding
- `Frame-picture-mode.svg` - Picture mode onboarding
- `Frame-notification.svg` - Notification onboarding
- `Frame-logo.svg` - Login screen logo

### SVG Import Pattern

```typescript
import WelcomeIllustration from '../../assets/Frame-welcome.svg';

<WelcomeIllustration
  width={SCREEN_WIDTH * 0.8}
  height={SCREEN_HEIGHT * 0.38}
/>
```

### SVG Transformer

Configured in `metro.config.js` with `react-native-svg-transformer`.

---

## 🧪 Testing

### Test Command

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

### Test Location

Tests in `src/__tests__/`

### Testing Stack

- Jest + jest-expo
- @testing-library/react-native

---

## 📝 Code Quality

### Scripts

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
npm run format      # Format code with Prettier
npm run type-check  # TypeScript type checking
```

### Pre-commit Hooks (Husky)

Runs lint-staged before commits.

### ESLint Rules

- TypeScript strict mode
- React Hooks rules enforced
- React Native specific rules
- No inline styles warning

---

## 🚀 Development Commands

### Tablet Simulators (Primary)

```bash
npm run ios:ipad       # iPad Pro 13-inch (M5) - PRIMARY
npm run ios:ipad-11    # iPad Pro 11-inch (M5)
npm run ios:ipad-air   # iPad Air 13-inch (M3)
npm run ios:ipad-mini  # iPad mini (A17 Pro)
```

### Phone Simulator

```bash
npm run ios:iphone     # iPhone 17 Pro Max
```

### General

```bash
npm start              # Start Expo dev server
npm run ios            # iOS with last used simulator
npm run android        # Android
npm run web            # Web browser
```

---

## ⚠️ Important Notes

### CRM Compatibility

This app shares API patterns with `dojo-crm-frontend`. When implementing new features:

1. Check `dojo-crm-frontend` for existing implementations
2. Use `userName` (not `email`) for login/password-reset
3. Match API payload structures with CRM

### Expo Go Limitations (SDK 53+)

- `expo-notifications` not supported in Expo Go
- Notification permissions work in development/production builds only

### Path Aliases

Use `@/` prefix for imports:

```typescript
import { useAuthStore } from '@/store/useAuthStore';
import type { CurrentUser } from '@/types/auth';
```

### Secure Storage Keys

```typescript
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};
```

---

## 📋 Future Feature Endpoints

Already defined in `apiEndpoints.ts`:

- `GetKioskSettingsByDojo` - `/attendance-setting/getByDojo`
- `UpdateKioskSettings` - `/attendance-setting`
- `ConfirmKioskPin` - `/attendance-setting/confirmPin`
- `GetAttendance` / `MarkAttendance` - `/attendance`
- `GetPrograms` - `/program-tag-club`
