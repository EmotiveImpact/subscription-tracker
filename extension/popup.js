// Popup script for SubTracker Chrome extension

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize popup
  await initializePopup();
  
  // Set up event listeners
  setupEventListeners();
});

async function initializePopup() {
  try {
    // Get subscription data from storage
    const storage = await chrome.storage.local.get();
    
    // Count total subscriptions
    const subscriptionKeys = Object.keys(storage).filter(key => 
      key.startsWith('subscription_')
    );
    
    // Calculate monthly total
    let monthlyTotal = 0;
    subscriptionKeys.forEach(key => {
      const subscription = storage[key];
      if (subscription.amount && subscription.cycle) {
        if (subscription.cycle === 'monthly') {
          monthlyTotal += subscription.amount;
        } else if (subscription.cycle === 'yearly') {
          monthlyTotal += subscription.amount / 12;
        } else if (subscription.cycle === 'weekly') {
          monthlyTotal += subscription.amount * 4.33; // Average weeks per month
        } else if (subscription.cycle === 'quarterly') {
          monthlyTotal += subscription.amount / 3;
        }
      }
    });
    
    // Update stats
    document.getElementById('total-subscriptions').textContent = subscriptionKeys.length;
    document.getElementById('monthly-total').textContent = `$${monthlyTotal.toFixed(2)}`;
    
    // Update discoveries list
    updateDiscoveriesList(storage, subscriptionKeys);
    
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

function updateDiscoveriesList(storage, subscriptionKeys) {
  const discoveriesList = document.getElementById('discoveries-list');
  
  if (subscriptionKeys.length === 0) {
    discoveriesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">No discoveries yet. Browse subscription websites to detect them automatically.</div>
      </div>
    `;
    return;
  }
  
  // Get recent discoveries (last 5)
  const recentDiscoveries = subscriptionKeys
    .map(key => storage[key])
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
  
  const discoveriesHTML = recentDiscoveries.map(discovery => `
    <div class="discovery-item">
      <div class="discovery-icon">💳</div>
      <div class="discovery-info">
        <div class="discovery-name">${discovery.merchantName}</div>
        <div class="discovery-details">$${discovery.amount} ${discovery.cycle}</div>
      </div>
      <div class="discovery-actions">
        <button class="action-btn" onclick="viewDiscovery('${discovery.merchantName}', ${discovery.amount}, '${discovery.cycle}')">View</button>
        <button class="action-btn" onclick="addToSubTracker('${discovery.merchantName}', ${discovery.amount}, '${discovery.cycle}')">Add</button>
      </div>
    </div>
  `).join('');
  
  discoveriesList.innerHTML = discoveriesHTML;
}

function setupEventListeners() {
  // Add subscription button
  document.getElementById('add-subscription').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://localhost:3000/subscriptions/new'
    });
  });
  
  // View dashboard button
  document.getElementById('view-dashboard').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://localhost:3000/dashboard'
    });
  });
  
  // Settings button
  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://localhost:3000/settings'
    });
  });
}

// Global functions for discovery actions
window.viewDiscovery = function(merchantName, amount, cycle) {
  chrome.tabs.create({
    url: `https://localhost:3000/discoveries?merchant=${encodeURIComponent(merchantName)}&amount=${amount}&cycle=${cycle}`
  });
};

window.addToSubTracker = function(merchantName, amount, cycle) {
  chrome.tabs.create({
    url: `https://localhost:3000/subscriptions/new?merchant=${encodeURIComponent(merchantName)}&amount=${amount}&cycle=${cycle}`
  });
};
