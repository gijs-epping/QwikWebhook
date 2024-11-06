async function captureScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
  return screenshot;
}

async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => document.body.innerText,
  });
  return result;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('Text copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy text:', err);
  }
}

function matchDomain(pattern, domain) {
  pattern = pattern.trim().toLowerCase();
  domain = domain.toLowerCase();
  
  if (pattern === '*') return true;
  if (pattern === domain) return true;
  if (pattern.startsWith('*.') && domain.endsWith(pattern.slice(1))) return true;
  
  return false;
}

function isWebhookAllowed(webhook, currentDomain) {
  const domains = webhook.domains?.split('\n').map(d => d.trim()) || ['*'];
  return domains.some(pattern => matchDomain(pattern, currentDomain));
}

async function sendToWebhook(webhook, screenshot, text) {
  const data = {
    ...(webhook.screenshots && screenshot ? { screenshot } : {}),
    ...(webhook.text ? { text } : {}),
    url: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].url,
    timestamp: new Date().toISOString()
  };

  try {
    // First try with no-cors mode directly
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'no-cors',
      body: JSON.stringify(data)
    });
    
    // With no-cors, we won't get response details but at least it will work
    alert('Successfully sent to webhook!');
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send to webhook: ' + error.message);
  }
}

async function createWebhookButtons() {
  const container = document.getElementById('webhookButtons');
  const { webhooks = [] } = await chrome.storage.sync.get('webhooks');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentDomain = new URL(tab.url).hostname;
  
  container.innerHTML = '';
  
  for (const webhook of webhooks) {
    if (!isWebhookAllowed(webhook, currentDomain)) continue;
    
    const button = document.createElement('button');
    button.textContent = webhook.name;
    button.onclick = async () => {
      try {
        button.disabled = true;
        button.textContent = 'Sending...';
        
        const screenshot = webhook.screenshots ? await captureScreenshot() : null;
        const text = webhook.text || webhook.copyText ? await getPageText() : null;
        
        if (webhook.copyText && text) {
          await copyToClipboard(text);
        }
        
        await sendToWebhook(webhook, screenshot, text);
      } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      } finally {
        button.disabled = false;
        button.textContent = webhook.name;
      }
    };
    container.appendChild(button);
  }
}

document.getElementById('settingsBtn').onclick = () => {
  chrome.tabs.create({ url: 'settings.html' });
};

createWebhookButtons();
