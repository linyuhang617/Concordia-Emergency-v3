/* ============================================
   profile.js — V3: expandable settings cards
   Uses window.API and window.checkAuth (no ES modules)
   ============================================ */

var currentUser = null
var currentPrefs = null

async function init() {
  currentUser = await window.checkAuth()
  if (!currentUser) return

  var nameEl = document.querySelector('.username-js')
  if (nameEl) nameEl.textContent = currentUser.username

  var emailEl = document.querySelector('.user-email-js')
  if (emailEl) emailEl.textContent = currentUser.email

  var avatarEl = document.getElementById('avatar-js')
  if (avatarEl) avatarEl.textContent = currentUser.username.charAt(0).toUpperCase()

  currentPrefs = await window.API.getPrefs()
  renderAllSections()

  // Logout
  var logoutBtn = document.querySelector('.logOut-js')
  if (logoutBtn) logoutBtn.addEventListener('click', window.logout)

  // Expandable cards
  document.querySelectorAll('.settings-card-header').forEach(function(header) {
    header.addEventListener('click', function() {
      header.parentElement.classList.toggle('expanded')
    })
  })
}

function renderAllSections() {
  renderSafety()
  renderNavigation()
  renderNotification()
  renderQuietHours()
}

// --- Safety ---
function renderSafety() {
  var items = currentPrefs.safety && currentPrefs.safety.length > 0
    ? currentPrefs.safety : ['None Selected']
  var html = '<div style="margin-bottom:12px">' +
    items.map(function(i) { return '<div class="settings-row"><span class="row-label">' + i + '</span></div>' }).join('') +
    '</div>' +
    '<button type="button" class="btn-outline safety-edit-js" style="width:100%">Edit</button>'
  document.querySelector('.safety-inner-card-js').innerHTML = html
  document.querySelector('.safety-edit-js').addEventListener('click', editSafety)
}

function editSafety() {
  var checked = function(val) { return currentPrefs.safety && currentPrefs.safety.includes(val) ? 'checked' : '' }
  document.querySelector('.safety-inner-card-js').innerHTML =
    '<div class="option-group" style="margin-bottom:12px">' +
      '<label class="option-item"><input type="checkbox" name="accessibility" value="Wheelchair User" ' + checked('Wheelchair User') + '> Wheelchair User</label>' +
      '<label class="option-item"><input type="checkbox" name="accessibility" value="Uses Crutches / Mobility Aid" ' + checked('Uses Crutches / Mobility Aid') + '> Uses Crutches / Mobility Aid</label>' +
      '<label class="option-item"><input type="checkbox" name="accessibility" value="Avoid Stairs" ' + checked('Avoid Stairs') + '> Avoid Stairs</label>' +
      '<label class="option-item"><input type="checkbox" name="accessibility" value="Avoid Steep Slopes" ' + checked('Avoid Steep Slopes') + '> Avoid Steep Slopes</label>' +
      '<label class="option-item"><input type="checkbox" name="accessibility" value="Visual Impairment" ' + checked('Visual Impairment') + '> Visual Impairment</label>' +
      '<label class="option-item"><input type="checkbox" name="accessibility" value="Anxiety-Sensitive Mode" ' + checked('Anxiety-Sensitive Mode') + '> Anxiety-Sensitive Mode</label>' +
      '<label class="option-item"><input type="checkbox" name="accessibility" value="Prefer Low-Crowd Routes" ' + checked('Prefer Low-Crowd Routes') + '> Prefer Low-Crowd Routes</label>' +
    '</div>' +
    '<button type="button" class="btn-primary save-safety-js" style="width:100%">Save</button>'
  document.querySelector('.save-safety-js').addEventListener('click', saveSafety)
}

async function saveSafety() {
  var cbs = document.querySelectorAll('input[name="accessibility"]:checked')
  var safety = Array.from(cbs).map(function(c) { return c.value })
  currentPrefs = await window.API.updatePrefs({ safety: safety })
  await window.API.updateProfile({ accessibility: safety })
  renderSafety()
}

