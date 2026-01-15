---
description: Run the kiosk app on iPhone simulator
---

# Run on iPhone Simulator

This workflow starts the MMD Kiosk App on iPhone simulator.

> **Note:** This app is tablet-first. Always test on iPad first, then verify phone compatibility.

## Steps

// turbo

1. Start the app on iPhone 17 Pro Max simulator:

```bash
npm run ios:iphone
```

## Notes

- The simulator will boot automatically if not running
- iPhone is secondary priority - tablet layout takes precedence
- Verify forms and UI elements remain usable on smaller screens
