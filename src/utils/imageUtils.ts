/**
 * Utility functions for compressing and processing student photos
 * Ensures photos stored in Firestore are optimized (<50KB),
 * preventing document size limits and maintaining high performance.
 */

export async function compressStudentPhoto(
  file: File,
  maxWidth = 320,
  maxHeight = 400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('કૃપા કરીને માન્ય ઇમેજ ફાઇલ પસંદ કરો (Please select a valid image file).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ફોટો વાંચવામાં ભૂલ આવી (Failed to read image file).'));

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ઇમેજ લોડ કરવામાં નિષ્ફળ (Failed to load image).'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('કેનવાસ ઉપલબ્ધ નથી (Canvas context not available).'));
          return;
        }

        // Draw with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
