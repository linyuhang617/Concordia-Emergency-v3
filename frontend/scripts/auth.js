function getToken() {
  return localStorage.getItem('token')
}

function isAuthenticated() {
  return Boolean(getToken())
}

function logout() {
  localStorage.removeItem('token')
  window.location.href = '/pages/logIn.html'
}

async function checkAuth() {
  const token = getToken()
  if (!token) {
    window.location.href = '/pages/logIn.html'
    return null
  }
  try {
    const data = await window.API.getMe()
    if (data.detail) {
      localStorage.removeItem('token')
      window.location.href = '/pages/logIn.html'
      return null
    }
    return data
  } catch (e) {
    localStorage.removeItem('token')
    window.location.href = '/pages/logIn.html'
    return null
  }
}
