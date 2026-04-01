document.addEventListener("DOMContentLoaded", () => {
  // Auto-resize textarea
  document.getElementById('comment').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });

  // Get alert id from URL
  const params = new URLSearchParams(window.location.search);
  const alertId = params.get('id');

  // Submit logic
  document.querySelector('.submit-button button').addEventListener('click', async (e) => {
    e.preventDefault();

    const hazard = document.querySelector('input[name="hazard"]:checked')?.value;
    const situation = document.querySelector('input[name="situation"]:checked')?.value;
    const location = document.querySelector('input[name="location"]:checked')?.value;
    const severity = document.querySelector('input[name="severity"]:checked')?.value;

    if (!hazard || !situation || !location || !severity) {
      alert('Please answer all required questions before submitting.');
      return;
    }

    // Determine new status
    let status;
    if (hazard === 'no' || situation === 'improved') {
      status = 'RESOLVED';
    } else if (hazard === 'yes' && situation === 'worsened') {
      status = 'ACTIVE';
    } else {
      status = 'UNDER REVIEW';
    }

    if (alertId) {
      await window.API.updateAlert(alertId, {
        status: status,
        verification: 'Verified by Campus Safety'
      });
    }

    alert('Thank you! Your review has been submitted.');
    window.location.href = 'alertHistory.html';
  });
});
