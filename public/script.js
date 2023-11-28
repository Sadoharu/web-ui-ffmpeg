const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('message', function (event) {
  const scriptStatuses = JSON.parse(event.data);
  console.log('Script statuses updated', scriptStatuses);

  // Тут ви можете оновити UI з новими статусами
  updateStatuses(scriptStatuses);
});

function updateStatuses(statuses) {
  for (const [scriptId, status] of Object.entries(statuses)) {
      const statusElement = document.getElementById(`status-${scriptId}`);
      if (statusElement) {
          statusElement.textContent = `Status: ${status.active ? 'Running' : 'Stopped'}`;
      }
  }
}

function startScript(scriptId) {
  fetch(`/start-script/${scriptId}`, { method: 'POST' })
      .then(response => response.text())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
}

function stopScript(scriptId) {
  fetch(`/stop-script/${scriptId}`, { method: 'POST' })
      .then(response => response.text())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
}

document.querySelectorAll('.start-btn').forEach(button => {
  button.addEventListener('click', () => startScript(button.dataset.scriptId));
});

document.querySelectorAll('.stop-btn').forEach(button => {
  button.addEventListener('click', () => stopScript(button.dataset.scriptId));
});
