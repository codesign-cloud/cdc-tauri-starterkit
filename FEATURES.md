# Choose Features Guide

This Tauri starter kit is **feature-neutral by design**. All optional features are disabled by default, and you choose which features to enable when running or building your application. This keeps your application lightweight and only includes the functionality you actually use.

## Available Features

### 🔔 Notifications (`notifications`)
- **What it includes**: Native system notifications with permission handling
- **Dependencies**: `tauri-plugin-notification`
- **Frontend components**: Notification demo page
- **Use cases**: User alerts, status updates, background task completion

### 🔗 Deep Links (`deep-links`)
- **What it includes**: Custom protocol handling for deep linking
- **Dependencies**: `tauri-plugin-deep-link`
- **Frontend components**: Deep link demo page
- **Use cases**: Opening your app from web browsers, handling custom URLs

### 📋 Clipboard (`clipboard`)
- **What it includes**: Advanced clipboard management with history and image support
- **Dependencies**: `tauri-plugin-clipboard-manager`, `image`, `base64`, `chrono`
- **Frontend components**: Clipboard demo page with full image support
- **Use cases**: Clipboard history like Win+V, image clipboard operations, format analysis

### 🖥️ System Tray (`system-tray`)
- **What it includes**: System tray icon with context menu
- **Dependencies**: Built into Tauri core
- **Frontend components**: Tray menu integration
- **Use cases**: Background operation, quick access menu, minimize to tray

### 🪟 Window Manager (`window-manager`)
- **What it includes**: Inter-window communication, multi-window management, message passing
- **Dependencies**: Built into Tauri core
- **Frontend components**: Window manager demo, window creation interface, message history
- **Use cases**: Multi-window applications, window-to-window messaging, distributed UI components
- **Features**:
  - Create and manage multiple windows with custom labels
  - Send targeted messages to specific windows
  - Broadcast messages to all windows
  - Message history tracking with timestamps
  - Window state management (focus, visibility, positioning)
  - Developer tools integration (restart app in dev mode)

## Default Configuration

By default, **no optional features are enabled** (feature-neutral):

```toml
[features]
default = []
```

This means you get a minimal, lightweight application by default and choose which features to enable when you run or build.

## How to Choose Features

### Method 1: NPM Scripts (Recommended)

Use the provided npm scripts to run or build with specific features:

```bash
# Development with features
npm run tauri:dev -- --features clipboard,notifications
npm run tauri:dev -- --features deep-links
npm run tauri:dev:feat  # All features enabled

# Development with no features (minimal)
npm run tauri:dev

# Building with features
npm run tauri:build -- --features clipboard,notifications
npm run tauri:build -- --features deep-links

# Building with no features (minimal)
npm run tauri:build
```

### Method 2: Direct Cargo Commands

You can also use cargo directly:

```bash
# Development with features
cargo tauri dev --features clipboard,notifications
cargo tauri dev --features deep-links

# Building with features
cargo tauri build --features clipboard,notifications
cargo tauri build --features deep-links

# Minimal builds (no features)
cargo tauri dev
cargo tauri build
```

### Method 3: Modify Cargo.toml (Not Recommended)

While you can still modify the default features in `src-tauri/Cargo.toml`, this approach is discouraged as it makes the project less flexible:

```toml
# Not recommended - makes project less flexible
[features]
default = ["clipboard", "notifications"]
```

**Why not recommended?** Because it forces everyone using your project to have the same features, whereas the command-line approach lets each developer choose what they need.

## Feature Combinations

### Minimal Build (Default)
```bash
npm run tauri:dev
npm run tauri:build
```
- Smallest bundle size
- Only basic window management
- No external plugin dependencies

### Essential Build
```bash
npm run tauri:dev -- --features notifications,system-tray
npm run tauri:build -- --features notifications,system-tray
```
- Basic notifications
- System tray integration
- Good for simple desktop apps

### Power User Build
```bash
npm run tauri:dev -- --features clipboard,notifications
npm run tauri:build -- --features clipboard,notifications
```
- Advanced clipboard management
- System notifications
- Great for productivity apps

### Full Build
```bash
npm run tauri:dev:feat  # Shortcut for all features
npm run tauri:dev -- --features notifications,deep-links,clipboard,system-tray,window-manager
npm run tauri:build -- --features notifications,deep-links,clipboard,system-tray,window-manager
```
- All features enabled
- Complete functionality
- Larger bundle size

## Frontend Integration

The frontend **automatically detects** which features are enabled and shows/hides components accordingly. No manual configuration needed!

### Automatic Feature Detection

The application uses SWR to fetch enabled features from the Rust backend:

```tsx
// This happens automatically in src/app/page.tsx
const { data: features } = useSWR('tauri-features', fetchFeatures)

// Components are conditionally rendered:
{features?.has('clipboard') && <ClipboardDemo />}
{features?.has('notifications') && <NotificationDemo />}
{features?.has('deep-links') && <DeepLinkDemo />}
{features?.has('window-manager') && <WindowManagerDemo />}
```

