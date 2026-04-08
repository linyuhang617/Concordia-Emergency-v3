/* === Concordia Safety V3 — map.js (Complete) === */

let lastKnownPosition = null
let cachedPrefs = null
let alertMarkerLayer = []
let currentAlerts = []

const alertColors = {
  'Protest':              '#ff3b30',
  'Construction':         '#ff9500',
  'Elevator Malfunction': '#af52de',
  'Weather Hazard':       '#007aff',
  'Others':               '#8e8e93'
}
const alertIcons = {
  'Protest':              '✊',
  'Construction':         '🚧',
  'Elevator Malfunction': '⚡',
  'Weather Hazard':       '🌬',
  'Others':               '⚠️'
}
const alertIconColors = {
  'Protest':              'red',
  'Construction':         'orange',
  'Elevator Malfunction': 'purple',
  'Weather Hazard':       'blue',
  'Others':               'gray'
}
const statusMap = {
  'ACTIVE':       { filter: 'active', badge: 'active' },
  'PENDING':      { filter: 'review', badge: 'pending' },
  'RESOLVED':     { filter: 'resolved', badge: 'resolved' }
}
const prefKey = {
  'Protest':              'notification_protest',
  'Construction':         'notification_construction',
  'Weather Hazard':       'notification_weather',
  'Elevator Malfunction': 'notification_elevator',
  'Others':               'notification_general'
}

// --- Prefs ---
async function loadPrefs() {
  if (!localStorage.getItem('token')) return
  try { cachedPrefs = await window.API.getPrefs() } catch(e) { cachedPrefs = null }
}

// --- Quiet Hours ---
function isQuietHours() {
  if (!cachedPrefs) return false
  if (cachedPrefs.quiet_hours_enabled !== 'true') return false
  var start = cachedPrefs.quiet_hours_start || '22:00'
  var end = cachedPrefs.quiet_hours_end || '07:00'
  var now = new Date()
  var cur = now.getHours() * 60 + now.getMinutes()
  var parts_s = start.split(':'), parts_e = end.split(':')
  var s = parseInt(parts_s[0]) * 60 + parseInt(parts_s[1])
  var e = parseInt(parts_e[0]) * 60 + parseInt(parts_e[1])
  if (s > e) return cur >= s || cur < e
  return cur >= s && cur < e
}

// --- Accessible Routing ---
function buildCostingOptions(prefs) {
  if (!prefs || !Array.isArray(prefs.safety) || prefs.safety.length === 0) return null
  var opts = {}
  if (prefs.safety.includes('Wheelchair User')) {
    opts.use_stairs = 0
    opts.step_penalty = 100
  } else if (prefs.safety.includes('Avoid Stairs')) {
    opts.use_stairs = 0
  }
  if (prefs.safety.includes('Elevator Priority') && !opts.step_penalty) {
    opts.step_penalty = 50
  }
  return Object.keys(opts).length > 0 ? { pedestrian: opts } : null
}

// --- Polyline Decoder ---
function decodePolyline(str, precision) {
  precision = precision || 6
  var index = 0, lat = 0, lng = 0, coordinates = []
  var factor = Math.pow(10, precision)
  while (index < str.length) {
    var shift = 0, result = 0, byte
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)
    shift = 0; result = 0
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)
    coordinates.push([lat / factor, lng / factor])
  }
  return coordinates
}

// --- Map Init ---
function initMap() {
  var map = L.map('map', {
    center: [45.4965, -73.5782],
    zoom: 16,
    zoomControl: false,
    attributionControl: false
  })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map)

  // Building markers
  if (typeof window.buildings !== 'undefined') {
    window.buildings.forEach(function(b) {
      L.marker([b.lat, b.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:26px;height:26px;border-radius:50%;background:var(--crimson);border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.25)">' + b.code + '</div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).addTo(map).bindPopup('<b>' + b.code + '</b><br><span style="font-size:13px;color:#666">' + b.buildingName + '</span>')
    })
  }

  setTimeout(function() { map.invalidateSize() }, 300)
  return map
}

