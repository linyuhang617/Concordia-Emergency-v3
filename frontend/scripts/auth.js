function getToken() {
  return localStorage.getItem('token')
}

function isAuthenticated() {
  return Boolean(getToken())
}

function logout() {
  localStorage.removeItem('token')
  window.location.href = '/pages/login.html'
}

async function checkAuth() {
  var token = getToken()
  if (!token) {
    window.location.href = '/pages/login.html'
    return null
  }
  try {
    var data = await window.API.getMe()
    if (data.detail) {
      localStorage.removeItem('token')
      window.location.href = '/pages/login.html'
      return null
    }
    return data
  } catch (e) {
    localStorage.removeItem('token')
    window.location.href = '/pages/login.html'
    return null
  }
}

window.checkAuth = checkAuth
window.logout = logout
window.isAuthenticated = isAuthenticated
