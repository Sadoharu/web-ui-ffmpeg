const socket = new WebSocket('ws://localhost:3000');

socket.onmessage = function(event) {
    const data = event.data;
    const statusElements = document.querySelectorAll('.status');
    statusElements.forEach(statusEl => {
        if (data.includes(statusEl.parentElement.getAttribute('data-script'))) {
            statusEl.textContent = `Status: ${data}`;
        }
    });
};

document.querySelectorAll('.script-group').forEach(group => {
    const scriptName = group.getAttribute('data-script');
    
    group.querySelector('.start-btn').addEventListener('click', () => {
        socket.send(JSON.stringify({ command: 'start', scriptName }));
    });

    group.querySelector('.stop-btn').addEventListener('click', () => {
        socket.send(JSON.stringify({ command: 'stop', scriptName }));
    });
});
