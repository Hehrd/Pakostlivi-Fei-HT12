from Backend.src.main.python.faiss.convert_to_vector import build_restaurant_matrix, user_to_vector
from Backend.src.main.python.faiss.faiss_response import build_faiss_index, search_top_restaurants, count_safe_foods
from Backend.src.main.python.faiss.allergens_filter import extract_user_allergens


class RecommendationService:
    def recommend(self, restaurants: list[dict], user: dict, k: int = 10, limit: int = 5) -> list[dict]:
        restaurants_by_id = self._build_restaurant_mapping(restaurants)

        restaurant_matrix, restaurant_ids = build_restaurant_matrix(restaurants)
        index = build_faiss_index(restaurant_matrix)
        user_vector = user_to_vector(user)

        faiss_results = search_top_restaurants(
            index=index,
            user_vector=user_vector,
            restaurant_ids=restaurant_ids,
            k=k
        )

        return self._filter_restaurants_by_allergens(
            faiss_results=faiss_results,
            restaurants_by_id=restaurants_by_id,
            user=user,
            limit=limit
        )

    def _build_restaurant_mapping(self, restaurants: list[dict]) -> dict[int, dict]:
        return {
            restaurant["restaurantId"]: restaurant
            for restaurant in restaurants
            if restaurant.get("restaurantId") is not None
        }

    def _filter_restaurants_by_allergens(
        self,
        faiss_results: list[dict],
        restaurants_by_id: dict[int, dict],
        user: dict,
        limit: int
    ) -> list[dict]:
        user_allergens = extract_user_allergens(user)

        if not user_allergens:
            return [
                {
                    "restaurantId": result["restaurantId"],
                    "score": float(result["score"]),
                    "safeFoodCount": 0,
                    "totalFoodCount": len(restaurants_by_id.get(result["restaurantId"], {}).get("foods", []))
                }
                for result in faiss_results[:limit]
            ]

        filtered_results = []

        for result in faiss_results:
            restaurant_id = result.get("restaurantId")
            restaurant = restaurants_by_id.get(restaurant_id)

            if restaurant is None:
                continue

            safe_count, total_count = count_safe_foods(restaurant, user_allergens)

            if safe_count > 0:
                filtered_results.append({
                    "restaurantId": restaurant_id,
                    "score": float(result["score"]),
                    "safeFoodCount": safe_count,
                    "totalFoodCount": total_count
                })

            if len(filtered_results) >= limit:
                break

        return filtered_results