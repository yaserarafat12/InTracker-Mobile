import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { analyzeFoodPhoto } from '../../lib/foodScanner';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { getMealTypeByTime } from '../../engines/foodLogEngine';
import type { MealType } from '../../engines/foodLogEngine';
import type { ScannedFoodItem } from '../../lib/foodScanner';

// --- Types ---

interface FoodScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanPhase = 'capture' | 'preview' | 'analyzing' | 'results' | 'error';

type ErrorType = 'timeout' | 'no_food' | 'unreachable' | 'image_too_large';

interface DetectedItem extends ScannedFoodItem {
  checked: boolean;
}

// --- Constants ---

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ANALYSIS_TIMEOUT_MS = 30000;
const MAX_DETECTED_ITEMS = 10;

// --- Helpers ---

function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  return getMealTypeByTime(hour);
}

function getErrorMessage(errorType: ErrorType): string {
  switch (errorType) {
    case 'timeout':
      return 'Analysis timed out. The service took too long to respond.';
    case 'no_food':
      return 'No food detected in the image. Try a clearer photo.';
    case 'unreachable':
      return 'Food recognition service is currently unreachable.';
    case 'image_too_large':
      return `Image is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`;
  }
}

// --- Component ---

export function FoodScanner({ isOpen, onClose }: FoodScannerProps) {
  const { addEntry, selectedDate } = useFoodLogStore();

  // State
  const [phase, setPhase] = useState<ScanPhase>('capture');
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setPhase('capture');
      setMealType(getDefaultMealType());
      setImagePreview(null);
      setImageBase64(null);
      setDetectedItems([]);
      setErrorType(null);
      setConfirmError(null);
    }
  }, [isOpen]);

  // --- File Handling ---

  const handleFileSelect = useCallback((file: File) => {
    // Check file size (Requirement 14.10)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorType('image_too_large');
      setPhase('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = result.split(',')[1] || result;
      setImageBase64(base64);
      setPhase('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input value so the same file can be selected again
      e.target.value = '';
    },
    [handleFileSelect]
  );

  // --- Analysis ---

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) return;

    setPhase('analyzing');
    setErrorType(null);

    // Create abort controller for timeout
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set up 30s timeout (Requirement 14.3, 14.4)
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, ANALYSIS_TIMEOUT_MS);

    try {
      // Race between analysis and abort
      const resultPromise = analyzeFoodPhoto(imageBase64);

      // Listen for abort
      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('timeout'));
        });
      });

      const results = await Promise.race([resultPromise, abortPromise]);

      clearTimeout(timeoutId);

      if (!results || results.length === 0) {
        // No food detected (Requirement 14.8)
        setErrorType('no_food');
        setPhase('error');
        return;
      }

      // Limit to 10 items, all checked by default (Requirement 14.5)
      const items: DetectedItem[] = results.slice(0, MAX_DETECTED_ITEMS).map((item) => ({
        ...item,
        checked: true,
      }));

      setDetectedItems(items);
      setPhase('results');
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.message === 'timeout') {
        setErrorType('timeout');
      } else {
        // Service unreachable (Requirement 14.9)
        setErrorType('unreachable');
      }
      setPhase('error');
    }
  }, [imageBase64]);

  // --- Item Selection ---

  const toggleItem = useCallback((index: number) => {
    setDetectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    );
    setConfirmError(null);
  }, []);

  // --- Confirm ---

  const handleConfirm = useCallback(() => {
    const selectedItems = detectedItems.filter((item) => item.checked);

    // Requirement 14.7: at least one item must be selected
    if (selectedItems.length === 0) {
      setConfirmError('Please select at least one item to add.');
      return;
    }

    // Create food entries for checked items (Requirement 14.6)
    for (const item of selectedItems) {
      addEntry({
        date: selectedDate,
        mealType,
        foodName: item.name,
        calories: Math.round(item.calories),
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        source: 'ai_scan',
      });
    }

    onClose();
  }, [detectedItems, mealType, selectedDate, addEntry, onClose]);

  // --- Retry ---

  const handleRetry = useCallback(() => {
    setErrorType(null);
    setConfirmError(null);

    if (imagePreview && imageBase64) {
      // If we already have an image, go back to preview
      setPhase('preview');
    } else {
      setPhase('capture');
    }
  }, [imagePreview, imageBase64]);

  // --- Render ---

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-[#16181c] z-[110] flex flex-col"
    >
      {/* Header */}
      <div className="pt-14 pb-4 px-6 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="text-[14px] font-bold font-['Outfit'] text-[#E3DAC9]/80"
        >
          Cancel
        </motion.button>
        <h2 className="text-[18px] font-black font-['Outfit'] text-[#E3DAC9]">
          Scan Food
        </h2>
        <div className="w-14" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <AnimatePresence mode="wait">
          {/* Capture Phase */}
          {phase === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-6 pt-4"
            >
              {/* Camera Placeholder Area */}
              <div className="w-full aspect-[4/3] rounded-3xl bg-[#2a2c32] border border-white/10 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#00FF85]/10 flex items-center justify-center">
                  <Icon icon="ph:camera-bold" width={40} className="text-[#00FF85]" />
                </div>
                <p className="text-[14px] font-bold font-['Outfit'] text-[#E3DAC9]/60 text-center px-8">
                  Take a photo of your food
                </p>
              </div>

              {/* Meal Type Selector */}
              {renderMealTypeSelector()}

              {/* Source Buttons */}
              <div className="flex gap-3 w-full">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-14 rounded-2xl bg-[#2a2c32] border border-white/10 flex items-center justify-center gap-2"
                >
                  <Icon icon="ph:camera-bold" width={20} className="text-[#00FF85]" />
                  <span className="text-[13px] font-bold font-['Outfit'] text-[#E3DAC9]">
                    Camera
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => libraryInputRef.current?.click()}
                  className="flex-1 h-14 rounded-2xl bg-[#2a2c32] border border-white/10 flex items-center justify-center gap-2"
                >
                  <Icon icon="ph:image-bold" width={20} className="text-[#00FF85]" />
                  <span className="text-[13px] font-bold font-['Outfit'] text-[#E3DAC9]">
                    Library
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Preview Phase */}
          {phase === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-6 pt-4"
            >
              {/* Image Preview */}
              <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-white/10">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Food photo preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Meal Type Selector */}
              {renderMealTypeSelector()}

              {/* Analyze Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAnalyze}
                className="w-full h-14 rounded-2xl bg-[#00FF85] border-2 border-black flex items-center justify-center gap-2"
              >
                <Icon icon="ph:magnifying-glass-bold" width={20} className="text-black" />
                <span className="text-[14px] font-black font-['Outfit'] text-black uppercase tracking-wider">
                  Analyze Food
                </span>
              </motion.button>

              {/* Retake Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setImagePreview(null);
                  setImageBase64(null);
                  setPhase('capture');
                }}
                className="text-[13px] font-bold font-['Outfit'] text-[#E3DAC9]/50"
              >
                Take a different photo
              </motion.button>
            </motion.div>
          )}

          {/* Analyzing Phase */}
          {phase === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-6 pt-20"
            >
              <div className="w-20 h-20 rounded-full bg-[#00FF85]/10 flex items-center justify-center">
                <Icon
                  icon="ph:spinner"
                  width={40}
                  className="text-[#00FF85] animate-spin"
                />
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold font-['Outfit'] text-[#E3DAC9]">
                  Analyzing your food...
                </p>
                <p className="text-[12px] text-white/40 mt-2 font-['Outfit']">
                  This may take up to 30 seconds
                </p>
              </div>
            </motion.div>
          )}

          {/* Results Phase */}
          {phase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 pt-2"
            >
              <p className="text-[12px] font-bold text-white/40 font-['Outfit'] uppercase tracking-wider">
                Detected Items ({detectedItems.filter((i) => i.checked).length}/{detectedItems.length} selected)
              </p>

              {/* Detected Items List */}
              <div className="space-y-2">
                {detectedItems.map((item, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleItem(index)}
                    className={`w-full p-4 rounded-2xl text-left transition-all ${
                      item.checked
                        ? 'bg-[#00FF85]/5 border border-[#00FF85]/40'
                        : 'bg-[#2a2c32] border border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                          item.checked
                            ? 'bg-[#00FF85] border-[#00FF85]'
                            : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {item.checked && (
                          <Icon icon="ph:check-bold" width={12} className="text-black" />
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold font-['Outfit'] text-[#E3DAC9] truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[13px] font-bold text-[#00FF85] font-['Outfit']">
                            {Math.round(item.calories)} kcal
                          </span>
                          <span className="text-[11px] text-white/40 font-['Outfit']">
                            P: {item.protein.toFixed(1)}g
                          </span>
                          <span className="text-[11px] text-white/40 font-['Outfit']">
                            C: {item.carbs.toFixed(1)}g
                          </span>
                          <span className="text-[11px] text-white/40 font-['Outfit']">
                            F: {item.fat.toFixed(1)}g
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Confirm Error */}
              {confirmError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <Icon icon="ph:warning-circle-fill" width={16} className="text-red-400 shrink-0" />
                  <p className="text-[12px] text-red-400 font-['Outfit']">{confirmError}</p>
                </div>
              )}

              {/* Meal Type Selector */}
              {renderMealTypeSelector()}

              {/* Confirm Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="w-full h-14 rounded-2xl bg-[#00FF85] border-2 border-black flex items-center justify-center gap-2"
              >
                <Icon icon="ph:check-bold" width={20} className="text-black" />
                <span className="text-[14px] font-black font-['Outfit'] text-black uppercase tracking-wider">
                  Confirm
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* Error Phase */}
          {phase === 'error' && errorType && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-6 pt-16"
            >
              <div className="w-20 h-20 rounded-full bg-[#FF4D00]/10 flex items-center justify-center">
                <Icon icon="ph:warning-circle-bold" width={40} className="text-[#FF4D00]" />
              </div>

              <div className="text-center px-4">
                <p className="text-[16px] font-bold font-['Outfit'] text-[#E3DAC9]">
                  {errorType === 'timeout' && 'Request Timed Out'}
                  {errorType === 'no_food' && 'No Food Detected'}
                  {errorType === 'unreachable' && 'Service Unavailable'}
                  {errorType === 'image_too_large' && 'Image Too Large'}
                </p>
                <p className="text-[13px] text-white/40 mt-2 font-['Outfit'] leading-relaxed">
                  {getErrorMessage(errorType)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full px-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetry}
                  className="w-full h-14 rounded-2xl bg-[#2a2c32] border border-white/10 flex items-center justify-center gap-2"
                >
                  <Icon icon="ph:arrow-clockwise-bold" width={18} className="text-[#00FF85]" />
                  <span className="text-[13px] font-bold font-['Outfit'] text-[#E3DAC9]">
                    Retry
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full h-14 rounded-2xl bg-[#00FF85] border-2 border-black flex items-center justify-center gap-2"
                >
                  <Icon icon="ph:plus-bold" width={18} className="text-black" />
                  <span className="text-[13px] font-black font-['Outfit'] text-black">
                    Use Quick Add
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Capture photo with camera"
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Select photo from library"
      />
    </motion.div>
  );

  // --- Shared Sub-renders ---

  function renderMealTypeSelector() {
    return (
      <div className="w-full">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
          Meal Type
        </p>
        <div className="flex gap-2">
          {MEAL_TYPES.map((meal) => (
            <motion.button
              key={meal.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMealType(meal.id)}
              className={`flex-1 py-2.5 rounded-xl font-bold font-['Outfit'] text-[11px] transition-all ${
                mealType === meal.id
                  ? 'bg-[#00FF85] text-black border-2 border-black'
                  : 'bg-[#2a2c32] text-[#E3DAC9]/60 border border-white/10'
              }`}
            >
              {meal.label}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
}
