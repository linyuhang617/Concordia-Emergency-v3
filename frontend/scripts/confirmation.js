/* ============================================
   confirmation.js — Preview + submit report
   ============================================ */

const typeMap = {
  'Protest': 'Protest',
  'Construction': 'Construction',
  'Weather': 'Weather Hazard',
  'Elevator': 'Elevator Malfunction',
  'Others': 'Others'
}

document.addEventListener('DOMContentLoaded', function() {
  var saved = sessionStorage.getItem('report')
  if (!saved) {
    window.location.href = 'report.html'
    return
  }

  var data = JSON.parse(saved)
  var container = document.getElementById('detail-js')

  Object.entries(data).forEach(function(entry) {
    var key = entry[0]
    var value = entry[1]
    var row = document.createElement('div')
    row.className = 'confirm-row'
    var displayValue = Array.isArray(value)
      ? (value.length ? value.join(', ') : 'N/A')
      : (value === undefined || value === null || String(value).trim() === '' ? 'N/A' : value)
    row.innerHTML = '<span class="confirm-key">' + key + ':</span><span class="confirm-value">' + displayValue + '</span>'
    container.appendChild(row)
  })

  var submitBtn = document.getElementById('submitBtn')
  var popup = document.getElementById('successPopup')
  var okBtn = document.getElementById('popupOkBtn')

  submitBtn.addEventListener('click', async function() {
    submitBtn.disabled = true

    var buildingName = data['Building']
    var bldg = window.buildings.find(function(b) { return b.buildingName === buildingName }) || { code: 'XX', lat: 45.4973, lng: -73.5789 }

    var skipKeys = ['Hazard Type', 'Building', 'Intersection Street 1', 'Intersection Street 2']
    var descParts = Object.entries(data)
      .filter(function(e) { return !skipKeys.includes(e[0]) })
      .map(function(e) { return e[0] + ': ' + (Array.isArray(e[1]) ? e[1].join(', ') : e[1] || 'N/A') })
    var description = descParts.join(' | ') || 'No additional details'

    var payload = {
      type: typeMap[data['Hazard Type']] || data['Hazard Type'],
      building_code: bldg.code,
      location_lat: String(bldg.lat),
      location_lng: String(bldg.lng),
      description: description,
      status: 'UNDER REVIEW',
      verification: 'Reported by 1 student'
    }

    try {
      var result = await window.API.createAlert(payload)
      if (result && result.id) {
        sessionStorage.removeItem('report')
        popup.classList.add('visible')
      } else {
        alert('Submission failed. Please try again.')
        submitBtn.disabled = false
      }
    } catch (e) {
      alert('Network error. Please try again.')
      submitBtn.disabled = false
    }
  })

  okBtn.addEventListener('click', function() {
    window.location.href = '../index.html'
  })
})
