// V2: no ES module imports — use window.API and window.checkAuth

let currentUser = null;
let currentPrefs = null;

async function init() {
  currentUser = await window.checkAuth();
  if (!currentUser) return;

  if (document.querySelector(".username-js"))
    document.querySelector(".username-js").textContent = currentUser.username;
  if (document.querySelector(".user-email-js"))
    document.querySelector(".user-email-js").textContent = currentUser.email;

  currentPrefs = await window.API.getPrefs();
  renderAllSections();

  const logoutBtn = document.querySelector('.logOut-js');
  if (logoutBtn) logoutBtn.addEventListener("click", window.logout);

  document.querySelector(".safety-edit-js").addEventListener("click", editSafety);
  document.querySelector(".navigation-edit-js").addEventListener("click", editNavigation);
  document.querySelector(".notification-edit-js").addEventListener("click", editNotification);
  document.querySelector(".quiet-hours-edit-js").addEventListener("click", editQuietHours);
}

function renderAllSections() {
  renderSafety();
  renderNavigation();
  renderNotification();
  renderQuietHours();
}

function renderSafety() {
  const items = currentPrefs.safety && currentPrefs.safety.length > 0
    ? currentPrefs.safety : ["None Selected"];
  const html = items.map(i => `<p>${i}</p>`).join('');
  document.querySelector('.safety-inner-card-js').innerHTML = `
    <div>${html}</div>
    <div class="edit-card safety-edit-js"><img src="../images/edit.png" alt="edit"></div>`;
  document.querySelector(".safety-edit-js").addEventListener("click", editSafety);
}

function renderNavigation() {
  const p = currentPrefs;
  document.querySelector('.navigation-inner-card-js').innerHTML = `
    <div class="navigation-display-card">
      <p>Route Preference: </p><p>${p.route_preference || 'fastest'}</p>
      <p>Elevator Preference: </p><p>${p.elevator_preference || 'prioritize'}</p>
      <p>Text Size: </p><p>${p.text_size || 'medium'}</p>
      <p>Color Mode: </p><p>${p.color_mode || 'standard'}</p>
    </div>
    <div class="edit-card navigation-edit-js"><img src="../images/edit.png" alt="edit"></div>`;
  document.querySelector(".navigation-edit-js").addEventListener("click", editNavigation);
}

function renderNotification() {
  const p = currentPrefs;
  const row = (label, key, imgPath) =>
    `<p>${label}</p><p><img src="../images/${imgPath}.png"> ${p[key]==='true'?'ON':'OFF'}</p>`;
  document.querySelector('.notification-inner-card-js').innerHTML = `
    <div class="notification-display-card">
      <p>Emergency Alert</p><p><img src="../images/lock-solid.png"> ON (Required)</p>
      ${row('Protest','notification_protest', p.notification_protest==='true'?'bell-black':'bell-slash-black')}
      ${row('Construction','notification_construction', p.notification_construction==='true'?'bell-black':'bell-slash-black')}
      ${row('Weather','notification_weather', p.notification_weather==='true'?'bell-black':'bell-slash-black')}
      ${row('Elevator Issues','notification_elevator', p.notification_elevator==='true'?'bell-black':'bell-slash-black')}
      ${row('General Notices','notification_general', p.notification_general==='true'?'bell-black':'bell-slash-black')}
    </div>
    <div class="edit-card notification-edit-js"><img src="../images/edit.png" alt="edit"></div>`;
  document.querySelector(".notification-edit-js").addEventListener("click", editNotification);
}

