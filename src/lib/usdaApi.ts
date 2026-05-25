/**
 * USDA FoodData Central API integration
 * Searches the USDA database for food nutritional data.
 *
 * Requirements: 18.3, 18.4, 18.6, 18.10
 */

export interface UsdaSearchResult {
  fdcId: number;
  description: string;
  servingSize: number;
  servingSizeUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Nutrient IDs used by USDA FoodData Central
const NUTRIENT_ID_ENERGY = 1008;
const NUTRIENT_ID_PROTEIN = 1003;
const NUTRIENT_ID_CARBS = 1005;
const NUTRIENT_ID_FAT = 1004;

// Rate limiting: 1000 requests per hour
const RATE_LIMIT_MAX = 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in ms

let requestTimestamps: number[] = [];

/**
 * Checks whether the rate limit has been reached.
 * Cleans up timestamps older than the 1-hour window.
 */
function isRateLimited(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  requestTimestamps = requestTimestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  return requestTimestamps.length >= RATE_LIMIT_MAX;
}

/**
 * Records a request timestamp for rate limiting.
 */
function recordRequest(): void {
  requestTimestamps.push(Date.now());
}

/**
 * Extracts a nutrient value from the USDA foodNutrients array by nutrient ID.
 */
function extractNutrient(
  foodNutrients: Array<{ nutrientId: number; value: number }>,
  nutrientId: number
): number {
  const nutrient = foodNutrients.find((n) => n.nutrientId === nutrientId);
  return nutrient?.value ?? 0;
}

/**
 * Searches the USDA FoodData Central API for foods matching the query.
 *
 * - Uses VITE_USDA_API_KEY from environment variables
 * - Returns max 20 results
 * - 3-second timeout using AbortController, returns empty array on timeout
 * - Returns empty array if rate limit (1000/hr) is reached
 * - Parses response to extract: fdcId, food name, serving size, calories, protein, carbs, fat
 */
export async function searchUsda(query: string): Promise<UsdaSearchResult[]> {
  // Return empty if query is empty or whitespace
  if (!query.trim()) {
    return [];
  }

  // Check rate limit before making request
  if (isRateLimited()) {
    return [];
  }

  const apiKey = import.meta.env.VITE_USDA_API_KEY as string;
  if (!apiKey) {
    return [];
  }

  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', '20');
  url.searchParams.set('dataType', 'Foundation,SR Legacy');

  // 3-second timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    recordRequest();

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    const results: UsdaSearchResult[] = data.foods.map(
      (food: {
        fdcId: number;
        description: string;
        servingSize?: number;
        servingSizeUnit?: string;
        foodNutrients?: Array<{ nutrientId: number; value: number }>;
      }) => ({
        fdcId: food.fdcId,
        description: food.description ?? '',
        servingSize: food.servingSize ?? 100,
        servingSizeUnit: food.servingSizeUnit ?? 'g',
        calories: extractNutrient(food.foodNutrients ?? [], NUTRIENT_ID_ENERGY),
        protein: extractNutrient(food.foodNutrients ?? [], NUTRIENT_ID_PROTEIN),
        carbs: extractNutrient(food.foodNutrients ?? [], NUTRIENT_ID_CARBS),
        fat: extractNutrient(food.foodNutrients ?? [], NUTRIENT_ID_FAT),
      })
    );

    return results;
  } catch {
    // AbortError (timeout) or network error — return empty array
    clearTimeout(timeoutId);
    return [];
  }
}

/**
 * Resets the rate limit counter. Useful for testing.
 */
export function resetRateLimit(): void {
  requestTimestamps = [];
}

/**
 * Returns the current request count within the rate limit window. Useful for testing.
 */
export function getRateLimitCount(): number {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  return requestTimestamps.length;
}
