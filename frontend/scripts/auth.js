function getToken() {
  return localStorage.getItem('token')
}

function isAuthenticated() {
  return Boolean(getToken())
}

function logout() {
  localStorage.removeItem('token')
  window.location.href = '/index.html'
}

// Apply text size preference to .device element
function applyTextSize(size) {
  var device = document.querySelector('.device')
  if (device) device.setAttribute('data-text-size', size || 'medium')
}

// Load and apply text size on page load (non-blocking)
function loadTextSize() {
  // Check localStorage cache first for instant apply
  var cached = localStorage.getItem('v3-text-size')
  if (cached) applyTextSize(cached)

  // Then fetch latest from API (if logged in)
  if (!getToken()) return
  window.API.getPrefs().then(function(prefs) {
    var size = prefs.text_size || 'medium'
    localStorage.setItem('v3-text-size', size)
    applyTextSize(size)
  }).catch(function() {})
}

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', loadTextSize)

async function checkAuth() {
  const token = getToken()
  if (!token) {
    window.location.href = '/index.html'
    return null
  }
  try {
    const data = await window.API.getMe()
    if (data.detail) {
      localStorage.removeItem('token')
      window.location.href = '/index.html'
      return null
    }
    return data
  } catch (e) {
    localStorage.removeItem('token')
    window.location.href = '/index.html'
    return null
  }
}
