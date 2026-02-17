from fastapi import FastAPI, UploadFile, File
from app.database import create_tables
import shutil
import os
from app.analyzer import analyze_video
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

    # Persist detections to DB so the /search endpoint can return results
    if analysis:
        try:
            save_detections(analysis)
        except Exception as e:
            # Log but do not fail the upload response
            print(f"Failed to save detections: {e}")

    return {
        "filename": file.filename,
        "saved": len(analysis) if analysis else 0,
        "analysis": analysis
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

