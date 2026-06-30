import { Injectable } from '@angular/core';
import * as htmlToImage from 'html-to-image';
import QRCode from 'qrcode';

export interface ShareCardShareOptions {
  title: string;
  text: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShareCardExportService {
  async generateQrCodeDataUrl(content: string): Promise<string | null> {
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      return null;
    }

    return QRCode.toDataURL(normalizedContent, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 420,
      color: {
        dark: '#0A0A0A',
        light: '#FFFFFF',
      },
    });
  }

  async captureElementAsPngFile(element: HTMLElement, filename: string): Promise<File> {
    const captureTarget = this.resolveCaptureTarget(element);
    const rect = captureTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      throw new Error('Share card capture element has no renderable size');
    }

    await this.waitForRenderableAssets(captureTarget);

    const pngDataUrl = await htmlToImage.toPng(captureTarget, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: '#ffffff',
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      style: {
        left: '0',
        top: '0',
        position: 'static',
        transform: 'none',
        zIndex: '0',
      },
    });
    const blob = await (await fetch(pngDataUrl)).blob();

    if (!blob) {
      throw new Error('Unable to generate PNG blob');
    }

    return new File([blob], filename, { type: 'image/png' });
  }

  async shareOrDownloadPng(file: File, options: ShareCardShareOptions): Promise<'shared' | 'downloaded'> {
    const sharePayload: ShareData = {
      files: [file],
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(sharePayload))) {
      await navigator.share(sharePayload);
      return 'shared';
    }

    this.downloadFile(file);
    return 'downloaded';
  }

  downloadFile(file: File): void {
    const objectUrl = URL.createObjectURL(file);
    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = file.name;
    downloadLink.click();
    URL.revokeObjectURL(objectUrl);
  }

  private resolveCaptureTarget(element: HTMLElement): HTMLElement {
    return element.querySelector<HTMLElement>('[data-share-card-root]') ?? element;
  }

  private async waitForRenderableAssets(element: HTMLElement): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    if (document.fonts) {
      await document.fonts.ready;
    }

    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    }));
  }
}
