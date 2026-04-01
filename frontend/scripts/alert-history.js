/* ============================================
   alert-history.js — Tab-based alert list
   ============================================ */

var alertIcons = {
  'Protest': '📢',
  'Construction': '🚧',
  'Elevator Malfunction': '🛗',
  'Weather Hazard': '🌨️',
  'Others': '⚠️'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  var now = new Date()
  var then = new Date(dateStr + 'Z')
  var diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'min ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  return Math.floor(diff / 86400) + 'd ago'
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

function renderCard(alert) {
  var icon = alertIcons[alert.type] || '⚠️'
  var students = alert.report_count === 1 ? '1 student' : alert.report_count + ' students'
  return '<a class="alert-card" data-status="' + alert.status + '" href="alert-detail.html?id=' + alert.id + '">' +
    '<div class="card-icon">' + icon + '</div>' +
    '<div class="card-body">' +
      '<div class="card-title">' + alert.type + ' — ' + alert.building_code + '</div>' +
      '<div class="card-subtitle">' + students + ' · ' + timeAgo(alert.created_at) + '</div>' +
    '</div>' +
    '<span class="card-badge ' + badgeClass(alert.status) + '">' + badgeLabel(alert.status) + '</span>' +
  '</a>'
}

var allAlerts = []
var currentStatus = 'ACTIVE'

function renderList() {
  var container = document.getElementById('history-list-js')
  if (!container) return
  var filtered = allAlerts.filter(function(a) { return a.status === currentStatus })
  if (filtered.length === 0) {
    container.innerHTML = '<div class="alert-empty">No ' + currentStatus.toLowerCase() + ' alerts.</div>'
    return
  }
  container.innerHTML = filtered.map(renderCard).join('')
}

document.addEventListener('DOMContentLoaded', async function() {
  // Fetch alerts
  try {
    var alerts = await window.API.getAlerts()
    if (Array.isArray(alerts)) allAlerts = alerts
  } catch (e) {
    console.warn('Failed to load alerts:', e)
  }
  renderList()

  // Tab click handler
  var tabs = document.getElementById('history-tabs-js')
  if (tabs) {
    tabs.addEventListener('click', function(e) {
      var tab = e.target.closest('.history-tab')
      if (!tab) return
      tabs.querySelectorAll('.history-tab').forEach(function(t) { t.classList.remove('active') })
      tab.classList.add('active')
      currentStatus = tab.getAttribute('data-status')
      renderList()
    })
  }
})
