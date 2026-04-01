let isCrisisMode = false

function toggleMenu() {
  const menu = document.getElementById('dropdownMenu')
  if (!menu) return
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block'
}

function toggleCrisisMode() {
  isCrisisMode = !isCrisisMode

  const crisisBtn = document.querySelector('.crisis')
  const sidePanel = document.querySelector('.side-panel')
  const bottomSection = document.querySelector('.bottom-section')
  const mapSection = document.querySelector('.map-section')
  const logo = document.querySelector('.logo')
  const authButtons = document.querySelector('.auth-buttons')

  if (isCrisisMode) {
    document.body.style.backgroundColor = '#912338'
    if (crisisBtn) { crisisBtn.textContent = '❎ Crisis Mode'; crisisBtn.style.color = '#ffffff'; crisisBtn.style.fontWeight = 'bold' }
    ;[sidePanel, bottomSection, logo, authButtons].forEach(el => {
      if (el) { el.style.opacity = '0.4'; el.style.pointerEvents = 'none'; el.style.userSelect = 'none' }
    })
    if (mapSection) { mapSection.style.opacity = '1'; mapSection.style.pointerEvents = 'auto'; mapSection.style.boxShadow = '0px 0px 20px 5px rgba(0,0,0,0.5)'; mapSection.style.position = 'relative'; mapSection.style.zIndex = '10' }
  } else {
    document.body.style.backgroundColor = ''
    if (crisisBtn) { crisisBtn.textContent = '⚠️ Click for Crisis Mode'; crisisBtn.style.color = ''; crisisBtn.style.fontWeight = '' }
    ;[sidePanel, bottomSection, logo, authButtons].forEach(el => {
      if (el) { el.style.opacity = ''; el.style.pointerEvents = ''; el.style.userSelect = '' }
    })
    if (mapSection) { mapSection.style.boxShadow = ''; mapSection.style.zIndex = '' }
  }
}

function updateOfflineBanner() {
  const banner = document.getElementById('offline-banner')
  if (!banner) return
  banner.style.display = navigator.onLine ? 'none' : 'block'
}

document.addEventListener('DOMContentLoaded', async () => {
  const map = initMap()
  initLocationFeatures(map)
  addDestinationSearch(map)

  updateOfflineBanner()
  window.addEventListener('offline', updateOfflineBanner)
  window.addEventListener('online', updateOfflineBanner)

  const menuBtn = document.querySelector('.mobile-menu')
  if (menuBtn) menuBtn.addEventListener('click', toggleMenu)

  const crisisBtn = document.querySelector('.crisis')
  if (crisisBtn) crisisBtn.addEventListener('click', toggleCrisisMode)

  // Check auth + show profile icon
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const user = await window.API.getMe()
    if (user.detail) return

    const profileButtons = document.querySelector('.auth-buttons')
    if (profileButtons) {
      profileButtons.innerHTML = `
        <div class="profile profile-js" onclick="window.location.href='pages/profile.html'" style="display:flex;align-items:center;gap:10px;padding:0 20px;">
          <div style="width:36px;height:36px;border-radius:50%;background:#912338;display:flex;justify-content:center;align-items:center;">
            <img src="images/user-regular.png" style="width:20px;height:20px;filter:invert(1);">
          </div>
          Profile
        </div>
      `
      profileButtons.style.cssText = 'display:flex;width:auto;background:white;cursor:pointer;justify-content:flex-end;align-items:center;font-weight:bold;color:#912338;'
    }

    const dropdownMenu = document.querySelector('.dropdown-menu')
    if (dropdownMenu) {
      dropdownMenu.innerHTML = `<div class="profile" onclick="window.location.href='pages/profile.html'">Profile</div>`
    }
  } catch (e) {
    console.warn('Auth check failed:', e)
  }
})
