import { supabase } from './supabase';

/**
 * Represents a food item detected by the AI food recognition service.
 */
export interface ScannedFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Confidence score from 0 (low) to 1 (high) */
  confidence: number;
}

/**
 * Specific error types thrown by the food scanner.
 * - TIMEOUT: The AI service did not respond within 30 seconds
 * - NO_FOOD_DETECTED: The AI service could not identify any food in the image
 * - SERVICE_UNREACHABLE: Network failure or service unavailable
 */
export type FoodScanError = 'TIMEOUT' | 'NO_FOOD_DETECTED' | 'SERVICE_UNREACHABLE';

/**
 * Analyzes a food photo using the AI food recognition service via a Supabase Edge Function.
 *
 * @param imageBase64 - The base64-encoded image data to analyze
 * @returns An array of detected food items with nutritional estimates
 * @throws {Error} With message 'TIMEOUT' if the service does not respond within 30 seconds
 * @throws {Error} With message 'NO_FOOD_DETECTED' if no food items are identified in the image
 * @throws {Error} With message 'SERVICE_UNREACHABLE' if the network request fails
 *
 * Requirements: 14.3, 14.5
 */
export async function analyzeFoodPhoto(imageBase64: string): Promise<ScannedFoodItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const { data, error } = await supabase.functions.invoke('analyze-food', {
      body: { image: imageBase64 },
      signal: controller.signal as AbortSignal,
    });

    clearTimeout(timeoutId);

    if (error) {
      // Check if the error is due to abort (timeout)
      if (controller.signal.aborted) {
        throw new Error('TIMEOUT');
      }
      throw new Error('SERVICE_UNREACHABLE');
    }

    // Validate response contains food items
    const items: ScannedFoodItem[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

    if (items.length === 0) {
      throw new Error('NO_FOOD_DETECTED');
    }

    return items;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Re-throw our own typed errors
    if (err instanceof Error) {
      if (err.message === 'TIMEOUT' || err.message === 'NO_FOOD_DETECTED' || err.message === 'SERVICE_UNREACHABLE') {
        throw err;
      }

      // AbortError from the AbortController means timeout
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new Error('TIMEOUT');
      }
    }

    // Any other error is a network/service failure
    throw new Error('SERVICE_UNREACHABLE');
  }
}
