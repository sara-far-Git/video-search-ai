from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from app.database import create_tables
import shutil
import os
from app.analyzer import analyze_video
from fastapi.staticfiles import StaticFiles
from app.database import save_detections, search_object
from fastapi.middleware.cors import CORSMiddleware
try:
    from app.translator import translate_to_english
except Exception:
    # Fallback: if translator dependency is missing, just use lowercase input
    def translate_to_english(text: str):
        return text.lower()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # לפיתוח בלבד
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/videos", StaticFiles(directory="uploads"), name="videos")

create_tables()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def root():
    return {"message": "Video Search API is running"}


@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):

    print("UPLOAD ENDPOINT HIT")  # ← לבדיקה

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Schedule analysis in the background to avoid blocking the request
    def process_video(path: str):
        try:
            analysis = analyze_video(path)
            if analysis:
                save_detections(analysis)
        except Exception as e:
            print(f"Background analyze/save failed: {e}")

    if background_tasks is not None:
        background_tasks.add_task(process_video, file_path)
    else:
        # Fallback if BackgroundTasks not provided
        process_video(file_path)

    return {
        "filename": file.filename,
        "processing": True
    }
@app.get("/search")
def search(object: str):

    translated = translate_to_english(object)

    results = search_object(translated)

    return {
        "query": object,
        "translated": translated,
        "results": results
    }

