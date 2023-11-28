const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;

let scriptProcesses = {
    script1: null,
    script2: null,
    script3: null,
    script4: null
};

let scriptStatuses = {
    script1: { active: false, lastHeartbeat: null },
    script2: { active: false, lastHeartbeat: null },
    script3: { active: false, lastHeartbeat: null },
    script4: { active: false, lastHeartbeat: null }
};

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log('received: %s', message);
    });

    ws.send(JSON.stringify({ message: 'Connected to WebSocket server' }));
});

function broadcastScriptStatus() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(scriptStatuses));
        }
    });
}


app.use(express.static('public'));


app.post('/start-script/:scriptId', (req, res) => {
    const scriptId = req.params.scriptId;


    if ((scriptProcesses[scriptId])) {
        return res.status(400).send(`Script ${scriptId} is already running.`);
    }

    const process = spawn('python', [`./scripts/${scriptId}.py`]);
    scriptProcesses[scriptId] = process.pid;

    process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    res.send(`Script ${scriptId} started successfully.`);
    broadcastScriptStatus(); 
});

app.post('/stop-script/:scriptId', (req, res) => {
    const scriptId = req.params.scriptId;
    const pid = scriptProcesses[scriptId];

    if (pid) {
        try {
            process.kill(pid, 'SIGTERM');  // Відправлення сигналу SIGTERM
            scriptProcesses[scriptId] = null;
            res.send(`Script ${scriptId} stopped successfully.`);
        } catch (error) {
            console.error(`Error: ${error}`);
            res.status(500).send(`Error stopping script ${scriptId}`);
        }
    } else {
        res.status(400).send(`No script ${scriptId} is running.`);
    }
    broadcastScriptStatus(); 
});

function checkHeartbeat(scriptId) {
    const heartbeatFile = `heartbeat_${scriptId}.txt`;
    fs.readFile(heartbeatFile, 'utf8', (err, data) => {
        if (err) {
            scriptStatuses[scriptId].active = false;
            console.error(`Не вдалося прочитати файл heartbeat для ${scriptId}`);
            // Тут можна додати логіку для спроби перезапуску або сповіщення
            return;
        }

        const lastHeartbeat = parseFloat(data.split(':')[1]);
        const currentTime = Date.now() / 1000;  // Перетворюємо в секунди

        if (currentTime - lastHeartbeat > 5) {  // Перевірка на перевищення 10 секунд
            console.error(`${scriptId} may have stopped running.`);
            scriptStatuses[scriptId].active = false;
        } else {
            scriptStatuses[scriptId].active = true;
        }
    });
}

// Регулярне оновлення статусів скриптів
setInterval(() => {
    Object.keys(scriptProcesses).forEach(checkHeartbeat);
    broadcastScriptStatus(); 
}, 1000); // Оновлення кожні 5 секунд


server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
