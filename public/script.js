//public/script.js
const socket = new WebSocket('ws://localhost:8079');

const scriptParameters = {
    script1: ['-f', 'decklink', '-channels', '2', '-i', '81:2545bb71:00000000', '-map', '0', '-c:v', 'h264_nvenc', '-s', '1920x1080', '-b:v', '8M', '-minrate', '8M', '-maxrate', '8M', '-bufsize', '8M', '-rc', 'cbr', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-preset', 'p1', '-vf', 'yadif', '-c:a', 'aac', '-ac', '2', '-b:a', '256k', '-ar', '44100', '-r', '25', '-muxrate', '9M', '-pcr_period', '20', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script2: ['-f', 'decklink', '-channels', '2', '-i', '81:2545bb71:00000000', '-map', '0', '-c:v', 'h264_nvenc', '-s', '1920x1080', '-b:v', '8M', '-minrate', '8M', '-maxrate', '8M', '-bufsize', '8M', '-rc', 'cbr', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-preset', 'p1', '-vf', 'yadif', '-c:a', 'aac', '-ac', '2', '-b:a', '256k', '-ar', '44100', '-r', '25', '-muxrate', '9M', '-pcr_period', '20', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script3: ['-f', 'decklink', '-channels', '2', '-i', '81:2545bb71:00000000', '-map', '0', '-c:v', 'h264_nvenc', '-s', '1920x1080', '-b:v', '8M', '-minrate', '8M', '-maxrate', '8M', '-bufsize', '8M', '-rc', 'cbr', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-preset', 'p1', '-vf', 'yadif', '-c:a', 'aac', '-ac', '2', '-b:a', '256k', '-ar', '44100', '-r', '25', '-muxrate', '9M', '-pcr_period', '20', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script4: ['-f', 'decklink', '-channels', '2', '-i', '81:2545bb71:00000000', '-map', '0', '-c:v', 'h264_nvenc', '-s', '1920x1080', '-b:v', '8M', '-minrate', '8M', '-maxrate', '8M', '-bufsize', '8M', '-rc', 'cbr', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-preset', 'p1', '-vf', 'yadif', '-c:a', 'aac', '-ac', '2', '-b:a', '256k', '-ar', '44100', '-r', '25', '-muxrate', '9M', '-pcr_period', '20', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script5: [],
    script6: [],
    script7: ['-i', 'URL_PLACEHOLDER', '-f', 'decklink', '-pix_fmt', 'uyvy422', '81:2545bb72:00000000'],
    script8: ['-i', 'URL_PLACEHOLDER', '-f', 'decklink', '-pix_fmt', 'uyvy422', '81:2545bb73:00000000']
};

socket.onmessage = function(event) {
    const isJson = /^[\],:{}\s]*$/.test(event.data.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(:?[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));

    if (isJson) {
        try {
            const data = JSON.parse(event.data);

            if (data.command === 'init') {
                // Ініціалізація плейсхолдерів
                Object.keys(data.scriptUrls).forEach(scriptName => {
                    const urlInput = document.querySelector(`#url-${scriptName}`);

                    if (urlInput) {
                        urlInput.value = data.scriptUrls[scriptName];

                    }
                });
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    } else {
        // Обробка статусних повідомлень
        const statusElements = document.querySelectorAll('.status');
        statusElements.forEach(statusEl => {
            if (event.data.includes(statusEl.parentElement.getAttribute('data-script'))) {
                statusEl.textContent = `Status: ${event.data}`;
            }
        });
    }
};


document.querySelectorAll('.script-group').forEach(group => {
    const scriptName = group.getAttribute('data-script');
    const urlInput = document.querySelector(`#url-${scriptName}`);
    const startBtn = document.getElementById(`start-${scriptName}`);
    const stopBtn = document.getElementById(`stop-${scriptName}`);

    startBtn.addEventListener('click', () => {
        const url = urlInput.value;
        const parameters = [...scriptParameters[scriptName]]; // Тут вам потрібно визначити повний набір параметрів для кожного скрипта
        const urlIndex = parameters.indexOf('URL_PLACEHOLDER');
        if (urlIndex !== -1) {
            parameters[urlIndex] = url; // Заміна заглушки на фактичний URL
        }
        socket.send(JSON.stringify({ command: 'start', scriptName, parameters, url  }));
    });

    stopBtn.addEventListener('click', () => {
        socket.send(JSON.stringify({ command: 'stop', scriptName }));
    });
});
