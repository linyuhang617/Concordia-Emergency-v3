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

  const floors = Array.from(document.querySelectorAll('input[name="floors"]:checked')).map(cb => cb.value);

  const data = {
    "Hazard Type": "Elevator Malfunction",
    "Building": building,
    "Floors Affected": floors,
    "Elevator Status": document.getElementById("status").value,
    "Alternative Access": document.getElementById("alternative").value,
    "Urgency": document.getElementById("urgency").value
  };

  sessionStorage.setItem("report", JSON.stringify(data));
  window.location.href = "confirmation.html";
});
