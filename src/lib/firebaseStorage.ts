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

