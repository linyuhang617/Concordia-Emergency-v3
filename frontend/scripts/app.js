/* ============================================
   app.js — Homepage logic
   Crisis mode, offline banner, filter pills,
   alert card rendering, legend toggle, auth UI
   ============================================ */

let isCrisisMode = false
let allAlerts = []
let currentFilter = 'all'

// --- Crisis Mode ---
function toggleCrisisMode() {
  isCrisisMode = !isCrisisMode

  const crisisBtn = document.querySelector('.crisis-btn-js')

  if (isCrisisMode) {
    document.body.classList.add('crisis-mode')
    if (crisisBtn) crisisBtn.textContent = '✕'
  } else {
    document.body.classList.remove('crisis-mode')
    if (crisisBtn) crisisBtn.textContent = '!'
  }
}

// --- Offline Banner ---
function updateOfflineBanner() {
  const banner = document.getElementById('offline-banner')
  if (!banner) return
  banner.style.display = navigator.onLine ? 'none' : 'block'
}

// --- Time Ago ---
function timeAgo(dateStr) {
  if (!dateStr) return ''
  var then = new Date(dateStr)
  if (isNaN(then.getTime())) then = new Date(dateStr + 'Z')
  if (isNaN(then.getTime())) return dateStr
  var now = new Date()
  var diff = Math.floor((now - then) / 1000)
  if (diff < 0) return dateStr
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'min ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  return Math.floor(diff / 86400) + 'd ago'
}

// --- Alert Card HTML ---
const cardAlertIcons = {
  'Protest': '📢',
  'Construction': '🚧',
  'Elevator Malfunction': '🛗',
  'Weather Hazard': '🌨️',
  'Others': '⚠️'
}

function badgeClass(status) {
  if (status === 'ACTIVE') return 'badge-active'
  if (status === 'UNDER REVIEW') return 'badge-review'
  return 'badge-resolved'
}

function badgeLabel(status) {
  if (status === 'ACTIVE') return 'Active'
  if (status === 'UNDER REVIEW') return 'Review'
  return 'Resolved'
}

function renderAlertCard(alert) {
  const icon = cardAlertIcons[alert.type] || '⚠️'
  const students = alert.report_count === 1
    ? '1 student'
    : alert.report_count + ' students'

  return '<a class="alert-card" data-status="' + alert.status + '" href="pages/alert-detail.html?id=' + alert.id + '">' +
    '<div class="card-icon">' + icon + '</div>' +
    '<div class="card-body">' +
      '<div class="card-title">' + alert.type + ' — ' + alert.building_code + '</div>' +
      '<div class="card-subtitle">' + students + ' · ' + timeAgo(alert.created_at) + '</div>' +
    '</div>' +
    '<span class="card-badge ' + badgeClass(alert.status) + '">' + badgeLabel(alert.status) + '</span>' +
  '</a>'
}

// --- Render Alert List ---
function renderAlertList() {
  const container = document.getElementById('alert-list-js')
  if (!container) return

  let filtered = allAlerts
  if (currentFilter !== 'all') {
    filtered = allAlerts.filter(function(a) { return a.status === currentFilter })
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="alert-empty">No alerts found.</div>'
    return
  }

  container.innerHTML = filtered.map(renderAlertCard).join('')
}

// --- Update Active Count Badge ---
function updateActiveCount() {
  const badge = document.getElementById('active-count-js')
  if (!badge) return
  const count = allAlerts.filter(function(a) { return a.status === 'ACTIVE' }).length
  badge.textContent = count
}

// --- Fetch Alerts ---
async function fetchAlerts() {
  if (!navigator.onLine) return
  try {
    const alerts = await window.API.getAlerts()
    if (!Array.isArray(alerts)) return
    allAlerts = alerts
    updateActiveCount()
    updateSummary()
    renderAlertList()
  } catch (e) {
    console.warn('Failed to fetch alerts:', e)
  }
}

// --- Filter Pills ---
function initFilters() {
  const bar = document.getElementById('filter-bar-js')
  if (!bar) return
  bar.addEventListener('click', function(e) {
    const pill = e.target.closest('.filter-pill')
    if (!pill) return
    bar.querySelectorAll('.filter-pill').forEach(function(p) { p.classList.remove('active') })
    pill.classList.add('active')
    currentFilter = pill.getAttribute('data-filter')
    renderAlertList()
  })
}

// --- Legend Toggle (mobile) ---
function initLegend() {
  const toggle = document.getElementById('legend-toggle-js')
  const legend = document.getElementById('map-legend-js')
  if (!toggle || !legend) return
  toggle.addEventListener('click', function() {
    legend.classList.toggle('collapsed')
    toggle.classList.toggle('expanded')
  })
}

// --- Auth UI (show avatar or login link) ---
async function initAuthUI() {
  const token = localStorage.getItem('token')
  const avatarBtn = document.querySelector('.avatar-btn-js')
  if (!token) {
    if (avatarBtn) {
      avatarBtn.textContent = '→'
      avatarBtn.title = 'Log In'
      avatarBtn.onclick = function() { window.location.href = 'pages/login.html' }
    }
    return
  }

  try {
    const user = await window.API.getMe()
    if (user.detail) return
    if (avatarBtn) {
      avatarBtn.textContent = user.username.charAt(0).toUpperCase()
      avatarBtn.title = user.username
    }
  } catch (e) {
    console.warn('Auth check failed:', e)
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async function() {
  // Map
  const map = initMap()
  initLocationFeatures(map)
  addDestinationSearch(map)

  // Offline
  updateOfflineBanner()
  window.addEventListener('offline', updateOfflineBanner)
  window.addEventListener('online', updateOfflineBanner)

  // Crisis
  const crisisBtn = document.querySelector('.crisis-btn-js')
  if (crisisBtn) crisisBtn.addEventListener('click', toggleCrisisMode)

  // Filters
  initFilters()

  // Legend
  initLegend()

  // Alerts
  await fetchAlerts()
  setInterval(fetchAlerts, 30000)

  // Auth
  await initAuthUI()
})

function updateSummary() {
  var el = document.getElementById('alert-summary-js')
  if (!el) return
  var active = allAlerts.filter(function(a) { return a.status === 'ACTIVE' }).length
  var review = allAlerts.filter(function(a) { return a.status === 'UNDER REVIEW' }).length
  var total = allAlerts.length
  el.textContent = total + ' total · ' + active + ' active · ' + review + ' under review'
}
