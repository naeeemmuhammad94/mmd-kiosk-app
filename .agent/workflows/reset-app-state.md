---
description: Reset app state for testing onboarding/login flow
---

# Reset App State for Testing

Reset the app's stored state to test onboarding and login flows from scratch.

## Using Simulator Reset

1. In the Simulator, go to **Device > Erase All Content and Settings**
2. Restart the app

## Programmatic Reset (Development Only)

If you need to reset specific stores, add temporary debug code:

```typescript
// In a useEffect or button handler for testing:
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useAuthStore } from '@/store/useAuthStore';

// Reset onboarding
useOnboardingStore.getState().reset();

// Reset auth (logout)
useAuthStore.getState().logout();
```

## Storage Keys Reference

**SecureStore (expo-secure-store):**

- `access_token` - Auth access token
- `refresh_token` - Auth refresh token
- `user_data` - Serialized user data

**AsyncStorage:**

- `@mmd_kiosk_onboarding_complete` - Onboarding completion flag
- `@mmd_kiosk_notification_permission` - Notification permission flag

## Notes

- Onboarding will show again after reset
- User will need to re-login after auth reset
- Use simulator reset for clean slate testing
