function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function setError(message) {
  var el = document.querySelector('.signUp-error-js')
  if (el) { el.textContent = message; el.classList.add('visible') }
}

function clearError() {
  var el = document.querySelector('.signUp-error-js')
  if (el) { el.textContent = ''; el.classList.remove('visible') }
}

function togglePassword(id) {
  var input = document.getElementById(id)
  var icon = document.querySelector('.show-' + id + '-js')
  if (input.type === 'password') { input.type = 'text'; icon.textContent = '👁️‍🗨️' }
  else { input.type = 'password'; icon.textContent = '👁' }
}

async function handleSignUp(event) {
  if (event) event.preventDefault()
  clearError()

  var username = (document.getElementById('username') || {}).value || ''
  var email = (document.getElementById('email') || {}).value || ''
  var password = (document.getElementById('password') || {}).value || ''
  var confirmPassword = (document.getElementById('re-enter-password') || {}).value || ''
  var accessibility = (document.getElementById('accessibility') || {}).value || ''

  username = username.trim()
  email = email.trim()

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

  var result = await window.API.signup({
    username: username,
    email: email,
    password: password,
    accessibility: accessibility ? [accessibility] : []
  })

  if (result.detail) {
    setError(result.detail)
    return
  }

  alert('Sign up successful! Please log in.')
  window.location.href = 'login.html'
}

document.addEventListener('DOMContentLoaded', function() {
  var showPw = document.querySelector('.show-password-js')
  if (showPw) showPw.addEventListener('click', function() { togglePassword('password') })

  var showRePw = document.querySelector('.show-re-enter-password-js')
  if (showRePw) showRePw.addEventListener('click', function() { togglePassword('re-enter-password') })

  var signUpBtn = document.querySelector('.signUp-js')
  if (signUpBtn) signUpBtn.addEventListener('click', handleSignUp)
})