// --- Navigation ---
function renderNavigation() {
  var p = currentPrefs
  document.querySelector('.navigation-inner-card-js').innerHTML =
    '<div style="margin-bottom:12px">' +
      '<div class="settings-row"><span class="row-label">Route Preference</span><span class="row-value">' + (p.route_preference || 'fastest') + '</span></div>' +
      '<div class="settings-row"><span class="row-label">Elevator Preference</span><span class="row-value">' + (p.elevator_preference || 'prioritize') + '</span></div>' +
      '<div class="settings-row"><span class="row-label">Text Size</span><span class="row-value">' + (p.text_size || 'medium') + '</span></div>' +
      '<div class="settings-row"><span class="row-label">Color Mode</span><span class="row-value">' + (p.color_mode || 'standard') + '</span></div>' +
    '</div>' +
    '<button type="button" class="btn-outline navigation-edit-js" style="width:100%">Edit</button>'
  document.querySelector('.navigation-edit-js').addEventListener('click', editNavigation)
}

function editNavigation() {
  var p = currentPrefs
  document.querySelector('.navigation-inner-card-js').innerHTML =
    '<div style="margin-bottom:12px">' +
      '<div class="form-group"><label class="form-label">Route Preference</label>' +
        '<select class="form-select" id="route"><option value="fastest"' + (p.route_preference === 'fastest' ? ' selected' : '') + '>Fastest</option><option value="safest"' + (p.route_preference === 'safest' ? ' selected' : '') + '>Safest</option><option value="accessible"' + (p.route_preference === 'accessible' ? ' selected' : '') + '>Accessible</option></select></div>' +
      '<div class="form-group"><label class="form-label">Elevator Preference</label>' +
        '<select class="form-select" id="elevator"><option value="prioritize"' + (p.elevator_preference === 'prioritize' ? ' selected' : '') + '>Prioritize</option><option value="avoid"' + (p.elevator_preference === 'avoid' ? ' selected' : '') + '>Avoid</option></select></div>' +
      '<div class="form-group"><label class="form-label">Text Size</label>' +
        '<select class="form-select" id="text"><option value="small"' + (p.text_size === 'small' ? ' selected' : '') + '>Small</option><option value="medium"' + (p.text_size === 'medium' ? ' selected' : '') + '>Medium</option><option value="large"' + (p.text_size === 'large' ? ' selected' : '') + '>Large</option></select></div>' +
      '<div class="form-group"><label class="form-label">Color Mode</label>' +
        '<select class="form-select" id="color"><option value="standard"' + (p.color_mode === 'standard' ? ' selected' : '') + '>Standard</option><option value="high-contrast"' + (p.color_mode === 'high-contrast' ? ' selected' : '') + '>High Contrast</option></select></div>' +
    '</div>' +
    '<button type="button" class="btn-primary save-nav-js" style="width:100%">Save</button>'
  document.querySelector('.save-nav-js').addEventListener('click', saveNavigation)
}

async function saveNavigation() {
  currentPrefs = await window.API.updatePrefs({
    route_preference: document.getElementById('route').value,
    elevator_preference: document.getElementById('elevator').value,
    text_size: document.getElementById('text').value,
    color_mode: document.getElementById('color').value
  })
  renderNavigation()
}

// --- Notifications ---
function renderNotification() {
  var p = currentPrefs
  var row = function(label, key) {
    var on = p[key] === 'true'
    return '<div class="settings-row"><span class="row-label">' + label + '</span><span class="row-value">' + (on ? '🔔 ON' : '🔕 OFF') + '</span></div>'
  }
  document.querySelector('.notification-inner-card-js').innerHTML =
    '<div style="margin-bottom:12px">' +
      '<div class="settings-row"><span class="row-label">Emergency Alert</span><span class="row-value">🔒 ON</span></div>' +
      row('Protest', 'notification_protest') +
      row('Construction', 'notification_construction') +
      row('Weather', 'notification_weather') +
      row('Elevator Issues', 'notification_elevator') +
      row('General Notices', 'notification_general') +
    '</div>' +
    '<button type="button" class="btn-outline notification-edit-js" style="width:100%">Edit</button>'
  document.querySelector('.notification-edit-js').addEventListener('click', editNotification)
}

