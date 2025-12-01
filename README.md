# Blocker Raptor - Chrome Extension

Powerful Chrome extension that blocks ads on websites.

## 🚀 Features

- ✅ Blocking ad elements on pages
- ✅ Blocking ad scripts and iframes
- ✅ Blocking network requests to ad servers
- ✅ Counting blocked elements
- ✅ Enable/disable blocking functionality
- ✅ Beautiful popup interface
- ✅ Automatic detection of dynamically added ad elements

## 📦 Development Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 🛠️ Commands

- `npm run dev` - Run in development mode
- `npm run build` - Build for production
- `npm run lint` - Check code

## 📋 What is Blocked

### DOM Elements:
- Elements with classes/ids containing: ad, ads, advertisement, banner, sponsor, promo
- Google AdSense (adsbygoogle)
- Ad containers
- Social sharing buttons

### Network Requests:
- doubleclick.net
- googlesyndication.com
- googleadservices.com
- advertising.com
- adservice.google.com

## 📁 Project Structure

```
blocker-pro/
├── public/
│   ├── manifest.json      # Extension manifest
│   ├── background.js      # Background service worker
│   ├── content.js         # Content script for blocking
│   ├── content.css        # Blocking styles
│   ├── rules.json         # declarativeNetRequest rules
│   └── icon*.png          # Extension icons
├── src/
│   ├── App.tsx            # Popup interface (React)
│   ├── App.css            # Popup styles
│   ├── store/             # Zustand store
│   └── main.tsx           # Entry point
└── dist/                  # Built extension
```

## 🎨 Features

- Uses Chrome Extension Manifest V3
- React for popup interface
- TypeScript for type-safety
- Vite for fast builds
- Zustand for state management
- Declarative Net Request API for blocking network requests
- Mutation Observer for detecting dynamic ad elements

## 🔧 Settings

The extension automatically blocks ads after installation. You can:
- Enable/disable blocking through popup
- View blocked elements statistics
- Reset statistics counter

## 📝 License

MIT

## 👨‍💻 Author

Created with ❤️ for a better web experience
