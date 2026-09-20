import { uploadProductImage as uploadToFirebaseStorage, isFirebaseStorageConfigured } from './firebaseStorage';

export const isSupabaseConfigured = (): boolean => {
  return isFirebaseStorageConfigured();
};

export const getSupabase = () => {
  throw new Error('Supabase has been replaced with Firebase Storage.');
};

export const uploadProductImage = async (file: File): Promise<string> => {
  return uploadToFirebaseStorage(file);
};
