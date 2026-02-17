from fastapi import FastAPI, UploadFile, File
from app.database import create_tables
import shutil
import os
from app.analyzer import analyze_video
from app.database import save_detections

app = FastAPI()
create_tables()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def root():
    return {"message": "Video Search API is running"}


@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):

    print("UPLOAD ENDPOINT HIT")  # ← לבדיקה

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis = analyze_video(file_path)

    return {
        "filename": file.filename,
        "analysis": analysis
    }
