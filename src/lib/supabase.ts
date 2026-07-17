import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseInstance;
};

/**
 * Uploads a file to Supabase storage bucket 'product-images'.
 * Returns the public URL of the uploaded image.
 */
export const uploadProductImage = async (file: File): Promise<string> => {
  const supabase = getSupabase();
  
  // Clean filename to prevent any special character issues
  const fileExt = file.name.split('.').pop() || 'png';
  const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `products/${cleanFileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    // Provide a descriptive message if bucket is missing
    if (error.message?.includes('bucket not found') || (error as any).status === 404) {
      throw new Error("Bucket 'product-images' not found. Please create a public bucket named 'product-images' in your Supabase dashboard.");
    }
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to retrieve the public URL for the uploaded image.');
  }

  return publicUrlData.publicUrl;
};
