from fastapi import APIRouter
from Backend.src.main.python.controller.dto.DataDTO import RecommendationRequestDTO, RecommendationResponseDTO, \
                                                           RecommendationResultDTO
from Backend.src.main.python.service.recommend_service import RecommendationService

router = APIRouter()
recommendation_service = RecommendationService()


@router.post("/recommend", response_model=RecommendationResponseDTO)
def recommend(data: RecommendationRequestDTO):
    restaurants = [restaurant.model_dump() for restaurant in data.restaurants]
    user = data.user.model_dump()

    results = recommendation_service.recommend(
        restaurants=restaurants,
        user=user,
        k=data.k,
        limit=data.limit
    )

    dto_results = [
        RecommendationResultDTO(**result)
        for result in results
    ]

    return RecommendationResponseDTO(results=dto_results)