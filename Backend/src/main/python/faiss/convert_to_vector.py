import numpy as np

FOOD_TAGS = [
    "CHICKEN",
    "PIZZA",
    "BBQ",
    "PASTA",
    "TOMATOES",
    "PORK",
    "KEBAB",
    "STEW",
    "MUSHROOM",
    "CUCUMBER"
]

tag_to_index = {tag: i for i, tag in enumerate(FOOD_TAGS)}


def restaurant_to_vector(restaurant: dict) -> np.ndarray:
    vector = np.zeros(len(FOOD_TAGS), dtype=np.float32)

    for food in restaurant.get("foods", []):
        for tag in food.get("tags", []):

            if isinstance(tag, dict):
                tag_value = tag.get("type")
            else:
                tag_value = tag

            if not isinstance(tag_value, str):
                continue

            tag_value = tag_value.strip().upper()

            idx = tag_to_index.get(tag_value)
            if idx is not None:
                vector[idx] += 1.0

    # normalize
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector

def build_restaurant_matrix(restaurants: list[dict]) -> tuple[np.ndarray, list[int]]:
    vectors = []
    restaurant_ids = []

    for restaurant in restaurants:
        restaurant_id = restaurant.get("restaurantId")
        if restaurant_id is None:
            continue

        vector = restaurant_to_vector(restaurant)
        vectors.append(vector)
        restaurant_ids.append(restaurant_id)

    if not vectors:
        return np.empty((0, len(FOOD_TAGS)), dtype=np.float32), []

    matrix = np.vstack(vectors).astype(np.float32)
    return matrix, restaurant_ids

def user_to_vector(user: dict) -> np.ndarray:
    vector = np.zeros(len(FOOD_TAGS), dtype=np.float32)

    for tag in user.get("preferredTags", []):

        if isinstance(tag, dict):
            tag_value = tag.get("type")
        else:
            tag_value = tag

        if not isinstance(tag_value, str):
            continue

        tag_value = tag_value.strip().upper()

        idx = tag_to_index.get(tag_value)
        if idx is not None:
            vector[idx] = 1.0

    # normalize
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector