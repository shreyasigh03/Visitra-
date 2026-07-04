
from fastapi import FastAPI
from pydantic import BaseModel , Field, ConfigDict
from insightface.app import FaceAnalysis
from anti_spoof import check_liveness
import cv2
import numpy as np

#server bna hai
app = FastAPI()







face_app = FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=-1)   # CPU

class ImageData(BaseModel):
    image_path: str


@app.post("/generate-embedding")
def generate_embedding(data: ImageData):

    image = cv2.imread(data.image_path)

    if image is None:
        return {
            "success": False,
            "message": "Image not found"
        }
    
    # ---------- Anti Spoof Check ----------
    is_real = check_liveness(image)

    if not is_real:
       return {
           "success": False,
            "message": "Fake face detected. Please use a live face."
    }

    faces = face_app.get(image)

    if len(faces) == 0:
        return {
            "success": False,
            "message": "No face detected in the uploaded image. Please upload and register an image with a clearly visible face."
        }

    embedding = faces[0].embedding.tolist()

    return {
        "success": True,
        "embedding": embedding
    }    





class VisitorEmbedding(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(alias="_id")
    faceEncoding: list[float]


class CompareAllRequest(BaseModel):
    liveEmbedding: list[float]
    visitors: list[VisitorEmbedding]

@app.post("/compare-embeding")  
def compare_embeding(data: CompareAllRequest):
    live=np.array(data.liveEmbedding)  
    live = live / np.linalg.norm(live)  
    best_distance = -1.0
    best_id=None
    threshold=0.65
    for visitor in data.visitors:
        db= np.array(visitor.faceEncoding)
        db = db / np.linalg.norm(db) 
       #dono array ke bech ka distance mtlb diff find krke dega
        distance = float(np.dot(live, db))
        
        print("Visitor:", visitor.id)
        print("Distance:", distance)
        print(len(live))
        print(len(db))

        if(distance>best_distance):
            best_distance=distance
            best_id=visitor.id

        print(best_distance);    

    if best_id is not None and best_distance >= threshold:
        similarity = round(  best_distance * 100 , 2 )
        return {
            #return ke andr json format m hta h data
            "success": True,
            "visitor_id": best_id,
            "similarity": similarity
        }

    return{
        "success":False
    }        
    
        

#ye api ka format hai-jb bhi browser mai y url open hga toh iske neche wala func chlega
@app.get("/")
def home():
    return {"message": "AI Service Running"}


