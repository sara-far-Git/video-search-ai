import cv2
from ultralytics import YOLO

# טעינת מודל (פעם אחת בלבד)
model = YOLO("yolov8n.pt")


def analyze_video(video_path):
    cap = cv2.VideoCapture(video_path)

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_number = 0

    detections = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # נבדוק כל 2 שניות (כדי לא להעמיס)
        if frame_number % int(fps * 2) == 0:

            results = model(frame)

            for box in results[0].boxes.cls:
                label = model.names[int(box)]
                timestamp = frame_number / fps

                detections.append({
                    "object": label,
                    "time": round(timestamp, 2)
                })

        frame_number += 1

    cap.release()

    return detections
