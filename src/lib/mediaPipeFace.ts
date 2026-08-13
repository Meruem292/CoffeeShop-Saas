import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<FaceLandmarker | null> | null = null;

// Curated key facial landmark indices for high-accuracy matching (eyes, nose, lips, jaw contour)
export const KEY_LANDMARK_INDICES = [
  // Eyes
  33, 133, 160, 159, 158, 144, 153, 145, 154, 246,
  263, 362, 385, 386, 387, 373, 380, 374, 381, 466,
  // Nose
  1, 2, 4, 5, 6, 195, 168, 197, 19, 94, 125, 141, 242, 456,
  // Mouth / Lips
  13, 14, 78, 308, 61, 291, 0, 17, 37, 267, 269, 270, 409, 292, 375, 321, 405, 314, 17, 84, 181, 91, 146,
  // Face Contour & Cheeks
  10, 152, 234, 454, 58, 288, 136, 365, 149, 378, 127, 356, 116, 345, 123, 352, 147, 376
];

/**
 * Initialize Google MediaPipe Face Landmarker client-side in the browser
 */
export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarker) return faceLandmarker;
  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'IMAGE',
        numFaces: 1,
      });
      return faceLandmarker;
    } catch (err) {
      console.warn('MediaPipe GPU initialization fallback to CPU:', err);
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'IMAGE',
          numFaces: 1,
        });
        return faceLandmarker;
      } catch (fallbackErr) {
        console.error('MediaPipe FaceLandmarker failed to load:', fallbackErr);
        return null;
      }
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

function isElementReady(
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): boolean {
  if (!element) return false;
  if (element instanceof HTMLVideoElement) {
    return (
      element.readyState >= 2 &&
      element.videoWidth > 0 &&
      element.videoHeight > 0 &&
      !element.paused &&
      !element.ended
    );
  }
  if (element instanceof HTMLImageElement) {
    return element.complete && element.naturalWidth > 0 && element.naturalHeight > 0;
  }
  if (element instanceof HTMLCanvasElement) {
    return element.width > 0 && element.height > 0;
  }
  return true;
}

/**
 * L2 Unit Normalize a 1D vector
 */
export function normalizeL2(vec: number[]): number[] {
  if (!vec || vec.length === 0) return [];
  let normSq = 0;
  for (let i = 0; i < vec.length; i++) {
    const val = Number(vec[i]) || 0;
    normSq += val * val;
  }
  const norm = Math.sqrt(normSq);
  if (norm === 0) return vec;
  return vec.map((v) => (Number(v) || 0) / norm);
}

/**
 * Helper to build normalized 3D feature vector directly from Mediapipe landmarks
 */
export function createVectorFromLandmarks(landmarks: any[]): number[] | null {
  if (!landmarks || landmarks.length === 0) return null;

  const pLeftEye = landmarks[33] || landmarks[0];
  const pRightEye = landmarks[263] || landmarks[1];

  const eyeDistance =
    Math.hypot(
      pRightEye.x - pLeftEye.x,
      pRightEye.y - pLeftEye.y,
      pRightEye.z - pLeftEye.z
    ) || 0.1;

  let cx = 0,
    cy = 0,
    cz = 0;
  const validIndices = KEY_LANDMARK_INDICES.filter((idx) => landmarks[idx]);
  const targetPoints =
    validIndices.length > 0 ? validIndices.map((idx) => landmarks[idx]) : landmarks;

  for (const p of targetPoints) {
    cx += p.x;
    cy += p.y;
    cz += p.z;
  }
  cx /= targetPoints.length;
  cy /= targetPoints.length;
  cz /= targetPoints.length;

  const vector: number[] = [];
  for (const idx of KEY_LANDMARK_INDICES) {
    const p = landmarks[idx];
    if (p) {
      vector.push((p.x - cx) / eyeDistance);
      vector.push((p.y - cy) / eyeDistance);
      // Dampen z coordinate to reduce perspective depth distortion sensitivity across distances
      vector.push(((p.z - cz) / eyeDistance) * 0.3);
    } else {
      vector.push(0, 0, 0);
    }
  }

  return normalizeL2(vector);
}

