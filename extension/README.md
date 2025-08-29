# Subscription Tracker Chrome Extension

A powerful Chrome extension that automatically detects and tracks your subscriptions across the web.

## 🚀 Quick Setup

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"**
4. Select this `extension` folder
5. The extension should now appear in your extensions list

### 2. Test the Extension
1. **Click the extension icon** in your Chrome toolbar
2. **Visit subscription websites** like:
   - Netflix (`netflix.com`)
   - Spotify (`spotify.com`)
   - Notion (`notion.so`)
   - Figma (`figma.com`)
3. **Check the popup** for detected subscriptions

## 🎯 Features

- **AI-Powered Detection**: Advanced pattern matching for subscription recognition
- **Merchant Recognition**: Automatically identifies 50+ known services
- **Confidence Scoring**: Shows detection accuracy for each finding
- **Multi-Source Analysis**: Scans text, HTML, forms, and metadata
- **Real-time Updates**: Detects subscriptions as you browse

## 🔧 Files Overview

- **`manifest.json`** - Extension configuration
- **`popup.html/js`** - Extension popup interface
- **`background.js`** - Service worker for background tasks
- **`content.js`** - Script injected into web pages
- **`injected.js`** - Enhanced subscription detection
- **`enhanced-detection.js`** - AI-powered detection system

## 🎨 Icons

The extension currently uses placeholder icons. To create proper icons:

1. **Use the SVG file**: `icon.svg` contains the design
2. **Convert to PNG**: Use online tools like:
   - [Convertio](https://convertio.co/svg-png/)
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
3. **Replace placeholders**: Replace `icon16.png`, `icon32.png`, etc.

## 🧪 Testing

### High-Confidence Sites
- **Netflix** - Should detect streaming subscription
- **Spotify** - Should detect music subscription
- **Notion** - Should detect productivity tool

### Medium-Confidence Sites
- **GitHub** - Should detect development tool
- **Figma** - Should detect design tool
- **Stripe** - Should detect business tool

### Expected Behavior
1. Extension loads without errors
2. Popup shows subscription information when available
3. Detection works on subscription-related pages
4. Confidence scores are displayed
5. Merchant names are automatically recognized

## 🐛 Troubleshooting

### Extension Won't Load
- Check Chrome console for errors (F12 → Console)
- Verify `manifest.json` syntax
- Make sure all files are in the extension folder

### Detection Not Working
- Check extension popup for error messages
- Verify page has subscription-related content
- Check browser console for JavaScript errors
- Try refreshing the page after loading extension

### Popup is Empty
- Check if extension is enabled
- Verify popup files are loading correctly
- Check for JavaScript errors in popup console

## 📱 Browser Support

- **Chrome**: Full support (tested)
- **Edge**: Should work (Chromium-based)
- **Firefox**: May require manifest v2 conversion
- **Safari**: Not supported (different extension system)

## 🔒 Permissions

The extension requests these permissions:
- **`activeTab`**: Access to current tab for detection
- **`storage`**: Save user preferences and data
- **`notifications`**: Show detection alerts

## 🚀 Development

To modify the extension:
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the extension
4. Test your changes

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Look for error messages in Chrome console
3. Verify all files are present and correct
4. Try reloading the extension

---

**Note**: This extension is designed for educational and personal use. Always respect website terms of service and privacy policies.
