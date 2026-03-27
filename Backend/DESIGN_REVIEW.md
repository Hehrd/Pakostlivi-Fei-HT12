# Restaurant Sync Design Review

## Current State

This repository contains both:

- a Spring Boot backend that owns restaurant and food persistence in PostgreSQL
- a FastAPI service that performs recommendation scoring with FAISS

The current integration is request-driven rather than service-driven:

- FastAPI `/recommend` expects the caller to send the full restaurant dataset in the request body
- FastAPI rebuilds the FAISS index on each request
- Spring Boot does not expose an embedding-ready restaurant payload
- Redis is not integrated yet

There is also an AI-tagging flow already emerging in the Python service:

- FastAPI has endpoints for generating tags and receiving premade tags
- Spring Boot food creation currently expects `foodTagIds` directly from the request
- there is no implemented path yet where Spring Boot generates tags from FastAPI before persisting a new food

## Main Problems

### 1. FastAPI is stateless in the wrong place

Today FastAPI does not own a synchronized recommendation dataset. It depends on another caller to send all restaurants every time. This does not scale once the restaurant table becomes large.

### 2. DTO mismatch between Spring Boot and FastAPI

The Python vectorization flow expects restaurant payloads shaped roughly like:

```json
{
  "restaurantId": 1,
  "name": "Example",
  "foods": [
    {
      "foodId": 10,
      "name": "Pizza",
      "tags": ["PIZZA", "TOMATOES"],
      "allergens": ["GLUTEN"]
    }
  ]
}
```

Current Spring Boot response DTOs do not provide that shape:

- restaurant responses expose restaurant metadata only
- food responses expose allergen IDs and tag IDs rather than names/types

That means FastAPI cannot directly consume Spring Boot output for vector indexing.

### 3. Food tag generation lifecycle is not modeled yet

Your intended flow is:

1. Spring Boot learns the valid `FoodTagType` values from FastAPI at application startup.
2. When a create-food request arrives with name and description, Spring Boot sends that payload to FastAPI.
3. FastAPI generates tags.
4. Spring Boot persists those tags in PostgreSQL.
5. Those saved tags later become part of the restaurant payload written to Redis for recommendation indexing.

That is a valid direction, but it means tag generation is part of the Spring Boot write path and must be handled explicitly for:

- startup initialization
- request latency
- FastAPI failure
- retries and fallback behavior

### 4. FAISS is rebuilt per request

Rebuilding the index for every recommendation request is acceptable for a toy dataset, but not for a growing production dataset. Index construction should move to a Redis-backed loading flow instead of request-time rebuilding.

### 5. Redis is not yet given a precise responsibility

Redis should not replace PostgreSQL. It should serve one or both of these roles:

- cache of embedding-ready restaurant payloads
- cached reference data such as available tag types if you want Spring Boot to avoid re-fetching them

## Recommended Architecture

Use this flow:

`PostgreSQL -> Spring Boot <-> Redis <-> FastAPI -> FAISS`

### Responsibilities

- PostgreSQL: source of truth
- Spring Boot: write owner and canonical business API
- Redis: the shared data store accessed directly by both Spring Boot and FastAPI as Redis clients
- FastAPI: reads synchronized restaurant data from Redis and updates or rebuilds FAISS synchronously
- FAISS: recommendation index only

Redis is not being introduced only as an optimization cache. In this design it becomes the shared data layer between Spring Boot and FastAPI. Spring Boot writes and refreshes recommendation-ready data there, and FastAPI reads it directly through its own Redis client.

## Recommended Data Flow

### Food tag bootstrap flow

At application startup:

1. Spring Boot requests the available food tag values from FastAPI.
2. Spring Boot stores the resolved tag metadata locally in memory and optionally in Redis.
3. Spring Boot ensures corresponding `FoodTagEntity` rows exist in PostgreSQL.

This startup sync should initialize the set of known tags once so later food creation can persist generated tags without ambiguity.

### Food creation flow with AI tags

1. Frontend calls Spring Boot create-food endpoint with restaurant, name, description, and allergen data.
2. Spring Boot validates authorization and restaurant ownership.
3. Spring Boot sends `name` and `description` to FastAPI tag generation.
4. FastAPI returns generated tag values.
5. Spring Boot resolves those tag values to `FoodTagEntity` records in PostgreSQL.
6. Spring Boot saves the `FoodEntity` with the generated tags.
7. Spring Boot refreshes the restaurant embedding payload in Redis.

In this model, the frontend should not be responsible for providing final food tag IDs.

### Normal update flow

1. A restaurant or food change is written through Spring Boot.
2. Spring Boot saves the change to PostgreSQL.
3. After successful commit, Spring Boot builds an embedding-ready restaurant payload.
4. Spring Boot writes that payload to Redis under a per-restaurant key.
5. FastAPI reads the restaurant payload from Redis synchronously through its Redis client when it needs to refresh or build FAISS data.
6. FastAPI rebuilds the relevant restaurant vector or rebuilds the index from Redis data when needed.

This is the preferred steady-state path. The extra network hop to FastAPI is acceptable because the large shared dataset should be centralized in Redis rather than passed around or repeatedly reconstructed.

### Delete flow

1. Spring Boot deletes the restaurant or food data in PostgreSQL.
2. Spring Boot removes or refreshes the Redis payload.
3. FastAPI reads current Redis state through Redis and removes or refreshes the restaurant entry in FAISS when needed.

### Bootstrap flow

You still need a one-time or repair sync path:

1. Spring Boot exports all embedding-ready restaurant payloads into Redis.
2. FastAPI loads restaurant payloads from Redis in batches or scans keys.
3. FastAPI builds the initial FAISS index once.

An internal Spring Boot batch endpoint may still be useful as a recovery tool, but the intended operational source for FastAPI is Redis.

## Redis Design

### Cache keys

- `restaurant:embedding:{restaurantId}`

Value:

- JSON payload containing restaurant fields needed by FastAPI only

No Redis Streams are needed in this synchronous design.

Redis is used only to store recommendation-ready restaurant data and low-churn reference data that both services can access directly.

## Proposed Redis Role

Redis should hold the recommendation-facing dataset that FastAPI needs, not raw JPA entities and not arbitrary cache fragments.

Spring Boot should be responsible for maintaining Redis contents whenever restaurant-related data changes. FastAPI should treat Redis as its primary access point for synchronized restaurant recommendation data through a direct Redis client.

That gives you:

- one maintained representation of the large dataset
- no need to send the whole restaurant table over HTTP on recommendation requests
- simpler horizontal scaling for FastAPI instances
- less repeated database pressure on PostgreSQL
- a clearer contract between the write side and the recommendation side

Redis can also hold low-churn support data, such as the list of known food tag types, but that is secondary. The primary Redis role is synchronized recommendation payload storage.

## Food Tag Design

## Source of truth

You should keep a clear split:

- FastAPI owns tag generation logic
- Spring Boot owns persistence of generated tags and food-tag relationships
- PostgreSQL remains the source of truth for saved food tags on foods

FastAPI should not become the canonical owner of which tags a specific food has after save. It may generate suggestions, but Spring Boot should persist the result.

## Recommended persistence model

When `createFood` is called, do not rely on `request.getFoodTagIds()` as the main path anymore. Your current method:

```java
public FoodResponseDto createFood(CreateFoodRequestDto request, Authentication authentication) {
   AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
   if (!authenticatedUser.role().equals(AccountRole.RESTAURANT) && !authenticatedUser.role().equals(AccountRole.ADMIN)) {
       throw new AccessDeniedException("You are not allowed to access this resource");
   }
    RestaurantEntity restaurant = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + request.getRestaurantId()));
    assertRestaurantAccess(restaurant, authenticatedUser);
    FoodEntity food = new FoodEntity();
    food.setRestaurant(restaurant);
    food.setName(request.getName());
    food.setDescription(request.getDescription());
    food.setAllergens(resolveAllergens(request.getAllergenIds()));
    food.setFoodTags(resolveFoodTags(request.getFoodTagIds()));
    return toResponseDto(foodRepository.save(food));
}
```

is structurally the right write location, but the tag resolution step should change from:

- `resolveFoodTags(request.getFoodTagIds())`

to something closer to:

- call FastAPI tag-generation endpoint
- map returned tag names to `FoodTagEntity`
- save the food with those entities
- refresh Redis for the affected restaurant

That keeps tag generation inside the Spring Boot-controlled transaction flow.

## Failure policy

You need to decide one of these policies:

1. Strict policy:
   if FastAPI tag generation fails, food creation fails.
2. Soft policy:
   food is created without tags and a retry job fills tags later.

For recommendation quality, strict is simpler at first. For resilience, soft is better but requires a pending-tag state and retry mechanism.

## Changes Needed In This Repository

## Spring Boot

### Add Redis integration

Add dependencies and configuration for:

- Redis connection
- serialization for embedding payloads

### Add an embedding payload DTO

Create a dedicated DTO for recommendation indexing. Do not reuse the public restaurant response DTO.

Suggested shape:

- `RestaurantEmbeddingDto`
- `FoodEmbeddingDto`

Include:

- restaurant id
- restaurant name
- food id
- food name
- food tags as strings
- food allergens as strings

### Add a projection builder service

Create a Spring service responsible for:

- loading a restaurant with foods, food tags, and allergens
- converting it to the embedding DTO

This avoids spreading Redis-specific mapping logic across controllers and CRUD services.

### Publish cache refreshes after writes

Restaurant and food mutations should trigger synchronization logic after successful persistence.

Mutation points currently live in:

- `RestaurantService`
- `FoodService`

Those methods should eventually call a dedicated sync service rather than manually writing to Redis.

### Add Redis storage services

Create Spring services responsible for:

- building embedding payloads
- writing embedding payloads into Redis
- refreshing restaurant payloads when foods under a restaurant change

Spring Boot is the writer for recommendation payloads in Redis.

### Add tag-generation integration service

Create a Spring service responsible for:

- requesting generated tags from FastAPI for a food name and description
- loading cached tag metadata
- resolving returned tag names to `FoodTagEntity`
- initializing tag metadata at startup

### Optional internal recovery endpoint

An internal batch endpoint can still be added as a fallback or debugging tool, but it is no longer the preferred main integration path.

## FastAPI

### Stop requiring full restaurant payloads on `/recommend`

The recommendation endpoint should eventually accept user preference data only, or only the minimal request data needed for ranking.

### Add a Redis-backed loading component

FastAPI needs an internal Redis access layer that:

- fetches per-restaurant payloads from Redis
- updates in-memory structures and FAISS synchronously when invoked

FastAPI is a direct Redis client in this design. It should not depend on Spring Boot HTTP endpoints for recommendation data access during normal operation.

### Keep tag-generation endpoints separate from recommendation sync

FastAPI has two different responsibilities:

- generate tags for food creation
- consume synchronized restaurant payloads for FAISS indexing

These flows should share DTO discipline but not be conflated.

### Keep a local mapping next to FAISS

FAISS alone is not enough. FastAPI should also keep:

- restaurant ID to vector row mapping
- restaurant payload mapping for allergen-safe food counting

### Add startup reindex support

On startup, FastAPI should be able to:

- rebuild the full index from Redis payloads
- then continue serving from the Redis-backed dataset

## Proposed Implementation Order

