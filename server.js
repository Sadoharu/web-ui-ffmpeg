const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const processes = {};


const scriptConfigurations = {
    script1: ['-f', 'decklink', '-channels', '8', '-i', '81:5945bb70:00000000', '-threads', '8',
    '-map', '0', '-c:v', 'libx264', '-s', '1920x1080', '-b:v', '8M', '-minrate', '8M', '-maxrate', '8M', '-bufsize', '8M', '-rc', 'cbr', '-profile:v',
    'main', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vf', 'yadif', '-c:a', 'aac', '-ac', '8', '-b:a',
    '1536k', '-r', '25', '-muxrate', '12M', '-pcr_period', '20', '-f', 'mpegts',
    'srt://10.2.0.38:6000?mode=caller&latency=200&transtype=live&streamid=08d07f90-71be-487e-a623-e4765929c87f,mode:publish'],
    script2: ['-i', 'srt://10.10.150.67:1234',
    '-f', 'decklink',
    '-pix_fmt', 'uyvy422',
    '81:16eea9a0:00000000'],
    script3: ['-f', 'decklink' /* інші параметри для script3 */],
    script4: ['-f', 'decklink' /* інші параметри для script4 */]
};


const scriptLoggers = {};
Object.keys(scriptConfigurations).forEach(scriptName => {
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
    console.log(formattedMessage);
}

function startFfmpeg(scriptName) {
    if (processes[scriptName]) {
        console.log(`Script ${scriptName} is already running.`);
        writeToLog(scriptName, `Try to lunch ${scriptName}. Script is already running`);
        return;
    }

    const ffmpegArgs = scriptConfigurations[scriptName];
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    processes[scriptName] = ffmpeg;

    ffmpeg.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
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
        if (code === null) {
            console.log(`Script ${scriptName} stopped with exit code: ${code}. Not restarting.`);
            writeToLog(scriptName, `stopped with exit code: ${code}. Not restarting.`);
            broadcastMessage(`Script ${scriptName} stopped.`);
        } else if (code === 255) {
            console.log(`Script ${scriptName} stopped with exit code: ${code}. Not restarting.`);
            writeToLog(scriptName, `stopped with exit code: ${code}. Not restarting.`);
            broadcastMessage(`Script ${scriptName} stopped.`);
        } else {
            console.log(`Script ${scriptName} crashed with exit code: ${code}. Restarting...`);
            writeToLog(scriptName, `Script ${scriptName} crashed with exit code: ${code}. Restarting...`);
            broadcastMessage(`Script ${scriptName} crashed with exit code: ${code}. Restarting...`);
            setTimeout(() => {
                console.log(`Restarting script ${scriptName}...`);
                writeToLog(scriptName, 'Restarting script');
                startFfmpeg(scriptName); // Перезапуск скрипта
            }, 5000); // Затримка 5 секунд
        }
        delete processes[scriptName];
    });
}

wss.on('connection', ws => {
    ws.on('message', message => {
        const { command, scriptName } = JSON.parse(message);

        if (command === 'start' && scriptConfigurations[scriptName]) {
            startFfmpeg(scriptName);
        } else if (command === 'stop' && processes[scriptName]) {
            processes[scriptName].kill();
            ws.send(`Stopping script ${scriptName}...`);
        } else {
            ws.send(`Invalid command or script name: ${scriptName}`);
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
