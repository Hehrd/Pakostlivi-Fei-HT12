from fastapi import APIRouter
from Backend.src.main.python.controller.dto.tag_dto import TagRequestDto, TagResponseDto, PreMadeTags
from Backend.src.main.python.helper_files.tags_util import ALLOWED_TAGS
from Backend.src.main.python.service.tag_service import generate_tags

tag_router = APIRouter(prefix="/tag")

@tag_router.post("/generate", response_model=TagResponseDto)
def generate_tags_endpoint(request: TagRequestDto):
    tags = generate_tags(request.name, request.description)
    return TagResponseDto(tags=tags)

@tag_router.get("/types")
def get_food_tag_types():
    return {"tags": sorted(ALLOWED_TAGS)}

@tag_router.post("/premade")
def receive_premade_tags(data: PreMadeTags):
    return {"received": data.tags}
