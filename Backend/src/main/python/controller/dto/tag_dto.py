from pydantic import BaseModel
from typing import List

class PreMadeTags(BaseModel):
    tags: List[str]

class TagRequestDto(BaseModel):
    name: str
    description: str

class TagResponseDto(BaseModel):
    tags: List[str]