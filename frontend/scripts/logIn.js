function togglePassword() {
  const input = document.getElementById('password')
  const icon = document.querySelector('.show-password-js')
  if (input.type === 'password') { input.type = 'text'; icon.textContent = '👁️‍🗨️' }
  else { input.type = 'password'; icon.textContent = '👁' }
}

async function handleLogin(event) {
  event.preventDefault()

  const username = document.getElementById('username')?.value.trim() || ''
  const password = document.getElementById('password')?.value || ''

  if (!username || !password) {
    alert('Please enter username and password.')
    return
  }

  const result = await window.API.login({ username, password })

  if (result.detail || !result.token) {
    alert('Invalid username or password.')
    return
  }

  localStorage.setItem('token', result.token)
  window.location.href = '../homepage.html'
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.show-password-js')
    ?.addEventListener('click', togglePassword)
  document.querySelector('.logIn-js')
    ?.addEventListener('click', handleLogin)
})
