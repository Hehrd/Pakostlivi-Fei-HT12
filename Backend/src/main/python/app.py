from fastapi import FastAPI
from Backend.src.main.python.controller.get_data_controller import router as faiss_router

app = FastAPI()
app.include_router(faiss_router)