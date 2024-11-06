async function loadWebhooks() {
  const { webhooks = [] } = await chrome.storage.sync.get('webhooks');
  const container = document.getElementById('webhookList');
  
  container.innerHTML = '';
  
  webhooks.forEach((webhook, index) => {
    const div = document.createElement('div');
    div.className = 'webhook-item';
    
    // Name and URL inputs
    const nameGroup = document.createElement('div');
    nameGroup.className = 'input-group';
    const nameInput = document.createElement('input');
    nameInput.value = webhook.name || '';
    nameInput.placeholder = 'Button Name';
    nameInput.onchange = () => updateWebhook(index, 'name', nameInput.value);
    nameGroup.appendChild(nameInput);
    
    const urlGroup = document.createElement('div');
    urlGroup.className = 'input-group';
    const urlInput = document.createElement('input');
    urlInput.value = webhook.url || '';
    urlInput.placeholder = 'Webhook URL';
    urlInput.onchange = () => updateWebhook(index, 'url', urlInput.value);
    urlGroup.appendChild(urlInput);
    
    // Checkboxes
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'checkbox-group';
    
    const options = [
      { id: 'screenshots', label: 'Screenshots' },
      { id: 'text', label: 'Page Text' },
      { id: 'copyText', label: 'Copy Text' }
    ];
    
    options.forEach(option => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = webhook[option.id] !== false; // Default to true
      checkbox.onchange = () => updateWebhook(index, option.id, checkbox.checked);
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(option.label));
      checkboxGroup.appendChild(label);
    });
    
    // Domains textarea
    const domainsLabel = document.createElement('label');
    domainsLabel.className = 'domains-label';
    domainsLabel.textContent = 'Allowed Domains (one per line, use * for all domains)';
    
    const domainsInput = document.createElement('textarea');
    domainsInput.value = webhook.domains || '*';
    domainsInput.placeholder = '* for all domains\nexample.com\n*.example.com';
    domainsInput.onchange = () => updateWebhook(index, 'domains', domainsInput.value);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => deleteWebhook(index);
    
    // Append all elements
    div.appendChild(nameGroup);
    div.appendChild(urlGroup);
    div.appendChild(checkboxGroup);
    div.appendChild(domainsLabel);
    div.appendChild(domainsInput);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  });
}

async function updateWebhook(index, field, value) {
  const { webhooks = [] } = await chrome.storage.sync.get('webhooks');
  webhooks[index] = {
    ...webhooks[index],
    [field]: value
  };
  await chrome.storage.sync.set({ webhooks });
}

async function deleteWebhook(index) {
  const { webhooks = [] } = await chrome.storage.sync.get('webhooks');
  webhooks.splice(index, 1);
  await chrome.storage.sync.set({ webhooks });
  loadWebhooks();
}

document.getElementById('addWebhookBtn').onclick = async () => {
  const { webhooks = [] } = await chrome.storage.sync.get('webhooks');
  webhooks.push({
    name: 'New Webhook',
    url: '',
    screenshots: true,
    text: true,
    copyText: false,
    domains: '*'
  });
  await chrome.storage.sync.set({ webhooks });
  loadWebhooks();
};

loadWebhooks();
