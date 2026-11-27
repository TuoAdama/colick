import { DefaultUrlSerializer, Router } from '@angular/router';

const urlSerializer = new DefaultUrlSerializer();
const controlCharacters = /[\u0000-\u001f\u007f-\u009f]/;

export function readAuthReturnUrl(value: string | null): string | undefined {
  if (!value?.startsWith('/') || value.includes('\\') || controlCharacters.test(value)) {
    return undefined;
  }

  try {
    const decoded = decodeURIComponent(value);
    const path = decodeURIComponent(value.split(/[?#]/, 1)[0]);
    if (path.includes('//') || path.includes('\\') || controlCharacters.test(decoded)) {
      return undefined;
    }

    urlSerializer.parse(value);
    return value;
  } catch {
    return undefined;
  }
}

export async function navigateAfterAuth(router: Router, returnUrl?: string): Promise<void> {
  if (returnUrl) {
    const navigated = await router.navigateByUrl(returnUrl);
    if (!navigated || router.url !== '/404') return;
  }

  await router.navigate(['/search']);
}
