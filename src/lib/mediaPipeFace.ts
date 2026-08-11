import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<FaceLandmarker | null> | null = null;

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

    const landmarks = results.faceLandmarks[0]; // 478 3D points
    if (!landmarks || landmarks.length === 0) return null;

    // Normalize coordinates relative to face center & eye scale
    // Key landmark indices: Left Eye Outer (33), Right Eye Outer (263), Nose Tip (1), Chin (152)
    const pLeftEye = landmarks[33] || landmarks[0];
    const pRightEye = landmarks[263] || landmarks[1];

    const eyeDistance = Math.hypot(
      pRightEye.x - pLeftEye.x,
      pRightEye.y - pLeftEye.y,
      pRightEye.z - pLeftEye.z
    ) || 0.1;

    // Calculate face centroid
    let cx = 0, cy = 0, cz = 0;
    for (const p of landmarks) {
      cx += p.x;
      cy += p.y;
      cz += p.z;
    }
    cx /= landmarks.length;
    cy /= landmarks.length;
    cz /= landmarks.length;

    // Create normalized 3D feature vector
    const vector: number[] = [];
    for (const p of landmarks) {
      vector.push((p.x - cx) / eyeDistance);
      vector.push((p.y - cy) / eyeDistance);
      vector.push((p.z - cz) / eyeDistance);
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
  return Math.max(0, 1 - dist / 25);
}
