from typing import List, Optional
from pydantic import BaseModel


class TagDTO(BaseModel):
    type: str


class AllergenDTO(BaseModel):
    type: str

class FoodDTO(BaseModel):
    foodId: Optional[int] = None
    name: Optional[str] = None
    tags: List[str | TagDTO] = []
    allergens: List[str | AllergenDTO] = []

class RestaurantDTO(BaseModel):
    restaurantId: int
    name: Optional[str] = None
    foods: List[FoodDTO] = []

class UserDTO(BaseModel):
    userId: int
    preferredTags: List[str | TagDTO] = []
    allergens: List[str | AllergenDTO] = []

class RecommendationRequestDTO(BaseModel):
    restaurants: List[RestaurantDTO]
    user: UserDTO
    k: int = 10
    limit: int = 5

class RecommendationResultDTO(BaseModel):
    restaurantId: int
    score: float
    safeFoodCount: int
    totalFoodCount: int

class RecommendationResponseDTO(BaseModel):
    results: List[RecommendationResultDTO]