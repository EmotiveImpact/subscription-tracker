// Injected script for SubTracker Chrome extension

(function() {
  'use strict';
  
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanPage);
  } else {
    scanPage();
  }
  
  function scanPage() {
    // Delay scanning to ensure dynamic content is loaded
    setTimeout(() => {
      const subscriptionData = scanForSubscriptionInfo();
      if (subscriptionData.merchantName && subscriptionData.amount > 0) {
        // Send data to content script
        window.postMessage({
          type: 'SUBSCRIPTION_SCANNED',
          data: subscriptionData
        }, '*');
      }
    }, 2000);
  }
  
  function scanForSubscriptionInfo() {
    const data = {
      merchantName: '',
      amount: 0,
      currency: 'USD',
      cycle: 'monthly',
      confidence: 'low',
      source: 'page_scan'
    };
    
    // Extract merchant name from various sources
    data.merchantName = extractMerchantName();
    
    // Extract pricing information
    const pricing = extractPricingInfo();
    if (pricing) {
      data.amount = pricing.amount;
      data.currency = pricing.currency;
      data.cycle = pricing.cycle;
      data.confidence = pricing.confidence;
    }
    
    // Extract subscription details
    const subscription = extractSubscriptionDetails();
    if (subscription) {
      data.confidence = 'high';
    }
    
    return data;
  }
  
  function extractMerchantName() {
    // Try to get merchant name from various sources
    
    // 1. Page title
    const title = document.title;
    if (title) {
      const titleMatch = title.match(/^([^-|–—]+)/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }
    
    // 2. Domain name
    const domain = window.location.hostname;
    if (domain) {
      const domainParts = domain.split('.');
      if (domainParts.length >= 2) {
        return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      }
    }
    
    // 3. H1 tags
    const h1Tags = document.querySelectorAll('h1');
    for (const h1 of h1Tags) {
      const text = h1.textContent.trim();
      if (text && text.length < 50) {
        return text;
      }
    }
    
    // 4. Logo alt text
    const logos = document.querySelectorAll('img[alt*="logo"], img[alt*="Logo"]');
    for (const logo of logos) {
      const alt = logo.alt;
      if (alt && !alt.includes('logo')) {
        return alt.trim();
      }
    }
    
    return '';
  }
  
  function extractPricingInfo() {
    const text = document.body.innerText.toLowerCase();
    
    // Look for pricing patterns
    const pricePatterns = [
      // $9.99/month, $9.99 per month
      /\$(\d+(?:\.\d{2})?)\s*(?:per\s*(month|year|week|quarter)|monthly|yearly|weekly|quarterly)/gi,
      // 9.99 USD/month
      /(\d+(?:\.\d{2})?)\s*USD\s*(?:per\s*(month|year|week|quarter)|monthly|yearly|weekly|quarterly)/gi,
      // Monthly plan $9.99
      /(?:monthly|yearly|weekly|quarterly)\s*plan.*?\$(\d+(?:\.\d{2})?)/gi,
      // $9.99 billed monthly
      /\$(\d+(?:\.\d{2})?)\s*billed\s*(monthly|yearly|weekly|quarterly)/gi,
      // Starting at $9.99/month
      /starting\s*at\s*\$(\d+(?:\.\d{2})?)\/(month|year|week|quarter)/gi
    ];
    
    for (const pattern of pricePatterns) {
      const match = pattern.exec(text);
      if (match) {
        const amount = parseFloat(match[1]);
        let cycle = 'monthly';
        
        if (match[2]) {
          cycle = match[2];
        } else if (text.includes('monthly')) {
          cycle = 'monthly';
        } else if (text.includes('yearly') || text.includes('annual')) {
          cycle = 'yearly';
        } else if (text.includes('weekly')) {
          cycle = 'weekly';
        } else if (text.includes('quarterly')) {
          cycle = 'quarterly';
        }
        
        return {
          amount,
          currency: 'USD',
          cycle,
          confidence: 'medium'
        };
      }
    }
    
    // Look for price elements
    const priceElements = document.querySelectorAll('[class*="price"], [class*="Price"], [id*="price"], [id*="Price"]');
    for (const element of priceElements) {
      const text = element.textContent;
      const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        const amount = parseFloat(priceMatch[1]);
        let cycle = 'monthly';
        
        // Determine cycle from context
        const context = element.textContent.toLowerCase();
        if (context.includes('year') || context.includes('annual')) {
          cycle = 'yearly';
        } else if (context.includes('week')) {
          cycle = 'weekly';
        } else if (context.includes('quarter')) {
          cycle = 'quarterly';
        }
        
        return {
          amount,
          currency: 'USD',
          cycle,
          confidence: 'medium'
        };
      }
    }
    
    return null;
  }
  
  function extractSubscriptionDetails() {
    const text = document.body.innerText.toLowerCase();
    
    // Look for subscription-related keywords
    const subscriptionKeywords = [
      'subscription', 'renewal', 'billing', 'plan', 'premium',
      'pro', 'enterprise', 'team', 'business', 'personal',
      'monthly', 'yearly', 'annual', 'weekly', 'quarterly',
      'recurring', 'auto-renew', 'auto renew'
    ];
    
    const hasSubscriptionKeywords = subscriptionKeywords.some(keyword => 
      text.includes(keyword)
    );
    
    if (hasSubscriptionKeywords) {
      return {
        type: 'subscription',
        confidence: 'high'
      };
    }
    
    return null;
  }
  
  // Listen for messages from content script
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'SCAN_REQUEST') {
      const subscriptionData = scanForSubscriptionInfo();
      if (subscriptionData.merchantName && subscriptionData.amount > 0) {
        window.postMessage({
          type: 'SUBSCRIPTION_SCANNED',
          data: subscriptionData
        }, '*');
      }
    }
  });
  
})();
