document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  if (!id) return

  const alert = await window.API.getAlert(id)
  if (!alert) return

  const color = alert.status === 'ACTIVE' ? 'red' : alert.status === 'UNDER REVIEW' ? 'yellow' : 'green'

  document.querySelector('.title p').innerHTML = `
    ${alert.type} Details - ${alert.status}
    <img src="../images/circle-${color}.png" alt="status">
  `

  document.querySelector('.verification-details p').textContent = alert.report_count === 1 ? 'Reported by 1 student' : 'Reported by ' + alert.report_count + ' students'
  document.querySelector('.status-details p').textContent = alert.status
  document.querySelector('.location-detail-js p').textContent = alert.description
  document.querySelector('.review-button-js').onclick = () => {
    window.location.href = 'alertReview.html?id=' + id
  }
})