/**
 * Extract normalized facial feature vector from an HTML element (Canvas / Video / Image)
 */
export async function extractFaceVector(
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[] | null> {
  if (!isElementReady(element)) return null;

  try {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return null;

    const results = landmarker.detect(element);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }

    return createVectorFromLandmarks(results.faceLandmarks[0]);
  } catch (err) {
    console.warn('Error extracting MediaPipe face vector:', err);
    return null;
  }
}

/**
 * Convert base64 image URL or HTTP URL to HTMLImageElement
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Calculate Cosine Similarity between two feature vectors with L2 normalization
 */
export function calculateCosineSimilarity(vA: number[], vB: number[]): number {
  if (!vA || !vB || vA.length === 0 || vB.length === 0 || vA.length !== vB.length) return 0;

  const nA = normalizeL2(vA);
  const nB = normalizeL2(vB);

  let dotProduct = 0;
  for (let i = 0; i < nA.length; i++) {
    dotProduct += nA[i] * nB[i];
  }

  return Math.max(-1, Math.min(1, dotProduct));
}

/**
 * Calculate Euclidean Distance Similarity (0 to 1) for L2 normalized vectors
 */
export function calculateDistanceSimilarity(vA: number[], vB: number[]): number {
  if (!vA || !vB || vA.length === 0 || vB.length === 0 || vA.length !== vB.length) return 0;

  const nA = normalizeL2(vA);
  const nB = normalizeL2(vB);

  let sumSq = 0;
  for (let i = 0; i < nA.length; i++) {
    const diff = nA[i] - nB[i];
    sumSq += diff * diff;
  }

  const dist = Math.sqrt(sumSq);
  // For unit vectors, max distance is 2. Smooth scale [0, 1]
  return Math.max(0, 1 - dist / 2);
}

/**
 * Calibrate cosine similarity of 3D facial landmark vectors to intuitive [0, 100]% match confidence
 */
export function calculateFaceMatchConfidence(vA: number[], vB: number[]): { confidence: number; similarity: number } {
  if (!vA || !vB || vA.length === 0 || vB.length === 0 || vA.length !== vB.length) {
    return { confidence: 0, similarity: 0 };
  }

  const similarity = calculateCosineSimilarity(vA, vB);

  // Stricter kiosk calibration for high precision and zero false positives:
  // similarity >= 0.88 -> 95% - 100% confidence
  // similarity in [0.80, 0.88] -> 65% - 94% confidence
  // similarity in [0.70, 0.80] -> 20% - 64% confidence
  // similarity < 0.70 -> 0% - 19% confidence
  let confidence = 0;
  if (similarity >= 0.88) {
    confidence = Math.min(100, 95 + ((similarity - 0.88) / 0.12) * 5);
  } else if (similarity >= 0.80) {
    confidence = 65 + ((similarity - 0.80) / 0.08) * 29;
  } else if (similarity >= 0.70) {
    confidence = 20 + ((similarity - 0.70) / 0.10) * 44;
  } else {
    confidence = Math.max(0, (similarity / 0.70) * 19);
  }

  return {
    confidence: Math.round(confidence),
    similarity,
  };
}

/**
 * Safely parse vectors stored in Firestore (which may be string[], stringified JSON, or number[][])
 */
export function parseStoredFaceVectors(raw: any): number[][] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parseStoredFaceVectors(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        }
        if (Array.isArray(item)) return item;
        return null;
      })
      .filter((v): v is number[] => Array.isArray(v) && v.length > 0);
  }
  return [];
}

/**
  * Calculate highest similarity score & confidence across multiple candidate vectors
  */
export function calculateBestMultiVectorSimilarity(
  liveVector: number[],
  storedRawVectors: any
): { confidence: number; similarity: number } {
  if (!liveVector) return { confidence: 0, similarity: 0 };
  const storedVectors = parseStoredFaceVectors(storedRawVectors);
  if (storedVectors.length === 0) return { confidence: 0, similarity: 0 };

  let maxConf = 0;
  let maxSim = 0;
  for (const storedVec of storedVectors) {
    if (!storedVec || storedVec.length === 0) continue;
    const { confidence, similarity } = calculateFaceMatchConfidence(liveVector, storedVec);
    if (confidence > maxConf) {
      maxConf = confidence;
      maxSim = similarity;
    }
  }
  return { confidence: maxConf, similarity: maxSim };
}

