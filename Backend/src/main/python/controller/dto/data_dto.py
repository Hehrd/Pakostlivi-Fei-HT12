from typing import List
from pydantic import BaseModel

class RecommendationRequestDTO(BaseModel):
    customerId: int
    restaurantIds: List[int]
    k: int = 10
    limit: int = 5

class RecommendationResponseDTO(BaseModel):
    restaurantIds: List[int]