// --- Alert Markers ---
async function renderAlertMarkers(map) {
  alertMarkerLayer.forEach(function(m) { map.removeLayer(m) })
  alertMarkerLayer = []
  if (!navigator.onLine) return

  try {
    var results = await Promise.all([window.API.getAlerts(), window.API.getPrefs()])
    var alerts = results[0], prefs = results[1]
    if (!Array.isArray(alerts)) return
    cachedPrefs = prefs
    currentAlerts = alerts

    alerts.forEach(function(alert) {
      var key = prefKey[alert.type]
      if (key && prefs[key] === 'false') return

      var color = alert.status === 'PENDING' ? '#8e8e93' : (alertColors[alert.type] || '#8e8e93')
      var icon  = alertIcons[alert.type]  || '⚠️'
      var markerOpacity = alert.status === 'PENDING' ? 'opacity:0.45;' : ''
      var marker = L.marker(
        [parseFloat(alert.location_lat), parseFloat(alert.location_lng)],
        {
          icon: L.divIcon({
            html: '<div style="width:36px;height:36px;border-radius:50%;background:' + color + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px ' + color + '55;' + markerOpacity + '">' + icon + '</div>',
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })
        }
      ).addTo(map).bindPopup(
        '<div style="font-family:-apple-system,sans-serif">' +
          '<b style="font-size:15px">' + icon + ' ' + alert.type + '</b><br>' +
          '<span style="color:#666;font-size:13px">' + alert.description + '</span><br>' +
          '<span style="font-size:12px;color:#999">🕐 ' + alert.created_at + ' · ' +
            (alert.report_count === 1 ? '1 report' : alert.report_count + ' reports') +
          '</span><br>' +
          '<span style="color:' + (alert.status === 'RESOLVED' ? '#34c759' : alert.status === 'ACTIVE' ? '#ff3b30' : '#8e8e93') + ';font-size:12px">● ' + alert.status + '</span><br>' +
          '<a href="alert-detail.html?id=' + alert.id + '" style="font-size:13px;color:#007aff">View Details →</a>' +
        '</div>',
        { closeButton: false }
      )
      alertMarkerLayer.push(marker)
    })

    renderAlertList(alerts, prefs)
  } catch (e) {
    console.warn('Alert markers error:', e)
  }
}

// --- Alert List ---
function renderAlertList(alerts, prefs) {
  var list = document.getElementById('alert-list')
  var summary = document.getElementById('alert-summary')
  if (!list) return

  var visible = alerts.filter(function(a) {
    var key = prefKey[a.type]
    return !(key && prefs[key] === 'false')
  })

  var statusPriority = {
    'ACTIVE': 0,
    'PENDING': 1,
    'UNDER REVIEW': 1,
    'RESOLVED': 2
  }
  visible.sort(function(a, b) {
    var pa = statusPriority[a.status] !== undefined ? statusPriority[a.status] : 1
    var pb = statusPriority[b.status] !== undefined ? statusPriority[b.status] : 1
    return pa - pb
  })

  var active = 0, review = 0, resolved = 0
  visible.forEach(function(a) {
    if (a.status === 'ACTIVE') active++
    else if (a.status === 'PENDING') review++
    else if (a.status === 'RESOLVED') resolved++
  })
  if (summary) {
    var parts = []
    if (active) parts.push(active + ' active')
    if (review) parts.push(review + ' under review')
    if (resolved) parts.push(resolved + ' resolved')
    summary.textContent = parts.length ? parts.join(' · ') : 'No alerts'
  }

  if (!visible.length) {
    list.innerHTML = '<div class="empty-state">No alerts to display</div>'
    return
  }

  list.innerHTML = ''
  visible.forEach(function(a) {
    var color = alertColors[a.type] || '#8e8e93'
    var icon  = alertIcons[a.type]  || '⚠️'
    var iconClass = alertIconColors[a.type] || 'gray'
    var st = statusMap[a.status] || { filter: 'active', badge: 'pending' }
    var reportText = a.report_count === 1 ? '1 report' : a.report_count + ' reports'
    var timeText = a.created_at || ''

    var row = document.createElement('a')
    row.className = 'list-row'
    row.href = 'alert-detail.html?id=' + a.id
    row.setAttribute('data-s', st.filter)
    row.innerHTML =
      '<div class="row-icon ' + iconClass + '">' + icon + '</div>' +
      '<div class="row-body">' +
        '<div class="row-title"><span class="row-title-text">' + a.type + ' — ' + a.building_code + ' building</span><span class="status-pill ' + st.badge + '">' + a.status + '</span></div>' +
        '<div class="row-subtitle">' + (a.status === 'PENDING' ? 'Awaiting staff approval' : reportText + ' · ' + timeText) + '</div>' +
      '</div>' +
      '<div class="row-accessory">' +
        '<svg class="row-chevron" width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M1 1l5.5 5.5L1 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</div>'
    list.appendChild(row)
  })
}

