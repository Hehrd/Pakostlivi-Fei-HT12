from fastapi import APIRouter
from Backend.src.main.python.controller.dto.data_dto import RecommendationRequestDTO, RecommendationResponseDTO
from Backend.src.main.python.service.recommend_service import RecommendationService

faiss_router = APIRouter()
recommendation_service = RecommendationService()


@faiss_router.post("/recommend", response_model=RecommendationResponseDTO)
def recommend(data: RecommendationRequestDTO):
    restaurant_ids = recommendation_service.recommend(
        customer_id=data.customerId,
        restaurant_ids=data.restaurantIds,
        k=data.k,
        limit=data.limit
    )
    return RecommendationResponseDTO(restaurantIds=restaurant_ids)
