// Utility functions for handling images

// Convert a file to base64 string
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Resize image before storing it
export async function resizeImage(base64Image, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions while maintaining aspect ratio
            if (width > maxWidth) {
                height = Math.round(height * (maxWidth / width));
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = Math.round(width * (maxHeight / height));
                height = maxHeight;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get the resized image as base64
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
    });
}

// Display image in element
export function displayImage(imageData, element) {
    if (imageData) {
        element.innerHTML = `<img src="${imageData}" alt="Изображение к карточке" class="card-image">`;
    } else {
        element.innerHTML = '';
    }
}