// --- Segmented Filter ---
function initSegmentedFilter() {
  document.querySelectorAll('.seg-item').forEach(function(s) {
    s.addEventListener('click', function() {
      document.querySelectorAll('.seg-item').forEach(function(x) { x.classList.remove('active') })
      s.classList.add('active')
      var f = s.dataset.f
      document.querySelectorAll('#alert-list .list-row').forEach(function(r) {
        if (f === 'all') { r.style.display = 'flex'; return }
        r.style.display = r.getAttribute('data-s') === f ? 'flex' : 'none'
      })
    })
  })
}

// --- GPS + Proximity Alerts ---
function initLocationFeatures(map) {
  if (!navigator.geolocation) return
  var userMarker = L.circleMarker([0, 0], {
    radius: 8, fillColor: '#007aff', color: '#fff', weight: 2, fillOpacity: 1
  }).addTo(map).bindPopup('📍 You are here')

  var notifiedAlerts = new Set()

  navigator.geolocation.watchPosition(
    async function(pos) {
      lastKnownPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      userMarker.setLatLng([pos.coords.latitude, pos.coords.longitude])

      // Proximity alerts
      if (!navigator.onLine) return
      try {
        var alerts = await window.API.getAlerts()
        if (!Array.isArray(alerts)) return
        alerts.forEach(function(alert) {
          if (alert.status !== 'ACTIVE') return
          var dist = map.distance(
            [pos.coords.latitude, pos.coords.longitude],
            [parseFloat(alert.location_lat), parseFloat(alert.location_lng)]
          )
          if (dist < 50 && !notifiedAlerts.has(alert.id) && !isQuietHours()) {
            notifiedAlerts.add(alert.id)
            L.popup({ autoClose: false, closeOnClick: false })
              .setLatLng([parseFloat(alert.location_lat), parseFloat(alert.location_lng)])
              .setContent(
                '<b>⚠️ Hazard Nearby!</b><br>' +
                alert.type + ' — ' + alert.description + '<br>' +
                '<a href="alert-detail.html?id=' + alert.id + '">View Details</a>'
              )
              .openOn(map)
          }
        })
      } catch(e) { /* offline or fetch error */ }
    },
    function(err) { console.warn('GPS error:', err.message) },
    { enableHighAccuracy: true }
  )
}

// --- Build Exclude Polygons ---
async function getExcludePolygons() {
  var d = 0.0002
  try {
    var alerts = await window.API.getAlerts()
    if (!Array.isArray(alerts)) return []
    return alerts.filter(function(a) { return a.status === 'ACTIVE' }).map(function(a) {
      var lat = parseFloat(a.location_lat), lng = parseFloat(a.location_lng)
      return [
        [lng - d, lat - d], [lng + d, lat - d],
        [lng + d, lat + d], [lng - d, lat + d],
        [lng - d, lat - d]
      ]
    })
  } catch(e) { return [] }
}

