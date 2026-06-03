from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import uvicorn

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/hazards")
def get_live_hazards():
    file_path = "hazard_log.json"
    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as file:
                return json.load(file)
        except json.JSONDecodeError:
            
            return [{"status": "Syncing..."}]
            

    return []

if __name__ == "__main__":
    print("Starting Live API Server...")
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)