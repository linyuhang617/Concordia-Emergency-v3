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

  const situation = document.querySelector('input[name="situation"]:checked')?.value || '';
  const mobility = Array.from(document.querySelectorAll('input[name="mobility"]:checked')).map(cb => cb.value);

  const data = {
    "Hazard Type": "Protest",
    "Building": building,
    "Intersection Street 1": document.getElementById("street1").value,
    "Intersection Street 2": document.getElementById("street2").value,
    "Current Situation": situation,
    "Mobility Impact": mobility,
    "Intensity Level": document.getElementById("intensity").value
  };

  sessionStorage.setItem("report", JSON.stringify(data));
  window.location.href = "confirmation.html";
});
