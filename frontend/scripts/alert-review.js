/* ============================================
   alert-review.js — Review form submit logic
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  var params = new URLSearchParams(window.location.search)
  var alertId = params.get('id')

  // Auto-resize textarea
  var comment = document.getElementById('comment')
  if (comment) {
    comment.addEventListener('input', function() {
      this.style.height = 'auto'
      this.style.height = this.scrollHeight + 'px'
    })
  }

  var submitBtn = document.getElementById('submit-review-js')
  if (!submitBtn) return

  submitBtn.addEventListener('click', async function() {
    var hazard = (document.querySelector('input[name="hazard"]:checked') || {}).value
    var situation = (document.querySelector('input[name="situation"]:checked') || {}).value
    var location = (document.querySelector('input[name="location"]:checked') || {}).value
    var severity = (document.querySelector('input[name="severity"]:checked') || {}).value

    if (!hazard || !situation || !location || !severity) {
      alert('Please answer all required questions before submitting.')
      return
    }

    // Determine new status (same logic as V2)
    var status
    if (hazard === 'no' || situation === 'improved') {
      status = 'RESOLVED'
    } else if (hazard === 'yes' && situation === 'worsened') {
      status = 'ACTIVE'
    } else {
      status = 'UNDER REVIEW'
    }

    submitBtn.disabled = true

    try {
      if (alertId) {
        await window.API.updateAlert(alertId, {
          status: status,
          verification: 'Verified by Campus Safety'
        })
      }
      alert('Thank you! Your review has been submitted.')
      window.location.href = 'alert-history.html'
    } catch (e) {
      alert('Failed to submit review. Please try again.')
      submitBtn.disabled = false
    }
  })
})
