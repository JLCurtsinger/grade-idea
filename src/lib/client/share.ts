export function xShare(url: string, text: string) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function liShare(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export async function copyText(s: string) {
  try { 
    await navigator.clipboard.writeText(s); 
    return true; 
  } catch { 
    return false; 
  }
}
