import json
import os

import redis

from Backend.src.main.python.faiss.convert_to_vector import build_restaurant_matrix, user_to_vector
from Backend.src.main.python.faiss.faiss_response import build_faiss_index, search_top_restaurants, count_safe_foods
from Backend.src.main.python.faiss.allergens_filter import extract_user_allergens


class RecommendationService:
    def __init__(self):
        self._restaurant_key_prefix = os.getenv("RESTAURANT_EMBEDDING_KEY_PREFIX", "restaurant:embedding:")
        self._profile_key_prefixes = [
            os.getenv("CUSTOMER_PROFILE_KEY_PREFIX", "customer:profile:"),
            os.getenv("PROFILE_KEY_PREFIX", "profile:")
        ]
        self._redis = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            decode_responses=True,
        )

    def recommend(self, customer_id: int, restaurant_ids: list[int], k: int = 10, limit: int = 5) -> list[int]:
        restaurants = self._load_restaurants(restaurant_ids)
        user = self._load_user(customer_id)
        if not restaurants:
            return []

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

    def _load_restaurants(self, restaurant_ids: list[int]) -> list[dict]:
        restaurants: list[dict] = []
        for restaurant_id in restaurant_ids:
            payload = self._redis.get(f"{self._restaurant_key_prefix}{restaurant_id}")
            if payload:
                restaurants.append(json.loads(payload))
        return restaurants

    def _load_user(self, customer_id: int) -> dict:
        for prefix in self._profile_key_prefixes:
            payload = self._redis.get(f"{prefix}{customer_id}")
            if payload:
                return json.loads(payload)
        raise ValueError(f"Customer profile not found in Redis for customerId={customer_id}")

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
    ) -> list[int]:
        user_allergens = extract_user_allergens(user)

        if not user_allergens:
            return [
                result["restaurantId"]
                for result in faiss_results[:limit]
                if restaurants_by_id.get(result["restaurantId"]) is not None
            ]

        filtered_results: list[int] = []

        for result in faiss_results:
            restaurant_id = result.get("restaurantId")
            restaurant = restaurants_by_id.get(restaurant_id)

            if restaurant is None:
                continue

            safe_count, total_count = count_safe_foods(restaurant, user_allergens)

            if safe_count > 0:
                filtered_results.append(restaurant_id)

            if len(filtered_results) >= limit:
                break

        return filtered_results