// --- Valhalla Route ---
async function fetchRoute(from, to, map) {
  var excludePolygons = await getExcludePolygons()
  var body = {
    locations: [
      { lon: from.lng, lat: from.lat },
      { lon: to.lng, lat: to.lat }
    ],
    costing: 'pedestrian',
    exclude_polygons: excludePolygons
  }
  var costingOpts = buildCostingOptions(cachedPrefs)
  if (costingOpts) body.costing_options = costingOpts

  var res = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  var data = await res.json()
  if (data.error) throw new Error(data.error)
  return decodePolyline(data.trip.legs[0].shape)
}

// --- Destination Search ---
function addDestinationSearch(map) {
  var searchContainer = document.getElementById('map-search')
  if (!searchContainer) return

  var input = document.getElementById('ds-input')
  var btn = document.getElementById('ds-btn')
  var clearBtn = document.getElementById('ds-clear')
  var status = document.getElementById('ds-status')
  var suggestions = document.getElementById('ds-suggestions')

  var routeLayer = null
  var destMarker = null

  function setStatus(msg, isError) {
    if (status) { status.textContent = msg; status.style.color = isError ? '#ff3b30' : '#999' }
  }

  function clearRoute() {
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null }
    if (destMarker) { map.removeLayer(destMarker); destMarker = null }
    input.value = ''
    window.dsRouteActive = false
    setStatus('')
  }

  // Autocomplete
  var debounceTimer
  input.addEventListener('input', function() {
    clearTimeout(debounceTimer)
    var q = input.value.trim()
    if (q.length < 2) { suggestions.style.display = 'none'; return }
    debounceTimer = setTimeout(function() {
      suggestions.innerHTML = ''
      // Building suggestions first
      var ql = q.toLowerCase()
      var bResults = window.buildings.filter(function(b) {
        return b.code.toLowerCase().startsWith(ql) ||
               b.buildingName.toLowerCase().includes(ql) ||
               ql.includes(b.code.toLowerCase())
      }).slice(0, 4)
      bResults.forEach(function(b) {
        var li = document.createElement('li')
        li.className = 'ds-suggestion-item'
        li.textContent = b.code + ' — ' + b.buildingName
        li.addEventListener('click', function() {
          input.value = b.code
          suggestions.style.display = 'none'
          doSearch()
        })
        suggestions.appendChild(li)
      })
      // Nominatim suggestions (online only)
      if (!navigator.onLine) {
        if (bResults.length) suggestions.style.display = 'block'
        return
      }
      var params = new URLSearchParams({
        q: q, format: 'json', limit: 5,
        countrycodes: 'ca', viewbox: '-73.65,45.46,-73.52,45.54', bounded: 0, dedupe: 1
      })
      fetch('https://nominatim.openstreetmap.org/search?' + params, { headers: { 'Accept-Language': 'en' } })
        .then(function(r) { return r.json() })
        .then(function(data) {
          data.forEach(function(item) {
            var li = document.createElement('li')
            li.className = 'ds-suggestion-item'
            li.textContent = item.display_name
            li.addEventListener('click', function() {
              input.value = item.display_name
              suggestions.style.display = 'none'
              doSearch()
            })
            suggestions.appendChild(li)
          })
          if (suggestions.children.length) suggestions.style.display = 'block'
          else suggestions.style.display = 'none'
        })
        .catch(function() {
          if (suggestions.children.length) suggestions.style.display = 'block'
        })
    }, 300)
  })

  document.addEventListener('click', function(e) {
    if (!e.target.closest('#map-search')) suggestions.style.display = 'none'
  })

  async function doSearch() {
    var query = input.value.trim()
    if (!query) { setStatus('Please enter a destination.', true); return }

    // Offline building search
    if (!navigator.onLine) {
      var q = query.toLowerCase()
      var match =
        window.buildings.find(function(b) { return b.code.toLowerCase() === q }) ||
        window.buildings.find(function(b) { return b.buildingName.toLowerCase().includes(q) }) ||
        window.buildings.find(function(b) { return q.includes(b.code.toLowerCase()) })

      if (!match) { setStatus('📡 Offline — Building not found. Try a code like "H".', true); return }

      var userPos = lastKnownPosition || { lat: 45.4972, lng: -73.5788 }
      var R = 6371000
      var dLat = (match.lat - userPos.lat) * Math.PI / 180
      var dLng = (match.lng - userPos.lng) * Math.PI / 180
      var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(userPos.lat*Math.PI/180)*Math.cos(match.lat*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2)
      var distM = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
      var latDiff = match.lat - userPos.lat
      var lngDiff = match.lng - userPos.lng
      var dir = Math.abs(latDiff) >= Math.abs(lngDiff) ? (latDiff > 0 ? 'north' : 'south') : (lngDiff > 0 ? 'east' : 'west')

      clearRoute()
      routeLayer = L.polyline([[userPos.lat, userPos.lng], [match.lat, match.lng]], { color: '#ff9500', weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(map)
      destMarker = L.marker([match.lat, match.lng], { icon: L.divIcon({ html: '<div style="font-size:24px">📍</div>', className: '', iconSize: [32, 32], iconAnchor: [16, 32] }) }).addTo(map).bindPopup('<b>' + match.code + ' — ' + match.buildingName + '</b><br><small>~' + distM + 'm ' + dir + '</small>').openPopup()
      map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] })
      window.dsRouteActive = true
      setStatus('📡 Offline — ~' + distM + 'm ' + dir + ' to ' + match.buildingName)
      return
    }

    // Building search (online — skip Nominatim)
    var q2 = query.toLowerCase()
    var bMatch =
      window.buildings.find(function(b) { return b.code.toLowerCase() === q2 }) ||
      window.buildings.find(function(b) { return b.buildingName.toLowerCase().includes(q2) }) ||
      window.buildings.find(function(b) { return q2.includes(b.code.toLowerCase()) })
    if (bMatch) {
      var userPos2 = lastKnownPosition || { lat: 45.4972, lng: -73.5788 }
      clearRoute()
      destMarker = L.marker([bMatch.lat, bMatch.lng], { icon: L.divIcon({ html: '<div style="font-size:24px">📍</div>', className: '', iconSize: [32, 32], iconAnchor: [16, 32] }) }).addTo(map).bindPopup('<b>' + bMatch.code + ' — ' + bMatch.buildingName + '</b>').openPopup()
      setStatus('🗺️ Routing...')
      try {
        var coords2 = await fetchRoute(userPos2, { lat: bMatch.lat, lng: bMatch.lng }, map)
        routeLayer = L.polyline(coords2.map(function(c) { return [c[0], c[1]] }), { color: '#0ABAB5', weight: 5, opacity: 0.85 }).addTo(map)
        map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] })
        window.dsRouteActive = true
        setStatus('✅ Route set to ' + bMatch.buildingName)
      } catch(err) { setStatus('❌ ' + err.message, true) }
      return
    }

    // Online search
    btn.disabled = true
    setStatus('🔎 Searching...')

    try {
      var params = new URLSearchParams({ q: query, format: 'json', limit: 1 })
      var geoRes = await fetch('https://nominatim.openstreetmap.org/search?' + params, { headers: { 'Accept-Language': 'en' } })
      var geoData = await geoRes.json()
      if (!geoData.length) throw new Error('Address not found.')

      var dest = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon), label: geoData[0].display_name }
      var userPos = lastKnownPosition || { lat: 45.4972, lng: -73.5788 }

      clearRoute()
      destMarker = L.marker([dest.lat, dest.lng], { icon: L.divIcon({ html: '<div style="font-size:24px">📍</div>', className: '', iconSize: [32, 32], iconAnchor: [16, 32] }) }).addTo(map).bindPopup('<b>Destination</b><br><small>' + dest.label + '</small>').openPopup()

      setStatus('🗺️ Routing...')
      var coords = await fetchRoute(userPos, dest, map)
      routeLayer = L.polyline(coords.map(function(c) { return [c[0], c[1]] }), { color: '#0ABAB5', weight: 5, opacity: 0.85 }).addTo(map)
      map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] })
      window.dsRouteActive = true
      setStatus('✅ Route set!')
    } catch(err) {
      setStatus('❌ ' + err.message, true)
    } finally {
      btn.disabled = false
    }
  }

  // Click routing
  var clickRouteLayer = null
  map.on('click', async function(e) {
    if (window.dsRouteActive) return
    if (!navigator.onLine) return
    if (!lastKnownPosition) return
    if (clickRouteLayer) { map.removeLayer(clickRouteLayer); clickRouteLayer = null }
    try {
      var coords = await fetchRoute(lastKnownPosition, { lat: e.latlng.lat, lng: e.latlng.lng }, map)
      clickRouteLayer = L.polyline(coords.map(function(c) { return [c[0], c[1]] }), { color: '#0ABAB5', weight: 5, opacity: 0.85 }).addTo(map)
    } catch(err) {
      console.warn('Click route error:', err.message)
    }
  })

  btn.addEventListener('click', doSearch)
  clearBtn.addEventListener('click', clearRoute)
  input.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSearch() })
}

