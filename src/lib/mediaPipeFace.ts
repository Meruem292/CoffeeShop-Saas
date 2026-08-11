import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<FaceLandmarker | null> | null = null;

// Curated key facial landmark indices for high-accuracy matching (eyes, nose, lips, jaw contour)
const KEY_LANDMARK_INDICES = [
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

/**
 * Extract normalized facial feature vector from an HTML element (Canvas / Video / Image)
 */
export async function extractFaceVector(
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[] | null> {
  try {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return null;

    const results = landmarker.detect(element);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.faceLandmarks[0];
    if (!landmarks || landmarks.length === 0) return null;

    // Key landmark indices: Left Eye Outer (33), Right Eye Outer (263)
    const pLeftEye = landmarks[33] || landmarks[0];
    const pRightEye = landmarks[263] || landmarks[1];

    const eyeDistance = Math.hypot(
      pRightEye.x - pLeftEye.x,
      pRightEye.y - pLeftEye.y,
      pRightEye.z - pLeftEye.z
    ) || 0.1;

    // Calculate face centroid using key points
    let cx = 0, cy = 0, cz = 0;
    const validIndices = KEY_LANDMARK_INDICES.filter(idx => landmarks[idx]);
    const targetPoints = validIndices.length > 0 ? validIndices.map(idx => landmarks[idx]) : landmarks;

    for (const p of targetPoints) {
      cx += p.x;
      cy += p.y;
      cz += p.z;
    }
    cx /= targetPoints.length;
    cy /= targetPoints.length;
    cz /= targetPoints.length;

    // Create normalized 3D feature vector from key structural indices
    const vector: number[] = [];
    for (const idx of KEY_LANDMARK_INDICES) {
      const p = landmarks[idx];
      if (p) {
        vector.push((p.x - cx) / eyeDistance);
        vector.push((p.y - cy) / eyeDistance);
        vector.push((p.z - cz) / eyeDistance);
      } else {
        vector.push(0, 0, 0);
      }
    }

    return vector;
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
 * Calculate Cosine Similarity between two feature vectors
 */
export function calculateCosineSimilarity(vA: number[], vB: number[]): number {
  if (!vA || !vB || vA.length !== vB.length || vA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vA.length; i++) {
    dotProduct += vA[i] * vB[i];
    normA += vA[i] * vA[i];
    normB += vB[i] * vB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate Euclidean Distance Similarity (0 to 1)
 */
export function calculateDistanceSimilarity(vA: number[], vB: number[]): number {
  if (!vA || !vB || vA.length !== vB.length || vA.length === 0) return 0;

  let sumSq = 0;
  for (let i = 0; i < vA.length; i++) {
    const diff = vA[i] - vB[i];
    sumSq += diff * diff;
  }

  const dist = Math.sqrt(sumSq);
  // Convert distance to normalized similarity score [0, 1]
  return Math.max(0, 1 - dist / 15);
}

/**
  * Calculate highest similarity score across multiple candidate vectors
  */
export function calculateBestMultiVectorSimilarity(
  liveVector: number[],
  storedVectors: number[][]
): number {
  if (!liveVector || !storedVectors || storedVectors.length === 0) return 0;

  let maxScore = 0;
  for (const storedVec of storedVectors) {
    if (!storedVec || storedVec.length === 0) continue;
    const simCosine = calculateCosineSimilarity(liveVector, storedVec);
    const simDistance = calculateDistanceSimilarity(liveVector, storedVec);
    const score = (simCosine + simDistance) / 2;
    if (score > maxScore) {
      maxScore = score;
    }
  }
  return maxScore;
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
  try {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) return null;

    const results = landmarker.detect(element);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        hasFace: false,
        vector: null,
        yawRatio: 0.5,
        isCenter: false,
        isTurnLeft: false,
        isTurnRight: false,
        isSmiling: false,
      };
    }

    const landmarks = results.faceLandmarks[0];
    const vector = await extractFaceVector(element);

    const pLeftEye = landmarks[33] || landmarks[0];
    const pRightEye = landmarks[263] || landmarks[1];
    const pNose = landmarks[1] || landmarks[2];
    const pMouthLeft = landmarks[61];
    const pMouthRight = landmarks[291];

    const eyeWidth = Math.abs(pRightEye.x - pLeftEye.x) || 0.1;
    const yawRatio = (pNose.x - Math.min(pLeftEye.x, pRightEye.x)) / eyeWidth;

    const isCenter = yawRatio >= 0.38 && yawRatio <= 0.62;
    const isTurnLeft = yawRatio > 0.62 || yawRatio < 0.30;
    const isTurnRight = yawRatio < 0.38 || yawRatio > 0.70;

    let mouthWidth = 0;
    if (pMouthLeft && pMouthRight) {
      mouthWidth = Math.hypot(pMouthRight.x - pMouthLeft.x, pMouthRight.y - pMouthLeft.y);
    }
    const isSmiling = (mouthWidth / eyeWidth) > 0.72;

    return {
      hasFace: true,
      vector,
      yawRatio,
      isCenter,
      isTurnLeft,
      isTurnRight,
      isSmiling,
    };
  } catch (err) {
    return null;
  }
}
