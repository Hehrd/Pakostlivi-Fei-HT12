import { apiFetch } from "@/lib/api";

export async function fetchAdminRestaurants() {
  return apiFetch("/admin/restaurants");
}

export async function createRestaurant(body) {
  return apiFetch("/admin/restaurants", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateRestaurant(restaurantId, body) {
  return apiFetch(`/admin/restaurants/${restaurantId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteRestaurant(restaurantId) {
  return apiFetch(`/admin/restaurants/${restaurantId}`, {
    method: "DELETE",
  });
}