1. Define the embedding DTO contract between Spring Boot and FastAPI.
2. Define the food-tag generation contract between Spring Boot and FastAPI.
3. Add Redis integration to Spring Boot.
4. Add startup synchronization for known food tag types.
5. Refactor food creation in Spring Boot so it generates tags through FastAPI before saving.
6. Add Spring Boot services that build and write embedding payloads into Redis per restaurant.
7. Refactor FastAPI so recommendation logic can work from a prebuilt synchronized dataset instead of request-provided restaurant arrays.
8. Add FastAPI Redis client access and startup loading from Redis.
9. Change `/recommend` to use the synchronized FAISS index.

## Design Constraints

- PostgreSQL remains the only source of truth.
- Redis is shared stored data, not canonical storage.
- Synchronization should stay simple and synchronous at first.
- Spring Boot and FastAPI both communicate with Redis directly as clients.
- DTOs for recommendation should be internal and purpose-built.
- Delete and retry behavior must be designed explicitly.

## Open Questions Before Code Changes

- Do you want eventual consistency within seconds, or is slower batch freshness acceptable?
- Do you need food updates to immediately trigger restaurant reindexing?
- Will multiple FastAPI instances run at once?
- If tag generation fails during food creation, should the API fail or save food without tags and retry later?

## Permission Request For Next Step

The next useful code change is to establish Redis as the synchronization layer:

1. define the embedding DTO contract
2. define the food-tag generation contract
3. add Redis integration in Spring Boot
4. refactor food creation so Spring Boot generates tags through FastAPI before saving
5. write restaurant embedding payloads into Redis from Spring Boot
6. add FastAPI Redis client access
7. refactor FastAPI so it can load from Redis-backed synchronized data rather than request-provided restaurant arrays

If you want, I can implement that first slice directly in this repository next.

## Using Spring Cache With Redis

Spring cache annotations are useful here, but only for specific read-heavy cases.

## Good uses for `@Cacheable`

Use `@Cacheable` for data that is:

- expensive to fetch
- read often
- relatively stable
- safe to recalculate on cache miss

Good candidates in this design:

- known food tag definitions loaded from FastAPI or DB
- internal lookup tables such as tag name to entity mapping
- optionally restaurant embedding payload reads if Spring Boot itself also needs to re-read them

Example use cases:

- `getAllKnownFoodTags()`
- `getFoodTagEntityByType(String type)`
- `getRestaurantEmbeddingPayload(Long restaurantId)` if you decide Spring reads before writing updates

## Bad uses for `@Cacheable`

Do not rely on `@Cacheable` as the main synchronization mechanism for restaurant recommendation payloads.

Why:

- recommendation sync needs explicit writes and explicit invalidation
- you need deterministic refresh on restaurant and food mutations
- FastAPI depends on Redis contents being correct immediately after Spring Boot updates

For that main path, prefer explicit Redis writes with `@CachePut` or direct RedisTemplate/service methods.

## Recommended annotation strategy

Use a mixed approach:

- `@Cacheable` for reference data and lookup-heavy reads
- `@CacheEvict` when reference data changes
- `@CachePut` for deterministic per-restaurant payload refreshes after save

Suggested pattern:

1. Startup loads known `FoodTagType` values.
2. Spring caches tag lookups with `@Cacheable`.
3. Food creation calls FastAPI and resolves tags using the cached lookup.
4. After the food is saved, Spring explicitly refreshes `restaurant:embedding:{id}`.

## Practical advice

If you are deciding between annotations and manual Redis access:

- use annotations for simple cacheable lookups
- use manual Redis writes for recommendation payload synchronization

This keeps the design predictable and easier to debug.

## Final Design Summary

The intended steady-state design is:

- Spring Boot writes canonical data to PostgreSQL
- Spring Boot generates and maintains recommendation-ready restaurant payloads in Redis
- FastAPI connects directly to Redis as a client
- FastAPI uses Redis data to build and serve FAISS-backed recommendations

This removes the need for Spring Boot to push large recommendation payloads over HTTP and keeps Redis as the shared handoff store between the two services.
