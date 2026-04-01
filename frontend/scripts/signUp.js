function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function setError(message) {
  const el = document.querySelector('.signUp-error-js')
  if (el) { el.textContent = message; el.style.display = 'block' }
}

function clearError() {
  const el = document.querySelector('.signUp-error-js')
  if (el) { el.textContent = ''; el.style.display = 'none' }
}

function togglePassword(id) {
  const input = document.getElementById(id)
  const icon = document.querySelector('.show-' + id + '-js')
  if (input.type === 'password') { input.type = 'text'; icon.textContent = '👁️‍🗨️' }
  else { input.type = 'password'; icon.textContent = '👁' }
}

async function handleSignUp(event) {
  event.preventDefault()
  clearError()

  const username = document.getElementById('username')?.value.trim() || ''
  const email = document.getElementById('email')?.value.trim() || ''
  const password = document.getElementById('password')?.value || ''
  const confirmPassword = document.getElementById('re-enter-password')?.value || ''
  const accessibility = document.getElementById('accessibility')?.value || ''

  if (!username || !email || !password || !confirmPassword) {
    setError('Please fill in all required fields.')
    return
  }
  if (!isValidEmail(email)) {
    setError('Please enter a valid email address.')
    return
  }
  if (password !== confirmPassword) {
    setError('Passwords do not match.')
    return
  }

  const result = await window.API.signup({
    username, email, password,
    accessibility: accessibility ? [accessibility] : []
  })

  if (result.detail) {
    setError(result.detail)
    return
  }

  alert('Sign up successful! Please log in.')
  window.location.href = 'logIn.html'
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.show-password-js')
    ?.addEventListener('click', () => togglePassword('password'))
  document.querySelector('.show-re-enter-password-js')
    ?.addEventListener('click', () => togglePassword('re-enter-password'))
  document.querySelector('.signUp-js')
    ?.addEventListener('click', handleSignUp)
})
