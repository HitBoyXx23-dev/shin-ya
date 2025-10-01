let requests = JSON.parse(localStorage.getItem('requests') || '[]');
let currentRequestIndex = null;

const requestList = document.getElementById('request-list');
const methodSelect = document.getElementById('method');
const urlInput = document.getElementById('url');
const bodyInput = document.getElementById('body');
const sendBtn = document.getElementById('send');
const responseDiv = document.getElementById('response');
const newRequestBtn = document.getElementById('new-request');
const headerListDiv = document.getElementById('header-list');
const addHeaderBtn = document.getElementById('add-header');
const queryListDiv = document.getElementById('query-list');
const addQueryBtn = document.getElementById('add-query');
const tabsDiv = document.getElementById('tabs');

function saveRequests() {
  localStorage.setItem('requests', JSON.stringify(requests));
}

function renderRequestList() {
  requestList.innerHTML = '';
  requests.forEach((req, i) => {
    const btn = document.createElement('button');
    btn.textContent = req.url || 'New Request';
    btn.onclick = () => loadRequest(i);
    requestList.appendChild(btn);
  });
}

function loadRequest(index) {
  currentRequestIndex = index;
  const req = requests[index];
  urlInput.value = req.url || '';
  methodSelect.value = req.method || 'GET';
  bodyInput.value = req.body || '';
  renderHeaders(req.headers || []);
  renderQueryParams(req.query || []);
  renderTabs();
  responseDiv.textContent = req.response || '';
}

function renderHeaders(headers) {
  headerListDiv.innerHTML = '';
  headers.forEach((h, i) => {
    const container = document.createElement('div');
    const keyInput = document.createElement('input');
    keyInput.placeholder = 'Key';
    keyInput.value = h.key;
    const valueInput = document.createElement('input');
    valueInput.placeholder = 'Value';
    valueInput.value = h.value;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.onclick = () => {
      headers.splice(i, 1);
      renderHeaders(headers);
      if(currentRequestIndex !== null) requests[currentRequestIndex].headers = headers;
      saveRequests();
    };
    container.appendChild(keyInput);
    container.appendChild(valueInput);
    container.appendChild(removeBtn);
    headerListDiv.appendChild(container);

    keyInput.oninput = valueInput.oninput = () => {
      headers[i] = { key: keyInput.value, value: valueInput.value };
      if(currentRequestIndex !== null) requests[currentRequestIndex].headers = headers;
      saveRequests();
    };
  });
}

function renderQueryParams(params) {
  queryListDiv.innerHTML = '';
  params.forEach((q, i) => {
    const container = document.createElement('div');
    const keyInput = document.createElement('input');
    keyInput.placeholder = 'Key';
    keyInput.value = q.key;
    const valueInput = document.createElement('input');
    valueInput.placeholder = 'Value';
    valueInput.value = q.value;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.onclick = () => {
      params.splice(i,1);
      renderQueryParams(params);
      if(currentRequestIndex !== null) requests[currentRequestIndex].query = params;
      saveRequests();
    };
    container.appendChild(keyInput);
    container.appendChild(valueInput);
    container.appendChild(removeBtn);
    queryListDiv.appendChild(container);

    keyInput.oninput = valueInput.oninput = () => {
      params[i] = { key: keyInput.value, value: valueInput.value };
      if(currentRequestIndex !== null) requests[currentRequestIndex].query = params;
      saveRequests();
    };
  });
}

addHeaderBtn.onclick = () => {
  let headers = currentRequestIndex !== null ? requests[currentRequestIndex].headers || [] : [];
  headers.push({key:'', value:''});
  renderHeaders(headers);
  if(currentRequestIndex !== null) {
    requests[currentRequestIndex].headers = headers;
    saveRequests();
  }
}

addQueryBtn.onclick = () => {
  let params = currentRequestIndex !== null ? requests[currentRequestIndex].query || [] : [];
  params.push({key:'', value:''});
  renderQueryParams(params);
  if(currentRequestIndex !== null) {
    requests[currentRequestIndex].query = params;
    saveRequests();
  }
}

sendBtn.onclick = async () => {
  let url = urlInput.value;
  const method = methodSelect.value;
  let headers = currentRequestIndex !== null ? requests[currentRequestIndex].headers || [] : [];
  let params = currentRequestIndex !== null ? requests[currentRequestIndex].query || [] : [];
  
  if(params.length) {
    const queryString = params.map(p=>`${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  let options = { method, headers: {} };
  headers.forEach(h => { if(h.key) options.headers[h.key] = h.value; });

  if(method==='POST' || method==='PUT' || method==='PATCH') {
    try {
      options.body = JSON.stringify(JSON.parse(bodyInput.value));
      options.headers['Content-Type'] = 'application/json';
    } catch {
      responseDiv.textContent = 'Invalid JSON body';
      return;
    }
  }

  responseDiv.textContent = 'Loading...';
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      responseDiv.textContent = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      responseDiv.textContent = text;
    }

    if(currentRequestIndex === null) {
      requests.push({ url, method, body: bodyInput.value, headers, query: params, response: text });
      currentRequestIndex = requests.length-1;
    } else {
      requests[currentRequestIndex] = { url, method, body: bodyInput.value, headers, query: params, response: text };
    }
    saveRequests();
    renderRequestList();
    renderTabs();
  } catch(err) {
    responseDiv.textContent = 'Error: '+err;
  }
}

newRequestBtn.onclick = () => {
  currentRequestIndex = null;
  urlInput.value = '';
  bodyInput.value = '';
  methodSelect.value = 'GET';
  responseDiv.textContent = '';
  renderHeaders([]);
  renderQueryParams([]);
}

function renderTabs() {
  tabsDiv.innerHTML = '';
  requests.forEach((r,i)=>{
    const tab = document.createElement('div');
    tab.className = 'tab' + (i===currentRequestIndex?' active':'');
    tab.textContent = r.url || 'New';
    tab.onclick = ()=>loadRequest(i);
    tabsDiv.appendChild(tab);
  });
}

renderRequestList();
renderTabs();
