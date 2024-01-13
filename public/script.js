//public/script.js
const socket = new WebSocket('ws://localhost:8079');

const scriptParameters = {
    script1: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script2: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script3: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script4: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script5: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script6: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script7: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER'],
    script8: ['-i', 'srt://185.235.218.141:6000/?mode=caller&transtype=live&streamid=3c4024f3-b68b-4e12-8be7-bada96dc193f,mode:request', '-c', 'copy', '-f', 'mpegts', 'URL_PLACEHOLDER']
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
