import socket
import struct
import numpy as np
import torch
import json
import os
import time 
from datetime import datetime
from scipy.spatial import cKDTree

def locate_rockfall(live_points, baseline_points, height_threshold=0.5):
    tree = cKDTree(baseline_points[:, [0, 2]]) 
    distances, indices = tree.query(live_points[:, [0, 2]])
    height_difference = live_points[:, 1] - baseline_points[indices, 1]
    
    rock_indices = np.where(height_difference > height_threshold)[0]
    
    if len(rock_indices) > 0:
        rock_points = live_points[rock_indices]
        
        center_x = np.mean(rock_points[:, 0])
        center_z = np.mean(rock_points[:, 2])
        width = np.max(rock_points[:, 0]) - np.min(rock_points[:, 0])
        length = np.max(rock_points[:, 2]) - np.min(rock_points[:, 2])
        
        return center_x, center_z, width, length, len(rock_points)
    return None, None, 0, 0, 0


def log_hazard_to_json(hazard_data, filepath="hazard_log.json"):
    logs = []
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as file:
                logs = json.load(file)
        except json.JSONDecodeError:
            pass 
            
    logs.append(hazard_data)
    
    with open(filepath, "w") as file:
        json.dump(logs, file, indent=4)


print("Initializing Live Monitoring System...")

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model_path = './saved_models/rockfall_pointnet_unity.pt' 
eval_model = torch.jit.load(model_path, map_location=device)
eval_model.eval()
print(f"TorchScript Model loaded successfully on {device}.")

UDP_IP = "127.0.0.1"
UDP_PORT = 5005
BUFFER_SIZE = 49152 
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

print(f"System active. Listening for UDP stream on Port {UDP_PORT}...\n")

baseline_safe_mine = None
last_predict_time = 0.0  

try:
    while True:
        data, addr = sock.recvfrom(BUFFER_SIZE)

        floats = struct.unpack(f'{len(data)//4}f', data)
        raw_points = np.array(floats, dtype=np.float32).reshape(-1, 3)

        if baseline_safe_mine is None:
            baseline_safe_mine = raw_points
            print("Baseline captured. Topography logged. Scanning for spatial anomalies...\n")
            continue
            
        current_time = time.time()
        if current_time - last_predict_time < 1.0:
            continue  
            
        last_predict_time = current_time
        
        ai_points = raw_points.copy()
        
        # Center and normalize points
        centroid = np.mean(ai_points, axis=0)
        ai_points = ai_points - centroid
        m = np.max(np.sqrt(np.sum(ai_points**2, axis=1)))
        if m > 0: 
            ai_points = ai_points / m

        input_tensor = torch.tensor(ai_points.T, dtype=torch.float32).unsqueeze(0).to(device)

        with torch.no_grad():
            output = eval_model(input_tensor)
            probabilities = torch.exp(output).squeeze()
            hazard_prob = probabilities[1].item() * 100 
            safe_prob = probabilities[0].item() * 100

        #Inference Logic
        if hazard_prob > 50.0:
            cx, cz, width, length, point_count = locate_rockfall(raw_points, baseline_safe_mine)
            
            event_data = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "status": "HAZARD",
                "confidence": round(float(hazard_prob), 2),
                "location_x": round(float(cx), 2) if cx is not None else None,
                "location_z": round(float(cz), 2) if cz is not None else None,
                "est_width": round(float(width), 2) if width is not None else 0.0,
                "est_length": round(float(length), 2) if length is not None else 0.0,
                "lidar_hits": int(point_count) if point_count is not None else 0
            }
            
            log_hazard_to_json(event_data)
            
            print("\n" + "-"*50)
            print(f"HAZARD DETECTED | Confidence: {hazard_prob:.2f}%")
            if cx is not None:
                print(f"Location: X: {cx:.2f}, Z: {cz:.2f} | Est. Size: {width:.2f}m x {length:.2f}m")
            else:
                print("Note: AI classification triggered, but localizer coordinates are unavailable.")
            print("Event logged to hazard_log.json")
            print("-"*50 + "\n")
                
        elif safe_prob > 50.0:
            print(f"\rStatus: SAFE (Confidence: {safe_prob:.2f}%) | System monitoring...      ", end="")

except KeyboardInterrupt:
    print("\nProcess interrupted. Closing UDP socket and shutting down.")
    sock.close()