function editNotification() {
  var p = currentPrefs
  var toggle = function(label, id, key) {
    var on = p[key] === 'true'
    return '<div class="settings-row"><span class="row-label">' + label + '</span>' +
      '<label class="toggle-switch"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><span class="toggle-slider"></span></label></div>'
  }
  document.querySelector('.notification-inner-card-js').innerHTML =
    '<div style="margin-bottom:12px">' +
      '<div class="settings-row"><span class="row-label">Emergency Alert</span><span class="row-value">🔒 ON</span></div>' +
      toggle('Protest', 'pref-protest', 'notification_protest') +
      toggle('Construction', 'pref-construction', 'notification_construction') +
      toggle('Weather', 'pref-weather', 'notification_weather') +
      toggle('Elevator Issues', 'pref-elevator', 'notification_elevator') +
      toggle('General Notices', 'pref-general', 'notification_general') +
    '</div>' +
    '<button type="button" class="btn-primary save-notif-js" style="width:100%">Save</button>'
  document.querySelector('.save-notif-js').addEventListener('click', saveNotification)
}

async function saveNotification() {
  currentPrefs = await window.API.updatePrefs({
    notification_protest: document.getElementById('pref-protest').checked ? 'true' : 'false',
    notification_construction: document.getElementById('pref-construction').checked ? 'true' : 'false',
    notification_weather: document.getElementById('pref-weather').checked ? 'true' : 'false',
    notification_elevator: document.getElementById('pref-elevator').checked ? 'true' : 'false',
    notification_general: document.getElementById('pref-general').checked ? 'true' : 'false'
  })
  renderNotification()
}

// --- Quiet Hours ---
function renderQuietHours() {
  var p = currentPrefs
  var enabled = p.quiet_hours_enabled === 'true'
  document.querySelector('.quiet-hours-inner-card-js').innerHTML =
    '<div style="margin-bottom:12px">' +
      '<div class="settings-row"><span class="row-label">Quiet Hours</span><span class="row-value">' + (enabled ? '🔔 ON' : '🔕 OFF') + '</span></div>' +
      '<div class="settings-row"><span class="row-label">Start</span><span class="row-value">' + (p.quiet_hours_start || '22:00') + '</span></div>' +
      '<div class="settings-row"><span class="row-label">End</span><span class="row-value">' + (p.quiet_hours_end || '07:00') + '</span></div>' +
    '</div>' +
    '<button type="button" class="btn-outline quiet-hours-edit-js" style="width:100%">Edit</button>'
  document.querySelector('.quiet-hours-edit-js').addEventListener('click', editQuietHours)
}

function editQuietHours() {
  var p = currentPrefs
  document.querySelector('.quiet-hours-inner-card-js').innerHTML =
    '<div style="margin-bottom:12px">' +
      '<div class="settings-row"><span class="row-label">Enabled</span>' +
        '<label class="toggle-switch"><input type="checkbox" id="quiet-hours-toggle"' + (p.quiet_hours_enabled === 'true' ? ' checked' : '') + '><span class="toggle-slider"></span></label></div>' +
      '<div class="form-group"><label class="form-label">Start Time</label><input class="form-input" type="time" id="start-time" value="' + (p.quiet_hours_start || '22:00') + '"></div>' +
      '<div class="form-group"><label class="form-label">End Time</label><input class="form-input" type="time" id="end-time" value="' + (p.quiet_hours_end || '07:00') + '"></div>' +
    '</div>' +
    '<button type="button" class="btn-primary save-quiet-js" style="width:100%">Save</button>'
  document.querySelector('.save-quiet-js').addEventListener('click', saveQuietHours)
}

async function saveQuietHours() {
  currentPrefs = await window.API.updatePrefs({
    quiet_hours_enabled: document.getElementById('quiet-hours-toggle').checked ? 'true' : 'false',
    quiet_hours_start: document.getElementById('start-time').value || '22:00',
    quiet_hours_end: document.getElementById('end-time').value || '07:00'
  })
  renderQuietHours()
}

document.addEventListener('DOMContentLoaded', init)
