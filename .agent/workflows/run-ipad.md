---
description: Run the kiosk app on iPad simulator (primary development target)
---

# Run on iPad Simulator

This workflow starts the MMD Kiosk App on the primary iPad simulator for tablet-first development.

## Steps

// turbo

1. Start the app on iPad Pro 13-inch simulator:

```bash
npm run ios:ipad
```

## Alternative iPad Simulators

For testing on different iPad sizes:

// turbo

- **iPad Pro 11-inch:** `npm run ios:ipad-11`
  // turbo
- **iPad Air 13-inch:** `npm run ios:ipad-air`
  // turbo
- **iPad mini:** `npm run ios:ipad-mini`

## Notes

- The simulator will boot automatically if not running
- This is the PRIMARY development target - always test here first
- Check landscape mode behavior for forms
