import os
import requests
import config


#Run to test recording2.wav on server 

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
audio_path = os.path.join(BASE_DIR, "..", "audio", "recording2.wav")
audio_path = os.path.abspath(audio_path)
GPU_IP = config.GPU_IP

print("Using file:", audio_path)

with open(audio_path, "rb") as f:
    response = requests.post(
        f"http://{GPU_IP}:8000/transcribe",
        files={"file": f}
    )

print(response.json())
url = f"http://{GPU_IP}:8000/transcribe"
print("Sending to:", url)