// --- Crisis Mode ---
var isCrisisMode = false
function initCrisisMode() {
  var btn = document.getElementById('crisis-btn')
  if (!btn) return

  var modal = document.getElementById('crisis-modal')
  var modalConfirm = document.getElementById('crisis-modal-confirm')
  var modalCancel = document.getElementById('crisis-modal-cancel')
  var crisisBar = document.getElementById('crisis-bar')
  var navStatus = document.getElementById('crisis-nav-status')

  function activateCrisis() {
    isCrisisMode = true
    document.body.classList.add('crisis-mode')
    btn.textContent = '❎ EXIT CRISIS MODE'
    btn.title = 'Exit Crisis Mode'
    if (crisisBar) crisisBar.style.display = 'flex'
    if (navStatus) navStatus.style.display = 'inline'
    if (modal) modal.style.display = 'none'
  }

  function deactivateCrisis() {
    isCrisisMode = false
    document.body.classList.remove('crisis-mode')
    btn.textContent = '⚠️ ACTIVATE CRISIS MODE'
    btn.title = 'Activate Crisis Mode'
    if (crisisBar) crisisBar.style.display = 'none'
    if (navStatus) navStatus.style.display = 'none'
  }

  btn.addEventListener('click', function() {
    if (!isCrisisMode) {
      if (modal) modal.style.display = 'flex'
    } else {
      deactivateCrisis()
    }
  })

  if (modalConfirm) modalConfirm.addEventListener('click', activateCrisis)
  if (modalCancel) modalCancel.addEventListener('click', function() {
    if (modal) modal.style.display = 'none'
  })
}

// --- Offline Banner ---
function updateOfflineBanner() {
  var banner = document.getElementById('offline-banner')
  if (!banner) return
  banner.style.display = navigator.onLine ? 'none' : 'block'
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async function() {
  var user = await checkAuth()
  if (!user) return

  // Profile initial
  var profileBtn = document.getElementById('profile-initial')
  if (profileBtn && user.username) {
    profileBtn.textContent = user.username.charAt(0).toUpperCase()
  }

  // Map
  var map = initMap()
  initLocationFeatures(map)

  // Alerts
  await loadPrefs()
  await renderAlertMarkers(map)
  setInterval(function() { renderAlertMarkers(map) }, 30000)

  // Search + Routing
  addDestinationSearch(map)

  // Segmented filter
  initSegmentedFilter()

  // Crisis mode
  initCrisisMode()
  if (new URLSearchParams(window.location.search).get("crisis") === "1") { var m = document.getElementById("crisis-modal"); if(m) m.style.display="flex"; }

  // Offline
  updateOfflineBanner()
  window.addEventListener('offline', updateOfflineBanner)
  window.addEventListener('online', updateOfflineBanner)
})
