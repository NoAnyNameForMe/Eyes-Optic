export function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) {
      return reject(new Error('Invalid data URL'));
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      return reject(new Error('Could not parse MIME type from data URL'));
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    resolve(new File([u8arr], filename, { type: mime }));
  });
}
