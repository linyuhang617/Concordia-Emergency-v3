let lastKnownPosition = null
let cachedPrefs = null

async function loadPrefs() {
  if (!localStorage.getItem('token')) return
  try { cachedPrefs = await window.API.getPrefs() } catch(e) { cachedPrefs = null }
}

function isQuietHours() {
  if (!cachedPrefs) return false
  if (cachedPrefs.quiet_hours_enabled !== 'true') return false
  const start = cachedPrefs.quiet_hours_start || '22:00'
  const end = cachedPrefs.quiet_hours_end || '07:00'
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const s = sh * 60 + sm
  const e = eh * 60 + em
  if (s > e) return cur >= s || cur < e
  return cur >= s && cur < e
}

function buildCostingOptions(prefs) {
  if (!prefs || !Array.isArray(prefs.safety) || prefs.safety.length === 0) return null
  const opts = {}
  if (prefs.safety.includes("Wheelchair User")) {
    opts.use_stairs = 0
    opts.step_penalty = 100
  } else if (prefs.safety.includes("Avoid Stairs")) {
    opts.use_stairs = 0
  }
  if (prefs.safety.includes("Elevator Priority") && !opts.step_penalty) {
    opts.step_penalty = 50
  }
  return Object.keys(opts).length > 0 ? { pedestrian: opts } : null
}
let alertMarkerLayer = []
const alertColors = {
  'Protest':              '#e74c3c',
  'Construction':         '#e67e22',
  'Elevator Malfunction': '#8e44ad',
  'Weather Hazard':       '#2980b9',
  'Others':               '#7f8c8d'
}
const alertIcons = {
  'Protest':              '📢',
  'Construction':         '🚧',
  'Elevator Malfunction': '🛗',
  'Weather Hazard':       '🌨️',
  'Others':               '⚠️'
}

function decodePolyline(str, precision = 6) {
  let index = 0, lat = 0, lng = 0, coordinates = []
  const factor = Math.pow(10, precision)
  while (index < str.length) {
    let shift = 0, result = 0, byte
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)
    shift = 0; result = 0
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)
    coordinates.push([lat / factor, lng / factor])
  }
  return coordinates
}

function initMap() {
  const map = L.map('map-js').setView([45.4969, -73.5788], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)
  if (typeof window.buildings !== 'undefined') {
    window.buildings.forEach(b => {
      const buildingIcon = L.icon({ iconUrl: 'images/concordia-logo.png', iconSize: [16, 16] })
      L.marker([b.lat, b.lng], { icon: buildingIcon })
        .addTo(map)
        .bindPopup('<b>' + b.code + '</b><br>' + b.buildingName)
    })
  }
  renderAlertMarkers(map)
  setInterval(() => renderAlertMarkers(map), 30000)
  return map
}

async function renderAlertMarkers(map) {
  alertMarkerLayer.forEach(m => map.removeLayer(m))
  alertMarkerLayer = []
  if (!navigator.onLine) return
  try {
    const [alerts, prefs] = await Promise.all([
      window.API.getAlerts(),
      window.API.getPrefs()
    ])
    if (!Array.isArray(alerts)) return
    const prefKey = {
      'Protest':              'notification_protest',
      'Construction':         'notification_construction',
      'Weather Hazard':       'notification_weather',
      'Elevator Malfunction': 'notification_elevator',
      'Others':               'notification_general'
    }
    alerts.forEach(alert => {
      const key = prefKey[alert.type]
      if (key && prefs[key] === 'false') return
      const color = alertColors[alert.type] || '#7f8c8d'
      const icon  = alertIcons[alert.type]  || '⚠️'
      const alertIcon = L.divIcon({
        html: '<div class="alert-marker-js" style="background:' + color + '">' + icon + '</div>',
        className: '',
        iconSize: [32, 32]
      })
      const marker = L.marker(
        [parseFloat(alert.location_lat), parseFloat(alert.location_lng)],
        { icon: alertIcon }
      )
        .addTo(map)
        .bindPopup(
          '<b>' + alert.type + '</b><br>' +
          alert.description + '<br>' +
          '<small>🕐 ' + alert.created_at + ' | ' + (alert.report_count === 1 ? 'Reported by 1 student' : 'Reported by ' + alert.report_count + ' students') + '</small><br>' +
          '<span style="color:' + color + '">● ' + alert.status + '</span><br>' +
          '<a href="pages/alertDetail.html?id=' + alert.id + '">[ View Details ]</a>'
        )
      alertMarkerLayer.push(marker)
    })
  } catch (e) {
    console.warn('Alert markers error:', e)
  }
}

