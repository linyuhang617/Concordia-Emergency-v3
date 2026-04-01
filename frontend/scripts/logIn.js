function togglePassword() {
  var input = document.getElementById('password')
  var icon = document.querySelector('.show-password-js')
  if (input.type === 'password') { input.type = 'text'; icon.textContent = '👁️‍🗨️' }
  else { input.type = 'password'; icon.textContent = '👁' }
}

async function handleLogin(event) {
  if (event) event.preventDefault()

  var username = (document.getElementById('username') || {}).value || ''
  var password = (document.getElementById('password') || {}).value || ''

  username = username.trim()
  if (!username || !password) {
    alert('Please enter username and password.')
    return
  }

  var result = await window.API.login({ username: username, password: password })

  if (result.detail || !result.token) {
    alert('Invalid username or password.')
    return
  }

  localStorage.setItem('token', result.token)
  window.location.href = '../index.html'
}

document.addEventListener('DOMContentLoaded', function() {
  var showBtn = document.querySelector('.show-password-js')
  if (showBtn) showBtn.addEventListener('click', togglePassword)

  var loginBtn = document.querySelector('.logIn-js')
  if (loginBtn) loginBtn.addEventListener('click', handleLogin)
})
