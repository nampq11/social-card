import { toBlob, toPng } from 'html-to-image';

export async function copyCardToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    // 2x or 3x pixel ratio for retina sharpness (matching 2048px original)
    const blob = await toBlob(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      quality: 1,
      style: {
        transform: 'none',
      },
    });

    if (!blob) {
      throw new Error('Could not generate image blob');
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);

    return true;
  } catch (error) {
    console.error('[DEBUG] Failed to copy card to clipboard:', error);
    throw error;
  }
}

export async function downloadCardImage(
  element: HTMLElement,
  filename = 'social-card.png'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      quality: 1,
      style: {
        transform: 'none',
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('[DEBUG] Failed to download card image:', error);
    throw error;
  }
}
