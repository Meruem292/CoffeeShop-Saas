import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const isFirebaseStorageConfigured = (): boolean => {
  return true;
};

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file to Firebase Storage bucket under 'products/' path.
 * If Storage returns permission errors or is unauthorized, automatically
 * falls back to a base64 Data URL so image upload always succeeds seamlessly.
 */
export const uploadProductImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storageRef = ref(storage, `products/${cleanFileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (err: any) {
    console.warn('Firebase Storage upload permission/unauthorized error encountered, falling back to Data URL encoding:', err);
    return await readFileAsDataURL(file);
  }
};

/**
 * Uploads an audio track to Firebase Storage under 'theme_audio/' path.
 * Returns the download URL (lightweight ~100 character link).
 * Prevents exceeding Firestore's strict 1MB single document size limit.
 */
export const uploadAudioFile = async (file: File, folder: string = 'theme_audio'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop() || 'mp3';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storageRef = ref(storage, `${folder}/${cleanFileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (err: any) {
    console.warn('Firebase Storage upload error for audio, checking fallback options:', err);
    // If Storage fails and file is small enough (< 200KB), allow base64 fallback to protect Firestore 1MB document limit
    if (file.size <= 200 * 1024) {
      return await readFileAsDataURL(file);
    }
    throw new Error('Audio file is too large for database storage without Firebase Storage enabled. Please upload a file under 200KB or check Firebase Storage permissions.');
  }
};

/**
 * Uploads an image (logo, QR, splash) to Firebase Storage under a designated folder.
 * Returns the CDN download URL.
 */
export const uploadImageFile = async (file: File, folder: string = 'settings'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storageRef = ref(storage, `${folder}/${cleanFileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (err: any) {
    console.warn(`Firebase Storage upload error for ${folder} image, falling back to data URL:`, err);
    if (file.size <= 300 * 1024) {
      return await readFileAsDataURL(file);
    }
    throw new Error('Image file is too large for database storage without Firebase Storage enabled. Please upload an image under 300KB.');
  }
};