function renderQuietHours() {
  const p = currentPrefs;
  const enabled = p.quiet_hours_enabled === 'true';
  document.querySelector('.quiet-hours-inner-card-js').innerHTML = `
    <div class="quiet-hours-display-card">
      <p>Quiet Hours</p>
      <p><img src="../images/${enabled?'bell-black':'bell-slash-black'}.png"> ${enabled?'ON':'OFF'}</p>
      <p>Start Time</p><p>${p.quiet_hours_start}</p>
      <p>End Time</p><p>${p.quiet_hours_end}</p>
    </div>
    <div class="edit-card quiet-hours-edit-js"><img src="../images/edit.png" alt="edit"></div>`;
  document.querySelector(".quiet-hours-edit-js").addEventListener("click", editQuietHours);
}

function editSafety() {
  const checked = (val) => currentPrefs.safety?.includes(val) ? 'checked' : '';
  document.querySelector('.safety-inner-card-js').innerHTML = `
    <div>
      <form id="accessibility-form">
        <input type="checkbox" id="wheelchair" name="accessibility" value="Wheelchair User" ${checked('Wheelchair User')}>
        <label for="wheelchair">Wheelchair User</label><br>
        <input type="checkbox" id="crutches" name="accessibility" value="Uses Crutches / Mobility Aid" ${checked('Uses Crutches / Mobility Aid')}>
        <label for="crutches">Uses Crutches / Mobility Aid</label><br>
        <input type="checkbox" id="stairs" name="accessibility" value="Avoid Stairs" ${checked('Avoid Stairs')}>
        <label for="stairs">Avoid Stairs</label><br>
        <input type="checkbox" id="slopes" name="accessibility" value="Avoid Steep Slopes" ${checked('Avoid Steep Slopes')}>
        <label for="slopes">Avoid Steep Slopes</label><br>
        <input type="checkbox" id="visual" name="accessibility" value="Visual Impairment" ${checked('Visual Impairment')}>
        <label for="visual">Visual Impairment</label><br>
        <input type="checkbox" id="anxiety" name="accessibility" value="Anxiety-Sensitive Mode" ${checked('Anxiety-Sensitive Mode')}>
        <label for="anxiety">Anxiety-Sensitive Mode</label><br>
        <input type="checkbox" id="crowd" name="accessibility" value="Prefer Low-Crowd Routes" ${checked('Prefer Low-Crowd Routes')}>
        <label for="crowd">Prefer Low-Crowd Routes</label><br><br>
      </form>
    </div>
    <div class="edit-card">
      <button type="button" class="save-button save-safety-js">
        <img src="../images/save.png" alt="save"><p>save</p>
      </button>
    </div>`;
  document.querySelector('.save-safety-js').addEventListener("click", saveSafety);
}

function editNavigation() {
  const p = currentPrefs;
  document.querySelector('.navigation-inner-card-js').innerHTML = `
    <div class="navigation-display-card">
      <label for="route">Route Preference:</label>
      <select id="route">
        <option value="fastest" ${p.route_preference==='fastest'?'selected':''}>Fastest Route</option>
        <option value="safest" ${p.route_preference==='safest'?'selected':''}>Safest Route</option>
        <option value="accessible" ${p.route_preference==='accessible'?'selected':''}>Fully Accessible Route</option>
      </select>
      <label for="elevator">Elevator Preference:</label>
      <select id="elevator">
        <option value="prioritize" ${p.elevator_preference==='prioritize'?'selected':''}>Prioritize Elevator</option>
        <option value="avoid" ${p.elevator_preference==='avoid'?'selected':''}>Avoid Elevator</option>
      </select>
      <label for="text">Text Size:</label>
      <select id="text">
        <option value="small" ${p.text_size==='small'?'selected':''}>Small</option>
        <option value="medium" ${p.text_size==='medium'?'selected':''}>Medium</option>
        <option value="large" ${p.text_size==='large'?'selected':''}>Large</option>
      </select>
      <label for="color">Color Mode:</label>
      <select id="color">
        <option value="standard" ${p.color_mode==='standard'?'selected':''}>Standard</option>
        <option value="high-contrast" ${p.color_mode==='high-contrast'?'selected':''}>High Contrast</option>
      </select>
    </div>
    <div class="edit-card">
      <button type="button" class="save-button save-nav-js">
        <img src="../images/save.png" alt="save"><p>save</p>
      </button>
    </div>`;
  document.querySelector(".save-nav-js").addEventListener("click", saveNavigation);
}

