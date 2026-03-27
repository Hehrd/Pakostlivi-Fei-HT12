from pydantic import BaseModel
from typing import List

class TagRequestDto(BaseModel):
    name: str
    description: str

class TagResponseDto(BaseModel):
    tags: List[str]