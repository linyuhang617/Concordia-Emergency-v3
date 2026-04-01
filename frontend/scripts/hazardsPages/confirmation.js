// Map from Hazard Type display name → API type value
const typeMap = {
  "Protest": "Protest",
  "Construction": "Construction",
  "Weather": "Weather Hazard",
  "Elevator Malfunction": "Elevator Malfunction",
  "Others": "Others"
};

document.addEventListener("DOMContentLoaded", () => {
  const saved = sessionStorage.getItem("report");
  if (!saved) return;

  const data = JSON.parse(saved);
  const container = document.getElementById("detail");

  Object.entries(data).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "confirm-row";
    const displayValue = Array.isArray(value)
      ? (value.length ? value.join(', ') : 'N/A')
      : (value === undefined || value === null || String(value).trim() === '' ? 'N/A' : value);
    row.innerHTML = `<span class="confirm-key">${key}:</span><span class="confirm-value">${displayValue}</span>`;
    container.appendChild(row);
  });

  const submitBtn = document.getElementById("submitBtn");
  const popup = document.getElementById("successPopup");
  const okBtn = document.getElementById("popupOkBtn");

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;

    // Find building lat/lng from building name
    const buildingName = data["Building"];
    const bldg = window.buildings.find(b => b.buildingName === buildingName) || { code: 'XX', lat: 45.4973, lng: -73.5789 };

    // Build description from all non-location fields
    const skipKeys = ["Hazard Type", "Building", "Intersection Street 1", "Intersection Street 2"];
    const descParts = Object.entries(data)
      .filter(([k]) => !skipKeys.includes(k))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v || 'N/A'}`);
    const description = descParts.join(' | ') || 'No additional details';

    const payload = {
      type: typeMap[data["Hazard Type"]] || data["Hazard Type"],
      building_code: bldg.code,
      location_lat: String(bldg.lat),
      location_lng: String(bldg.lng),
      description: description,
      status: "UNDER REVIEW",
      verification: "Reported by 1 student"
    };

    try {
      const result = await window.API.createAlert(payload);
      if (result && result.id) {
        sessionStorage.removeItem("report");
        popup.style.display = "flex";
      } else {
        alert("Submission failed. Please try again.");
        submitBtn.disabled = false;
      }
    } catch (e) {
      alert("Network error. Please try again.");
      submitBtn.disabled = false;
    }
  });

  okBtn.addEventListener("click", () => {
    window.location.href = "../../homepage.html";
  });
});
