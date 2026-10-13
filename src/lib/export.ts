import { toBlob, toPng } from 'html-to-image';
import { EXPORT_PIXEL_RATIO } from '../constants/ratios';
import { logDebug } from './log-debug';

// Shared render settings so clipboard and file exports produce identical images.
const EXPORT_IMAGE_OPTIONS = {
  pixelRatio: EXPORT_PIXEL_RATIO,
  cacheBust: true,
  quality: 1,
  style: {
    transform: 'none',
  },
};

export async function copyCardToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const blob = await toBlob(element, EXPORT_IMAGE_OPTIONS);

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
    logDebug('copyCardToClipboard', 'failed to copy card image to clipboard', error);
    throw error;
  }
}

export async function downloadCardImage(
  element: HTMLElement,
  filename = 'social-card.png'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, EXPORT_IMAGE_OPTIONS);

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    logDebug('downloadCardImage', `failed to download card image as "${filename}"`, error);
    throw error;
  }
}
