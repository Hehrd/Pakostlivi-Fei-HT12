from fastapi import APIRouter
from Backend.src.main.python.controller.dto.tag_dto import TagRequestDto, TagResponseDto
from Backend.src.main.python.service.tag_service import generate_tags

tag_router = APIRouter()

@tag_router.post("/tags", response_model=TagResponseDto)
def generate_tags_endpoint(request: TagRequestDto):
    tags = generate_tags(request.name, request.description)
    return TagResponseDto(tags=tags)