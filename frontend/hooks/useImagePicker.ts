import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '@/contexts/AlertContext';

export interface ImagePickerResult {
  base64: string | null;
  uri: string | null;
}

export function useImagePicker() {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        title: 'İzin Gerekli',
        message: 'Kamerayı kullanabilmek için kamera iznine ihtiyacımız var.',
        type: 'warning',
      });
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        title: 'İzin Gerekli',
        message: 'Galeriye erişebilmek için fotoğraf galerisi iznine ihtiyacımız var.',
        type: 'warning',
      });
      return false;
    }
    return true;
  };

  const pickImage = useCallback(async (source: 'camera' | 'gallery'): Promise<ImagePickerResult | null> => {
    setLoading(true);
    try {
      if (source === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          return {
            uri: result.assets[0].uri,
            base64: result.assets[0].base64 || null,
          };
        }
      } else if (source === 'gallery') {
        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          return {
            uri: result.assets[0].uri,
            base64: result.assets[0].base64 || null,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Image picking error:', error);
      showAlert({
        title: 'Hata',
        message: 'Fotoğraf işlemi sırasında bir hata oluştu.',
        type: 'error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  return { pickImage, loading };
}