function initLocationFeatures(map) {
  if (!navigator.geolocation) return
  const userMarker = L.circleMarker([0, 0], {
    radius: 8, fillColor: '#2980b9', color: '#fff', weight: 2, fillOpacity: 1
  }).addTo(map).bindPopup('📍 You are here')

  let notifiedAlerts = new Set()
  loadPrefs()
  let clickRouteLayer = null

  navigator.geolocation.watchPosition(
    async (pos) => {
      lastKnownPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      userMarker.setLatLng([pos.coords.latitude, pos.coords.longitude])
      // Proximity alert (50m)
      if (!navigator.onLine) return
      try {
        const alerts = await window.API.getAlerts()
        if (!Array.isArray(alerts)) return
        alerts.forEach(alert => {
          if (alert.status !== 'ACTIVE') return
          const dist = map.distance(
            [pos.coords.latitude, pos.coords.longitude],
            [parseFloat(alert.location_lat), parseFloat(alert.location_lng)]
          )
          if (dist < 50 && !notifiedAlerts.has(alert.id) && !isQuietHours()) {
            notifiedAlerts.add(alert.id)
            L.popup({ autoClose: false, closeOnClick: false })
              .setLatLng([parseFloat(alert.location_lat), parseFloat(alert.location_lng)])
              .setContent(
                '<b>⚠️ Hazard Nearby!</b><br>' +
                alert.type + ' - ' + alert.description + '<br>' +
                '<a href="pages/alertDetail.html?id=' + alert.id + '">View Details</a>'
              )
              .openOn(map)
          }
        })
      } catch(e) { /* offline or fetch error — skip */ }
    },
    (err) => { console.warn('GPS error:', err.message) },
    { enableHighAccuracy: true }
  )

  map.on('click', async (e) => {
    if (window.dsRouteActive) return
    if (!navigator.onLine) return
    if (!lastKnownPosition) return
    if (clickRouteLayer) { map.removeLayer(clickRouteLayer); clickRouteLayer = null }
    try {
      const alerts = await window.API.getAlerts()
      const d = 0.0002
      const excludePolygons = Array.isArray(alerts)
        ? alerts.filter(a => a.status === 'ACTIVE').map(a => [
            [parseFloat(a.location_lng) - d, parseFloat(a.location_lat) - d],
            [parseFloat(a.location_lng) + d, parseFloat(a.location_lat) - d],
            [parseFloat(a.location_lng) + d, parseFloat(a.location_lat) + d],
            [parseFloat(a.location_lng) - d, parseFloat(a.location_lat) + d],
            [parseFloat(a.location_lng) - d, parseFloat(a.location_lat) - d]
          ])
        : []
      const res = await fetch('https://valhalla1.openstreetmap.de/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: [
            { lon: lastKnownPosition.lng, lat: lastKnownPosition.lat },
            { lon: e.latlng.lng, lat: e.latlng.lat }
          ],
          costing: 'pedestrian',
          exclude_polygons: excludePolygons,
          ...( buildCostingOptions(cachedPrefs) ? { costing_options: buildCostingOptions(cachedPrefs) } : {})
        })
      })
      const data = await res.json()
      if (data.error) return
      const coords = decodePolyline(data.trip.legs[0].shape)
      clickRouteLayer = L.polyline(coords.map(c => [c[0], c[1]]), {
        color: '#0ABAB5', weight: 5, opacity: 0.85
      }).addTo(map)
    } catch (err) {
      console.warn('Click route error:', err.message)
    }
  })
}