### What This Means

- **No manual updates needed**: When you run with different features, the UI automatically adapts
- **Clean experience**: Users only see features that are actually available
- **No broken links**: Demo pages only appear when their features are enabled
- **Helpful messaging**: When no features are enabled, users see guidance on how to enable them

### Example Behavior

```bash
# Run with no features - shows minimal UI with helpful message
npm run tauri:dev

# Run with clipboard only - shows only clipboard demo
npm run tauri:dev -- --features clipboard

# Run with all features - shows all demos
npm run tauri:dev:feat
```

## Bundle Size Impact

Approximate bundle size impact of each feature:

| Feature | Size Impact | Dependencies |
|---------|-------------|--------------|
| `notifications` | ~200KB | tauri-plugin-notification |
| `deep-links` | ~150KB | tauri-plugin-deep-link |
| `clipboard` | ~800KB | tauri-plugin-clipboard-manager + image processing |
| `system-tray` | ~50KB | Built into Tauri |
| `window-manager` | ~100KB | Built into Tauri core |

## Development Workflow

### 1. Start Development
Simply run with the features you want to test:
```bash
# Start with specific features
npm run tauri:dev -- --features clipboard,notifications

# Or start minimal and add features as needed
npm run tauri:dev
```

### 2. Test Different Combinations
Easily test different feature combinations without changing code:
```bash
# Test minimal build
npm run tauri:dev

# Test with clipboard only
npm run tauri:dev -- --features clipboard

# Test full build
npm run tauri:dev:feat
```

### 3. Build for Production
Build with the exact features your users need:
```bash
npm run tauri:build -- --features clipboard,notifications
```

### 4. No Manual Updates Needed
The frontend automatically adapts to enabled features - no code changes required!

## Common Configurations

### Blog/Content App
```bash
npm run tauri:dev -- --features notifications,system-tray
npm run tauri:build -- --features notifications,system-tray
```

### Productivity/Utility App
```bash
npm run tauri:dev -- --features clipboard,notifications,system-tray
npm run tauri:build -- --features clipboard,notifications,system-tray
```

### Web Integration App
```bash
npm run tauri:dev -- --features deep-links,notifications
npm run tauri:build -- --features deep-links,notifications
```

### Multi-Window App
```bash
npm run tauri:dev -- --features window-manager,notifications,system-tray
npm run tauri:build -- --features window-manager,notifications,system-tray
```

### Minimal Utility
```bash
npm run tauri:dev -- --features system-tray
npm run tauri:build -- --features system-tray
```

## Troubleshooting

### Build Errors After Disabling Features

If you get build errors after disabling features:

1. **Clean the build**: `cargo clean`
2. **Check imports**: Remove imports for disabled features in `main.rs`
3. **Update frontend**: Remove references to disabled Tauri commands

### Runtime Errors

If you get runtime errors:

1. **Check frontend calls**: Ensure frontend doesn't call disabled Tauri commands
2. **Conditional rendering**: Use feature flags in frontend to conditionally show UI
3. **Error handling**: Add proper error handling for missing features

## Advanced: Custom NPM Scripts

You can create your own custom npm scripts for common feature combinations in `package.json`:

```json
{
  "scripts": {
    "tauri:dev:productivity": "tauri dev --features clipboard,notifications,system-tray",
    "tauri:dev:web": "tauri dev --features deep-links,notifications",
    "tauri:dev:multiwindow": "tauri dev --features window-manager,notifications,system-tray",
    "tauri:build:productivity": "tauri build --features clipboard,notifications,system-tray",
    "tauri:build:web": "tauri build --features deep-links,notifications",
    "tauri:build:multiwindow": "tauri build --features window-manager,notifications,system-tray"
  }
}
```

Then use them:
```bash
npm run tauri:dev:productivity
npm run tauri:build:web
```

### Custom Cargo Features (Advanced)

If you need more complex feature combinations, you can still define custom features in `src-tauri/Cargo.toml`:

```toml
[features]
# Custom combinations
productivity = ["clipboard", "notifications", "system-tray"]
web-integration = ["deep-links", "notifications"]
multi-window = ["window-manager", "notifications", "system-tray"]

# Individual features (already defined)
clipboard = ["dep:tauri-plugin-clipboard-manager", "dep:image", "dep:base64", "dep:chrono"]
notifications = ["dep:tauri-plugin-notification"]
window-manager = []  # Built into Tauri core
# ... etc
```

Then use them:
```bash
npm run tauri:dev -- --features productivity
cargo tauri build --features web-integration
```

## Need Help?

- Check the [Tauri documentation](https://tauri.app/v1/guides/)
- Review the source code in `src-tauri/src/` for implementation details
- Look at the demo pages for usage examples