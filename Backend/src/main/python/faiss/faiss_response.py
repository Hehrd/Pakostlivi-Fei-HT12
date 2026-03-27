import faiss
import numpy as np

from Backend.src.main.python.faiss.allergens_filter import food_is_safe_for_user


def build_faiss_index(restaurant_matrix: np.ndarray):
    if restaurant_matrix.size == 0:
        return None

    dimension = restaurant_matrix.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(restaurant_matrix)
    return index

def search_top_restaurants(index, user_vector: np.ndarray, restaurant_ids: list[int], k: int = 5):
    if index is None or not restaurant_ids:
        return []

    k = min(k, len(restaurant_ids))

    if user_vector.ndim == 1:
        user_vector = user_vector.reshape(1, -1).astype(np.float32)

    distances, indices = index.search(user_vector, k)

    results = []
    for score, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue

        results.append({
            "restaurantId": restaurant_ids[idx],
            "score": float(score)
        })

    return results

def count_safe_foods(restaurant: dict, user_allergens: set[str]) -> tuple[int, int]:
    foods = restaurant.get("foods", [])
    safe_count = 0
    total_count = 0

    for food in foods:
        if not isinstance(food, dict):
            continue

        total_count += 1

        if food_is_safe_for_user(food, user_allergens):
            safe_count += 1

    return safe_count, total_count