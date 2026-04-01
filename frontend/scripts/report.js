/* ============================================
   report.js — Unified report form logic
   Reads ?type= from URL, shows relevant fields,
   validates, saves to sessionStorage, navigates
   to confirmation page.
   ============================================ */

const typeMap = {
  'Protest': 'Protest',
  'Construction': 'Construction',
  'Weather': 'Weather Hazard',
  'Elevator': 'Elevator Malfunction',
  'Others': 'Others'
}

const typeLabels = {
  'Protest': 'Protest',
  'Construction': 'Construction',
  'Weather': 'Weather Hazard',
  'Elevator': 'Elevator Malfunction',
  'Others': 'Other Hazard'
}

document.addEventListener('DOMContentLoaded', function() {
  // Get type from URL
  const params = new URLSearchParams(window.location.search)
  const type = params.get('type') || 'Others'

  // Set title
  const label = document.getElementById('type-label-js')
  if (label) label.textContent = typeLabels[type] || type

  // Populate building dropdown
  const select = document.getElementById('building')
  if (select && window.buildings) {
    window.buildings.forEach(function(b) {
      const opt = document.createElement('option')
      opt.value = b.buildingName
      opt.textContent = b.code + ' — ' + b.buildingName
      select.appendChild(opt)
    })
  }

  // Show relevant fields, hide street fields for elevator
  var fieldsetId = 'fields-' + type.toLowerCase() + '-js'
  var fieldset = document.getElementById(fieldsetId)
  if (fieldset) fieldset.style.display = ''

  var streetFields = document.getElementById('street-fields-js')
  if (type === 'Elevator' && streetFields) {
    streetFields.style.display = 'none'
  }

  // Clear previous report data
  sessionStorage.removeItem('report')

  // Next button
  var nextBtn = document.getElementById('next-btn-js')
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      // Validate building
      var building = document.getElementById('building').value.trim()
      var buildingError = document.getElementById('building-error-js')
      if (!building) {
        if (buildingError) buildingError.classList.add('visible')
        document.getElementById('building').classList.add('error')
        return
      } else {
        if (buildingError) buildingError.classList.remove('visible')
        document.getElementById('building').classList.remove('error')
      }

      // Validate description for Others
      if (type === 'Others') {
        var desc = document.getElementById('description').value.trim()
        var descError = document.getElementById('desc-error-js')
        if (!desc) {
          if (descError) descError.classList.add('visible')
          document.getElementById('description').classList.add('error')
          return
        } else {
          if (descError) descError.classList.remove('visible')
          document.getElementById('description').classList.remove('error')
        }
      }

      // Build data object based on type
      var data = { 'Hazard Type': type }
      data['Building'] = building
      data['Intersection Street 1'] = (document.getElementById('street1') || {}).value || ''
      data['Intersection Street 2'] = (document.getElementById('street2') || {}).value || ''

      if (type === 'Protest') {
        var sit = document.querySelector('input[name="situation"]:checked')
        data['Current Situation'] = sit ? sit.value : ''
        data['Mobility Impact'] = Array.from(document.querySelectorAll('input[name="mobility"]:checked')).map(function(c) { return c.value })
        data['Intensity Level'] = (document.getElementById('intensity') || {}).value || ''
      }

      if (type === 'Construction') {
        data['Type of Issue'] = (document.getElementById('issue') || {}).value || ''
        data['Estimated Duration'] = (document.getElementById('duration') || {}).value || ''
        data['Accessibility Impact'] = Array.from(document.querySelectorAll('input[name="accessibility"]:checked')).map(function(c) { return c.value })
      }

      if (type === 'Weather') {
        data['Type of Weather'] = (document.getElementById('type-weather') || {}).value || ''
        data['Severity'] = (document.getElementById('severity') || {}).value || ''
        data['Accessibility Impact'] = Array.from(document.querySelectorAll('input[name="weather-access"]:checked')).map(function(c) { return c.value })
      }

      if (type === 'Elevator') {
        data['Floors Affected'] = Array.from(document.querySelectorAll('input[name="floors"]:checked')).map(function(c) { return c.value })
        data['Elevator Status'] = (document.getElementById('elev-status') || {}).value || ''
        data['Alternative Access'] = (document.getElementById('alternative') || {}).value || ''
        data['Urgency'] = (document.getElementById('urgency') || {}).value || ''
      }

      if (type === 'Others') {
        data['Impact Type'] = (document.getElementById('impact') || {}).value || ''
        data['Description'] = document.getElementById('description').value
      }

      sessionStorage.setItem('report', JSON.stringify(data))
      window.location.href = 'confirmation.html'
    })
  }

  // Clear validation on input change
  var buildingSelect = document.getElementById('building')
  if (buildingSelect) {
    buildingSelect.addEventListener('change', function() {
      this.classList.remove('error')
      var err = document.getElementById('building-error-js')
      if (err) err.classList.remove('visible')
    })
  }

  var descField = document.getElementById('description')
  if (descField) {
    descField.addEventListener('input', function() {
      this.classList.remove('error')
      var err = document.getElementById('desc-error-js')
      if (err) err.classList.remove('visible')
      // Auto-resize
      this.style.height = 'auto'
      this.style.height = this.scrollHeight + 'px'
    })
  }
})
