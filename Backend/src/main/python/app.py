from fastapi import FastAPI
from Backend.src.main.python.controller.get_data_controller import faiss_router
from Backend.src.main.python.controller.tag_controller import tag_router

app = FastAPI()

app.include_router(faiss_router)
app.include_router(tag_router)