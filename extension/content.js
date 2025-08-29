// Content script for SubTracker Chrome extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'AUTH_RESPONSE') {
    handleAuthResponse(request.data);
  }
});

// Handle authentication response
function handleAuthResponse(data) {
  if (data.authenticated) {
    // User is authenticated, proceed with subscription detection
    scanForSubscriptions();
  } else {
    // User not authenticated, show login prompt
    showLoginPrompt();
  }
}

// Scan page for subscription information
function scanForSubscriptions() {
  const subscriptionData = {
    merchantName: '',
    amount: 0,
    currency: 'USD',
    cycle: 'monthly',
    confidence: 'low'
  };

  // Scan for common subscription patterns
  const text = document.body.innerText.toLowerCase();
  
  // Look for pricing information
  const pricePatterns = [
    /\$(\d+(?:\.\d{2})?)\s*(?:per\s*(month|year|week|quarter)|monthly|yearly|weekly|quarterly)/gi,
    /(\d+(?:\.\d{2})?)\s*USD\s*(?:per\s*(month|year|week|quarter)|monthly|yearly|weekly|quarterly)/gi,
    /monthly\s*plan.*?\$(\d+(?:\.\d{2})?)/gi,
    /yearly\s*plan.*?\$(\d+(?:\.\d{2})?)/gi
  ];

  for (const pattern of pricePatterns) {
    const match = pattern.exec(text);
    if (match) {
      subscriptionData.amount = parseFloat(match[1]);
      subscriptionData.currency = 'USD';
      
      // Determine cycle from context
      if (match[2]) {
        subscriptionData.cycle = match[2];
      } else if (text.includes('monthly')) {
        subscriptionData.cycle = 'monthly';
      } else if (text.includes('yearly') || text.includes('annual')) {
        subscriptionData.cycle = 'yearly';
      } else if (text.includes('weekly')) {
        subscriptionData.cycle = 'weekly';
      } else if (text.includes('quarterly')) {
        subscriptionData.cycle = 'quarterly';
      }
      
      subscriptionData.confidence = 'medium';
      break;
    }
  }

  // Look for merchant name
  const title = document.title;
  const domain = window.location.hostname;
  
  if (title) {
    // Extract merchant name from title
    const titleMatch = title.match(/^([^-|–—]+)/);
    if (titleMatch) {
      subscriptionData.merchantName = titleMatch[1].trim();
      subscriptionData.confidence = 'high';
    }
  } else if (domain) {
    // Extract merchant name from domain
    const domainParts = domain.split('.');
    if (domainParts.length >= 2) {
      subscriptionData.merchantName = domainParts[0].charAt(0).toUpperCase() + 
                                     domainParts[0].slice(1);
      subscriptionData.confidence = 'medium';
    }
  }

  // Look for subscription-related keywords
  const subscriptionKeywords = [
    'subscription', 'renewal', 'billing', 'plan', 'premium',
    'pro', 'enterprise', 'team', 'business', 'personal'
  ];

  const hasSubscriptionKeywords = subscriptionKeywords.some(keyword => 
    text.includes(keyword)
  );

  if (hasSubscriptionKeywords && subscriptionData.merchantName) {
    subscriptionData.confidence = 'high';
  }

  // If we found subscription data, send it to background script
  if (subscriptionData.merchantName && subscriptionData.amount > 0) {
    chrome.runtime.sendMessage({
      type: 'SUBSCRIPTION_DETECTED',
      data: subscriptionData
    });

    // Show detection notification
    showDetectionNotification(subscriptionData);
  }
}

// Show subscription detection notification
function showDetectionNotification(data) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10B981;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: 600; font-size: 14px;">Subscription Detected!</span>
      <button id="close-notification" style="margin-left: auto; background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
    </div>
    <div style="font-size: 13px; line-height: 1.4;">
      <div><strong>${data.merchantName}</strong></div>
      <div>$${data.amount} ${data.cycle}</div>
      <div style="margin-top: 8px;">
        <button id="add-subscription" style="background: white; color: #10B981; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-right: 8px;">
          Add to SubTracker
        </button>
        <button id="ignore-subscription" style="background: none; border: 1px solid white; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
          Ignore
        </button>
      </div>
    </div>
  `;

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Handle close button
  document.getElementById('close-notification').addEventListener('click', () => {
    notification.remove();
  });

  // Handle add subscription button
  document.getElementById('add-subscription').addEventListener('click', () => {
    // Open SubTracker in new tab
    chrome.tabs.create({
      url: `https://localhost:3000/subscriptions/new?merchant=${encodeURIComponent(data.merchantName)}&amount=${data.amount}&cycle=${data.cycle}`
    });
    notification.remove();
  });

  // Handle ignore button
  document.getElementById('ignore-subscription').addEventListener('click', () => {
    notification.remove();
  });

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Show login prompt
function showLoginPrompt() {
  const prompt = document.createElement('div');
  prompt.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    color: #333;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    text-align: center;
    max-width: 400px;
  `;

  prompt.innerHTML = `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 24px; font-weight: 600; color: #10B981; margin-bottom: 8px;">🔍</div>
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Subscription Detected!</div>
      <div style="font-size: 14px; color: #666; line-height: 1.5;">
        We found a potential subscription on this page. Sign in to SubTracker to automatically track it.
      </div>
    </div>
    <div>
      <button id="login-subtracker" style="background: #10B981; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; margin-right: 12px;">
        Sign In to SubTracker
      </button>
      <button id="close-prompt" style="background: none; border: 1px solid #ddd; color: #666; padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer;">
        Maybe Later
      </button>
    </div>
  `;

  document.body.appendChild(prompt);

  // Handle login button
  document.getElementById('login-subtracker').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://localhost:3000/sign-in?redirect=' + encodeURIComponent(window.location.href)
    });
    prompt.remove();
  });

  // Handle close button
  document.getElementById('close-prompt').addEventListener('click', () => {
    prompt.remove();
  });
}

// Request authentication status when page loads
chrome.runtime.sendMessage({
  type: 'AUTH_REQUEST',
  data: { url: window.location.href }
});
