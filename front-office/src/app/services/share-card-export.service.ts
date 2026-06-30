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
    const blob = await htmlToImage.toBlob(element, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: '#ffffff',
    });

    if (!blob) {
      throw new Error('Unable to generate PNG blob');
    }

    return new File([blob], filename, { type: 'image/png' });
  }

  async shareOrDownloadPng(file: File, options: ShareCardShareOptions): Promise<'shared' | 'downloaded'> {
    const sharePayload: ShareData = {
      title: options.title,
      text: options.text,
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
}