function editNotification() {
  const p = currentPrefs;
  const row = (label, id, key) =>
    `<p>${label}</p><label class="switch"><input type="checkbox" id="${id}" ${p[key]==='true'?'checked':''}><span class="slider round"></span></label>`;
  document.querySelector('.notification-inner-card-js').innerHTML = `
    <div class="notification-display-card">
      <p>Emergency Alert</p><p><img src="../images/lock-solid.png"> ON (Required)</p>
      ${row('Protest','pref-protest','notification_protest')}
      ${row('Construction','pref-construction','notification_construction')}
      ${row('Weather','pref-weather','notification_weather')}
      ${row('Elevator Issues','pref-elevator','notification_elevator')}
      ${row('General Notices','pref-general','notification_general')}
    </div>
    <div class="edit-card">
      <button type="button" class="save-button save-notif-js">
        <img src="../images/save.png" alt="save"><p>save</p>
      </button>
    </div>`;
  document.querySelector(".save-notif-js").addEventListener("click", saveNotification);
}

function editQuietHours() {
  const p = currentPrefs;
  document.querySelector('.quiet-hours-inner-card-js').innerHTML = `
    <div class="quiet-hours-display-card">
      <p>Quiet Hours</p>
      <label class="switch"><input type="checkbox" id="quiet-hours-toggle" ${p.quiet_hours_enabled==='true'?'checked':''}><span class="slider round"></span></label>
      <p>Start Time</p>
      <input type="time" id="start-time" value="${p.quiet_hours_start}">
      <p>End Time</p>
      <input type="time" id="end-time" value="${p.quiet_hours_end}">
    </div>
    <div class="edit-card">
      <button type="button" class="save-button save-quiet-js">
        <img src="../images/save.png" alt="save"><p>save</p>
      </button>
    </div>`;
  document.querySelector(".save-quiet-js").addEventListener("click", saveQuietHours);
}

async function saveSafety() {
  const checkboxes = document.querySelectorAll('#accessibility-form input[name="accessibility"]:checked');
  const safety = Array.from(checkboxes).map(cb => cb.value);
  currentPrefs = await window.API.updatePrefs({ safety });
  await window.API.updateProfile({ accessibility: safety });
  renderSafety();
}

async function saveNavigation() {
  const route_preference = document.getElementById('route').value;
  const elevator_preference = document.getElementById('elevator').value;
  const text_size = document.getElementById('text').value;
  const color_mode = document.getElementById('color').value;
  currentPrefs = await window.API.updatePrefs({ route_preference, elevator_preference, text_size, color_mode });
  renderNavigation();
}

async function saveNotification() {
  const data = {
    notification_protest: document.getElementById('pref-protest')?.checked ? 'true' : 'false',
    notification_construction: document.getElementById('pref-construction')?.checked ? 'true' : 'false',
    notification_weather: document.getElementById('pref-weather')?.checked ? 'true' : 'false',
    notification_elevator: document.getElementById('pref-elevator')?.checked ? 'true' : 'false',
    notification_general: document.getElementById('pref-general')?.checked ? 'true' : 'false',
  };
  currentPrefs = await window.API.updatePrefs(data);
  renderNotification();
}

async function saveQuietHours() {
  const data = {
    quiet_hours_enabled: document.getElementById('quiet-hours-toggle')?.checked ? 'true' : 'false',
    quiet_hours_start: document.getElementById('start-time')?.value || '22:00',
    quiet_hours_end: document.getElementById('end-time')?.value || '07:00',
  };
  currentPrefs = await window.API.updatePrefs(data);
  renderQuietHours();
}

document.addEventListener("DOMContentLoaded", init);
