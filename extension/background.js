// Background script for SubTracker Chrome extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('SubTracker extension installed');
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://localhost:3000/welcome'
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SUBSCRIPTION_DETECTED') {
    handleSubscriptionDetection(request.data, sender.tab);
  } else if (request.type === 'AUTH_REQUEST') {
    handleAuthRequest(request.data, sender.tab);
  }
  
  return true; // Keep message channel open for async response
});

// Handle subscription detection
async function handleSubscriptionDetection(data, tab) {
  try {
    // Store detected subscription data
    await chrome.storage.local.set({
      [`subscription_${Date.now()}`]: {
        ...data,
        tabId: tab.id,
        url: tab.url,
        timestamp: Date.now()
      }
    });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Subscription Detected',
      message: `Found potential subscription: ${data.merchantName}`
    });

    // Update badge
    const currentCount = await getPendingSubscriptionsCount();
    chrome.action.setBadgeText({ text: currentCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  } catch (error) {
    console.error('Error handling subscription detection:', error);
  }
}

// Handle authentication request
async function handleAuthRequest(data, tab) {
  try {
    // Check if user is authenticated
    const authToken = await chrome.storage.local.get('authToken');
    
    if (authToken.authToken) {
      // User is authenticated, send token back
      chrome.tabs.sendMessage(tab.id, {
        type: 'AUTH_RESPONSE',
        data: { authenticated: true, token: authToken.authToken }
      });
    } else {
      // User not authenticated, redirect to login
      chrome.tabs.update(tab.id, {
        url: 'https://localhost:3000/sign-in?redirect=' + encodeURIComponent(tab.url)
      });
    }
  } catch (error) {
    console.error('Error handling auth request:', error);
  }
}

// Get count of pending subscriptions
async function getPendingSubscriptionsCount() {
  try {
    const storage = await chrome.storage.local.get();
    const subscriptionKeys = Object.keys(storage).filter(key => 
      key.startsWith('subscription_')
    );
    return subscriptionKeys.length;
  } catch (error) {
    console.error('Error getting subscription count:', error);
    return 0;
  }
}

// Listen for tab updates to detect subscription-related pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a known subscription service
    const subscriptionDomains = [
      'netflix.com',
      'spotify.com',
      'amazon.com',
      'hulu.com',
      'disneyplus.com',
      'youtube.com',
      'github.com',
      'figma.com',
      'notion.so',
      'slack.com'
    ];

    const domain = new URL(tab.url).hostname;
    if (subscriptionDomains.some(sd => domain.includes(sd))) {
      // Inject content script to scan for subscription info
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['injected.js']
      });
    }
  }
});
