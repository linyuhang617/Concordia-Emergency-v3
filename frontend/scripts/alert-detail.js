/* ============================================
   alert-detail.js — Single alert detail page
   ============================================ */

var alertIcons = {
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

document.addEventListener('DOMContentLoaded', async function() {
  var params = new URLSearchParams(window.location.search)
  var id = params.get('id')
  if (!id) {
    window.location.href = 'alert-history.html'
    return
  }

  try {
    var alert = await window.API.getAlert(id)
    if (!alert || alert.detail) {
      window.location.href = 'alert-history.html'
      return
    }

    var icon = alertIcons[alert.type] || '⚠️'

    // Title
    var title = document.getElementById('detail-title-js')
    if (title) title.textContent = icon + ' ' + alert.type + ' — ' + alert.building_code

    // Badge
    var badge = document.getElementById('detail-badge-js')
    if (badge) {
      badge.textContent = alert.status
      badge.className = 'detail-badge ' + badgeClass(alert.status)
    }

    // Verification
    var verif = document.getElementById('detail-verification-js')
    if (verif) {
      verif.textContent = alert.report_count === 1
        ? 'Reported by 1 student'
        : 'Reported by ' + alert.report_count + ' students'
    }

    // Status
    var statusEl = document.getElementById('detail-status-js')
    if (statusEl) statusEl.textContent = alert.status

    // Description
    var desc = document.getElementById('detail-desc-js')
    if (desc) desc.textContent = alert.description

    // Created
    var created = document.getElementById('detail-created-js')
    if (created) created.textContent = alert.created_at || '—'

    // Updated
    var updated = document.getElementById('detail-updated-js')
    if (updated) updated.textContent = alert.updated_at || '—'

    // Review button (show only if logged in)
    var token = localStorage.getItem('token')
    var reviewBtn = document.getElementById('review-btn-js')
    if (reviewBtn && token) {
      reviewBtn.style.display = ''
      reviewBtn.addEventListener('click', function() {
        window.location.href = 'alert-review.html?id=' + id
      })
    }
  } catch (e) {
    console.warn('Failed to load alert:', e)
  }
})
