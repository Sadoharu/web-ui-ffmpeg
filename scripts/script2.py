import subprocess
import re
import time
import logging
import multiprocessing
from multiprocessing import Process
import signal
import sys

# Налаштування логгера
logging.basicConfig(filename='log.txt', level=logging.INFO,
                    format='%(asctime)s:%(levelname)s:%(message)s')

def run_ffmpeg(stop_event, heartbeat_file):
    ffmpeg_command = [
        'ffmpeg', '-i', 'srt://10.2.0.38:6000/?mode=caller&transtype=live&streamid=099903b9-b9d1-4427-ae83-db93443ed0fd',
        '-c:v', 'copy', '-c:a', 'copy', '-f', 'mpegts', 'srt://localhost:5001'
    ]

    process = subprocess.Popen(ffmpeg_command, stderr=subprocess.PIPE, universal_newlines=True)
    while not stop_event.is_set():
        line = process.stderr.readline()
        if line:
            print(line, end='')
            if re.search('Decklink input buffer overrun', line):
                logging.error('Decklink input buffer overrun detected.')
                break
            # Оновлення heartbeat файлу
            with open(heartbeat_file, "w") as file:
                file.write(f"Heartbeat: {time.time()}")

    process.terminate()
    process.wait()
    logging.info("ffmpeg process terminated")

def main():
    stop_event = multiprocessing.Event()
    heartbeat_file = "heartbeat_script2.txt"  # Унікальна назва для кожного скрипта
    process = Process(target=run_ffmpeg, args=(stop_event, heartbeat_file))
    process.start()

    def signal_handler(sig, frame):
        logging.info("Termination signal received")
        print("Termination signal received")
        stop_event.set()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        process.join()
    except KeyboardInterrupt:
        stop_event.set()
        process.join()

if __name__ == '__main__':
    main()
