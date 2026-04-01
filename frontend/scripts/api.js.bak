const API_BASE = 'http://localhost:8013'

function getToken() { return localStorage.getItem('token') }
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }
}

window.API = {
  async signup(data)          { return _post('/api/auth/signup', data, false) },
  async login(data)           { return _post('/api/auth/login', data, false) },
  async getMe()               { return _get('/api/auth/me') },
  async getAlerts()           { return _get('/api/alerts') },
  async getAlert(id)          { return _get('/api/alerts/' + id) },
  async createAlert(data)     { return _post('/api/alerts', data) },
  async updateAlert(id, data) { return _patch('/api/alerts/' + id, data) },
  async getPrefs()            { return _get('/api/users/me/prefs') },
  async updatePrefs(data)     { return _put('/api/users/me/prefs', data) },
  async updateProfile(data)   { return _put('/api/users/me/profile', data) },
}

async function _get(path) {
  const r = await fetch(API_BASE + path, { headers: authHeaders() })
  return r.json()
}
async function _post(path, data, auth = true) {
  const headers = auth ? authHeaders() : { 'Content-Type': 'application/json' }
  const r = await fetch(API_BASE + path, { method: 'POST', headers, body: JSON.stringify(data) })
  return r.json()
}
async function _put(path, data) {
  const r = await fetch(API_BASE + path, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })
  return r.json()
}
async function _patch(path, data) {
  const r = await fetch(API_BASE + path, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) })
  return r.json()
}
