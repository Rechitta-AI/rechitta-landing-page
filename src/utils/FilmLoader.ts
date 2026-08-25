export function createSequence(manifestData: any, sceneName: string) {
  const data = manifestData[sceneName];
  
  // If the manifest data is already an array of strings (like our new transit-d generator)
  if (Array.isArray(data)) {
    return data.map((url: string, i: number) => {
      const img = new Image();
      img.decoding = 'async';
      img.dataset.url = url;
      if (i < 30) {
        img.src = url;
      }
      return img;
    });
  }

  // Fallback for the legacy object pattern (scene1-3, transit-b, transit-c)
  return Array.from({ length: data.frames }, (_, i) => {
    const startIndex = data.startFrame || 0;
    const url = `/film/${data.pattern.replace('{frame}', String(i + startIndex).padStart(3, '0'))}`;
    
    const img = new Image();
    img.decoding = 'async';
    img.dataset.url = url; // Save the URL for later

    // ONLY preload the first 30 frames to prevent network crashes
    if (i < 30) {
      img.src = url; 
    }
    
    return img;
  });
}
