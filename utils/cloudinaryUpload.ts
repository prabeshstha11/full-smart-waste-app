import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_CLOUD_NAME = 'dxj5sbmqe';
const CLOUDINARY_UPLOAD_PRESET = 'image-expo-app';

export async function pickAndUploadImage(): Promise<string | null> {
  try {
    // Request media access permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      console.warn('Permission denied to access media library.');
      return null;
    }

    // Launch image picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      console.log('Image picking cancelled.');
      return null;
    }

    const image = pickerResult.assets[0];

    // Prepare form data for Cloudinary
    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      name: 'upload.jpg',
      type: 'image/jpeg',
    } as any);

    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // Upload using fetch
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Cloudinary error:', data);
      return null;
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
} 