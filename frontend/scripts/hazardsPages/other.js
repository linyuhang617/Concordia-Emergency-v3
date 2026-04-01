const select = document.getElementById("building");
window.buildings.forEach((b) => {
  const option = document.createElement("option");
  option.value = b.buildingName;
  option.textContent = b.buildingName;
  select.appendChild(option);
});

document.addEventListener("DOMContentLoaded", () => {
  sessionStorage.removeItem("report");
  document.getElementById('description').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });
});

document.getElementById("forward").addEventListener("click", async function () {
  const building = document.getElementById("building").value.trim();
  if (!building) { alert("Please choose a building to make report."); return; }

  const description = document.getElementById("description").value.trim();
  if (!description) { alert("Please enter a description."); return; }

  const data = {
    "Hazard Type": "Others",
    "Building": building,
    "Intersection Street 1": document.getElementById("street1").value,
    "Intersection Street 2": document.getElementById("street2").value,
    "Impact Type": document.getElementById("impact").value,
    "Description": document.getElementById("description").value
  };

  sessionStorage.setItem("report", JSON.stringify(data));
  window.location.href = "confirmation.html";
});