function addDestinationSearch(map) {
  const SearchControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd() {
      const container = L.DomUtil.create('div', 'ds-control')
      container.innerHTML =
        '<div class="ds-row">' +
          '<input id="ds-input" class="ds-input" type="text" placeholder="Search destination…" autocomplete="off" />' +
          '<button id="ds-btn" class="ds-btn" type="button">Go</button>' +
          '<button id="ds-clear" class="ds-clear" type="button" title="Clear">✕</button>' +
        '</div>' +
        '<ul id="ds-suggestions" class="ds-suggestions"></ul>' +
        '<div id="ds-status" class="ds-status"></div>'
      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)
      return container
    }
  })
  map.addControl(new SearchControl())

  let routingControl = null
  let destMarker     = null

  const input  = document.getElementById('ds-input')
  const btn    = document.getElementById('ds-btn')
  const clear  = document.getElementById('ds-clear')
  const status = document.getElementById('ds-status')

  function setStatus(msg, isError = false) {
    status.textContent = msg
    status.style.color = isError ? '#e74c3c' : '#555'
  }

  function clearRoute() {
    if (routingControl) { map.removeLayer(routingControl); routingControl = null }
    if (destMarker)     { map.removeLayer(destMarker);     destMarker     = null }
    input.value = ''
    window.dsRouteActive = false
    setStatus('')
  }

  function debounce(fn, delay) {
    let timer
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
  }

  const suggestionsList = document.getElementById('ds-suggestions')

  function showSuggestions(items) {
    suggestionsList.innerHTML = ''
    if (!items.length) { suggestionsList.style.display = 'none'; return }
    items.forEach(item => {
      const li = document.createElement('li')
      li.className = 'ds-suggestion-item'
      li.textContent = item.display_name
      li.addEventListener('click', () => {
        input.value = item.display_name
        suggestionsList.style.display = 'none'
        handleSearch()
      })
      suggestionsList.appendChild(li)
    })
    suggestionsList.style.display = 'block'
  }

  async function fetchSuggestions(query) {
    if (query.length < 3) { suggestionsList.style.display = 'none'; return }
    const params = new URLSearchParams({
      q: query, format: 'json', limit: 5,
      countrycodes: 'ca', viewbox: '-73.65,45.46,-73.52,45.54', bounded: 0, dedupe: 1
    })
    try {
      const res  = await fetch('https://nominatim.openstreetmap.org/search?' + params,
        { headers: { 'Accept-Language': 'en' } })
      const data = await res.json()
      showSuggestions(data)
    } catch { suggestionsList.style.display = 'none' }
  }

  const debouncedFetch = debounce(fetchSuggestions, 300)
  input.addEventListener('input', () => debouncedFetch(input.value.trim()))

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ds-control')) suggestionsList.style.display = 'none'
  })

  async function geocode(address) {
    const params = new URLSearchParams({ q: address, format: 'json', limit: 1 })
    const res  = await fetch('https://nominatim.openstreetmap.org/search?' + params,
      { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    if (!data.length) throw new Error('Address not found. Try a more specific query.')
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name }
  }

  async function routeTo(userLatLng, dest) {
    if (routingControl) { map.removeLayer(routingControl); routingControl = null }
    if (destMarker)     { map.removeLayer(destMarker);     destMarker     = null }

    destMarker = L.marker([dest.lat, dest.lng], {
      icon: L.divIcon({
        html: '<div class="ds-dest-pin">📍</div>',
        className: '', iconSize: [32, 32], iconAnchor: [16, 32]
      })
    }).addTo(map).bindPopup('<b>Destination</b><br><small>' + dest.label + '</small>').openPopup()

    const d = 0.0002
    let excludePolygons = []
    try {
      const alerts = await window.API.getAlerts()
      if (Array.isArray(alerts)) {
        excludePolygons = alerts.filter(a => a.status === 'ACTIVE').map(a => [
          [parseFloat(a.location_lng) - d, parseFloat(a.location_lat) - d],
          [parseFloat(a.location_lng) + d, parseFloat(a.location_lat) - d],
          [parseFloat(a.location_lng) + d, parseFloat(a.location_lat) + d],
          [parseFloat(a.location_lng) - d, parseFloat(a.location_lat) + d],
          [parseFloat(a.location_lng) - d, parseFloat(a.location_lat) - d]
        ])
      }
    } catch (e) { console.warn('Could not fetch alerts for routing:', e) }

    setStatus('🗺️ Calculating route…')
    fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [
          { lon: userLatLng.lng, lat: userLatLng.lat },
          { lon: dest.lng,       lat: dest.lat }
        ],
        costing: 'pedestrian',
        exclude_polygons: excludePolygons,
        ...( buildCostingOptions(cachedPrefs) ? { costing_options: buildCostingOptions(cachedPrefs) } : {})
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.error) throw new Error(data.error)
      const coords = decodePolyline(data.trip.legs[0].shape)
      routingControl = L.polyline(coords.map(c => [c[0], c[1]]), {
        color: '#0ABAB5', weight: 5, opacity: 0.85
      }).addTo(map)
      map.fitBounds(routingControl.getBounds(), { padding: [40, 40] })
      window.dsRouteActive = true
      setStatus('✅ Route set!')
    })
    .catch(err => setStatus('❌ ' + err.message, true))
  }

  async function handleSearch() {
    if (!navigator.onLine) {
      const query = input.value.trim()
      if (!query) { setStatus('Please enter a destination.', true); return }
      const q = query.toLowerCase()
      const match =
        window.buildings.find(b => b.code.toLowerCase() === q) ||
        window.buildings.find(b => b.buildingName.toLowerCase().includes(q)) ||
        window.buildings.find(b => q.includes(b.code.toLowerCase()))
      if (!match) {
        setStatus('📡 Offline — Building not found. Try a building code (e.g. "H", "EV", "MB").', true)
        return
      }
      const userPos = lastKnownPosition || { lat: 45.4972, lng: -73.5788 }
      if (!lastKnownPosition) {
        setStatus('📍 Using Concordia (H Building) as start point.')
      }
      const R = 6371000
      const dLat = (match.lat - userPos.lat) * Math.PI / 180
      const dLng = (match.lng - userPos.lng) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userPos.lat * Math.PI / 180) * Math.cos(match.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const distM = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
      const latDiff = match.lat - userPos.lat
      const lngDiff = match.lng - userPos.lng
      let dir = Math.abs(latDiff) >= Math.abs(lngDiff)
        ? (latDiff > 0 ? 'north' : 'south')
        : (lngDiff > 0 ? 'east' : 'west')
      if (routingControl) { map.removeLayer(routingControl); routingControl = null }
      if (destMarker)     { map.removeLayer(destMarker);     destMarker = null }
      routingControl = L.polyline(
        [[userPos.lat, userPos.lng], [match.lat, match.lng]],
        { color: '#e67e22', weight: 4, opacity: 0.8, dashArray: '8, 8' }
      ).addTo(map)
      destMarker = L.marker([match.lat, match.lng], {
        icon: L.divIcon({
          html: '<div class="ds-dest-pin">📍</div>',
          className: '', iconSize: [32, 32], iconAnchor: [16, 32]
        })
      }).addTo(map).bindPopup('<b>' + match.code + ' — ' + match.buildingName + '</b><br><small>~' + distM + 'm ' + dir + '</small>').openPopup()
      map.fitBounds(routingControl.getBounds(), { padding: [60, 60] })
      setStatus('📡 Offline — Head ~' + distM + 'm ' + dir + ' to ' + match.buildingName + ' (' + match.code + ')', false)
      return
    }

    const query = input.value.trim()
    if (!query) { setStatus('Please enter a destination.', true); return }
    btn.disabled = true
    setStatus('📡 Getting your location…')
    if (lastKnownPosition) {
      setStatus('🔎 Searching address…')
      geocode(query).then(dest => routeTo(lastKnownPosition, dest)).catch(err => setStatus(err.message, true)).finally(() => { btn.disabled = false })
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setStatus('🔎 Searching address…')
        try {
          const dest = await geocode(query)
          routeTo(userLatLng, dest)
        } catch (err) {
          setStatus(err.message, true)
        } finally {
          btn.disabled = false
        }
      },
      () => {
          const defaultLatLng = { lat: 45.4972, lng: -73.5788 }
          setStatus('📍 Using Concordia (H Building) as start point.')
          geocode(query).then(dest => routeTo(defaultLatLng, dest)).catch(err => setStatus(err.message, true)).finally(() => { btn.disabled = false })
        },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  btn.addEventListener('click', handleSearch)
  clear.addEventListener('click', clearRoute)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch() })
}
