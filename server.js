//server.js
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const processes = {};

const scriptUrls = {
    script1: '',
    script2: '',
    script3: '',
    script4: '',
    script5: '',
    script6: '',
    script7: '',
    script8: ''
};

const restartAllowed = {
    script1: true,
    script2: true,
    script3: true,
    script4: true,
    script5: true,
    script6: true,
    script7: true,
    script8: true
};

const scriptLoggers = {};
const scriptNames = ['script1', 'script2', 'script3', 'script4', 'script5', 'script6', 'script7', 'script8'];
scriptNames.forEach(scriptName => {
    scriptLoggers[scriptName] = fs.createWriteStream(`${scriptName}_log.txt`, { flags: 'a' });
});

function getTimestamp() {
    return new Date().toLocaleString();
}

function writeToLog(scriptName, message) {
    const timestamp = getTimestamp();
    const formattedMessage = `${timestamp} [${scriptName}] ${message}\n`;

    if (scriptLoggers[scriptName]) {
        scriptLoggers[scriptName].write(formattedMessage);
    }
}


function startFfmpeg(scriptName, parameters) {
    if (processes[scriptName]) {
        writeToLog(scriptName, `Try to lunch ${scriptName}. Script is already running`);
        return;
    }

    const ffmpeg = spawn('ffmpeg', parameters);
    processes[scriptName] = ffmpeg;

    ffmpeg.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
        const line = data.toString();
        // logger.write(`[${scriptName}] ${line}`);
        broadcastMessage(`[${scriptName}]: ${line}`);
        if (line.includes('Decklink input buffer overrun')) {
            console.log(`Decklink input buffer overrun detected in ${scriptName}. Restarting...`);
            writeToLog(scriptName, 'Decklink input buffer overrun detected. Restarting');
            broadcastMessage(`Decklink input buffer overrun detected in ${scriptName}. Restarting...`);
            ffmpeg.kill(); // Зупинка поточного процесу

            // Перезапуск скрипта
            setTimeout(() => {
                startFfmpeg(scriptName);
            }, 5000); // Затримка перед перезапуском, щоб уникнути постійних перезапусків
        }
    });

    ffmpeg.on('close', (code) => {
        if (code === null || code === 255) {
            console.log(`Script ${scriptName} stopped with exit code: ${code}. Not restarting.`);
            writeToLog(scriptName, `stopped with exit code: ${code}. Not restarting.`);
            broadcastMessage(`Script ${scriptName} stopped.`);
        } else {
            console.log(`Script ${scriptName} crashed with exit code: ${code}. Checking for restart...`);
            writeToLog(scriptName, `crashed with exit code: ${code}. Checking for restart...`);
            broadcastMessage(`Script ${scriptName} crashed with exit code: ${code}. Checking for restart...`);
    
            if (restartAllowed[scriptName]) {
                setTimeout(() => {
                    console.log(`Restarting script ${scriptName}...`);
                    writeToLog(scriptName, 'Restarting script');
                    startFfmpeg(scriptName, parameters); // Передайте параметри для перезапуску
                }, 5000); // Затримка 5 секунд
            } else {
                console.log(`Restart of script ${scriptName} is not allowed.`);
                writeToLog(scriptName, 'Restart not allowed.');
                broadcastMessage(`Restart of script ${scriptName} is not allowed.`);

            }
        }
        delete processes[scriptName];
    });
}

wss.on('connection', ws => {
    ws.send(JSON.stringify({ command: 'init', scriptUrls }));
    ws.on('message', message => {
        const { command, scriptName, parameters, url } = JSON.parse(message);

        if (command === 'start') {
            scriptUrls[scriptName] = url; // Зберігає новий URL
            restartAllowed[scriptName] = true; // Дозволяємо перезапуск скрипта
            startFfmpeg(scriptName, parameters);
        } else if (command === 'stop' && processes[scriptName]) {
            processes[scriptName].kill();
            restartAllowed[scriptName] = false; // Запобігання перезапуску

            ws.send(`Stopping script ${scriptName}...`);
        } else {
            ws.send(`Send comand to stop restarting ${scriptName}`);
            restartAllowed[scriptName] = false; // Запобігання перезапуску
        }
    });
});

function broadcastMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

app.use(express.static('public'));

server.listen(8079, () => {
    console.log('Server is running on port 8079');
});