/**
 * Detect facial head pose (Center, Left, Right) and expression (Smile) for guided enrollment
 */
export async function detectHeadPoseAndExpression(
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  hasFace: boolean;
  vector: number[] | null;
  yawRatio: number;
  isCenter: boolean;
  isTurnLeft: boolean;
  isTurnRight: boolean;
  isSmiling: boolean;
} | null> {
  if (!isElementReady(element)) return null;

  try {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return null;

    const results = landmarker.detect(element);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        hasFace: false,
        vector: null,
        yawRatio: 0,
        isCenter: false,
        isTurnLeft: false,
        isTurnRight: false,
        isSmiling: false,
      };
    }

    const landmarks = results.faceLandmarks[0];
    const vector = createVectorFromLandmarks(landmarks);

    const pLeftEye = landmarks[33] || landmarks[0];
    const pRightEye = landmarks[263] || landmarks[1];
    const pNose = landmarks[1] || landmarks[2];
    const pLeftCheek = landmarks[234];
    const pRightCheek = landmarks[454];
    const pMouthLeft = landmarks[61];
    const pMouthRight = landmarks[291];

    const eyeCenterX = (pLeftEye.x + pRightEye.x) / 2;
    const eyeWidth = Math.hypot(pRightEye.x - pLeftEye.x, pRightEye.y - pLeftEye.y) || 0.1;

    // Nose horizontal offset relative to eye center normalized by eye width
    const noseOffset = (pNose.x - eyeCenterX) / eyeWidth;

    // Face symmetry ratio based on cheek-to-nose distances
    let symmetryRatio = 0;
    if (pLeftCheek && pRightCheek) {
      const dLeft = Math.hypot(pNose.x - pLeftCheek.x, pNose.y - pLeftCheek.y);
      const dRight = Math.hypot(pNose.x - pRightCheek.x, pNose.y - pRightCheek.y);
      if (dLeft + dRight > 0) {
        symmetryRatio = (dLeft - dRight) / (dLeft + dRight);
      }
    }

    // Clean thresholds:
    // Center: strictly neutral looking forward (small nose offset and balanced cheek distances)
    const isCenter = Math.abs(noseOffset) < 0.10 && Math.abs(symmetryRatio) < 0.12;

    // Turn Left / Turn Right: requires head to actually rotate away from center!
    // Never matches if face is centered.
    const isTurnLeft = !isCenter && (noseOffset > 0.13 || symmetryRatio > 0.15);
    const isTurnRight = !isCenter && (noseOffset < -0.13 || symmetryRatio < -0.15);

    // Expression detection: Mouth width vs eye width (must be noticeably wider than neutral)
    let mouthWidth = 0;
    if (pMouthLeft && pMouthRight) {
      mouthWidth = Math.hypot(pMouthRight.x - pMouthLeft.x, pMouthRight.y - pMouthLeft.y);
    }
    const smileRatio = mouthWidth / eyeWidth;

    // Check blendshapes for smile if present in results
    let blendshapeSmile = 0;
    if ((results as any).faceBlendshapes && (results as any).faceBlendshapes.length > 0) {
      const categories = (results as any).faceBlendshapes[0].categories || [];
      const smileL = categories.find((c: any) => c.categoryName === 'mouthSmileLeft')?.score || 0;
      const smileR = categories.find((c: any) => c.categoryName === 'mouthSmileRight')?.score || 0;
      blendshapeSmile = (smileL + smileR) / 2;
    }

    const isSmiling = smileRatio > 0.63 || blendshapeSmile > 0.35;

    return {
      hasFace: true,
      vector,
      yawRatio: noseOffset,
      isCenter,
      isTurnLeft,
      isTurnRight,
      isSmiling,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Detect raw face landmarks for real-time mesh/wireframe mask overlay
 */
export async function detectFaceLandmarks(
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<any[] | null> {
  if (!isElementReady(element)) return null;
  try {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return null;
    const results = landmarker.detect(element);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }
    return results.faceLandmarks[0];
  } catch (err) {
    return null;
  }
}

