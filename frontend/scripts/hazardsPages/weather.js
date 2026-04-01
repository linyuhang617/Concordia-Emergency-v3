const select = document.getElementById("building");
window.buildings.forEach((b) => {
  const option = document.createElement("option");
  option.value = b.buildingName;
  option.textContent = b.buildingName;
  select.appendChild(option);
});

document.addEventListener("DOMContentLoaded", () => {
  sessionStorage.removeItem("report");
});

document.getElementById("forward").addEventListener("click", async function () {
  const building = document.getElementById("building").value.trim();
  if (!building) { alert("Please choose a building to make report."); return; }

  const accessibility = Array.from(document.querySelectorAll('input[name="accessibility"]:checked')).map(cb => cb.value);

  const data = {
    "Hazard Type": "Weather",
    "Building": building,
    "Intersection Street 1": document.getElementById("street1").value,
    "Intersection Street 2": document.getElementById("street2").value,
    "Type of Weather": document.getElementById("type-weather").value,
    "Severity": document.getElementById("severity").value,
    "Accessibility Impact": accessibility
  };

  sessionStorage.setItem("report", JSON.stringify(data));
  window.location.href = "confirmation.html";
});
