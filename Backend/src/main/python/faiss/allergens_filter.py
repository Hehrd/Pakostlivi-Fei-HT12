def extract_user_allergens(user: dict) -> set[str]:
    allergens = set()

    for allergen in user.get("allergens", []):
        if isinstance(allergen, dict):
            allergen_value = allergen.get("type")
        else:
            allergen_value = allergen

        if not isinstance(allergen_value, str):
            continue

        allergens.add(allergen_value.strip().upper())

    return allergens


def extract_food_allergens(food: dict) -> set[str]:
    allergens = set()

    for allergen in food.get("allergens", []):
        if isinstance(allergen, dict):
            allergen_value = allergen.get("type")
        else:
            allergen_value = allergen

        if not isinstance(allergen_value, str):
            continue

        allergens.add(allergen_value.strip().upper())

    return allergens


def food_is_safe_for_user(food: dict, user_allergens: set[str]) -> bool:
    food_allergens = extract_food_allergens(food)
    return len(food_allergens.intersection(user_allergens)) == 0


def restaurant_has_safe_foods(restaurant: dict, user_allergens: set[str]) -> bool:
    foods = restaurant.get("foods", [])
    if not isinstance(foods, list) or not foods:
        return False

    for food in foods:
        if not isinstance(food, dict):
            continue

        if food_is_safe_for_user(food, user_allergens):
            return True

    return False