import { TestBed } from '@angular/core/testing';
import { Turnstile, TurnstileLoaderService } from './turnstile-loader.service';

describe('TurnstileLoaderService', () => {
  const browser = window as Window & { turnstile?: Turnstile; onColiclicTurnstileLoad?: () => void };
  let loader: TurnstileLoaderService;
  let appendScript: jasmine.Spy;

  beforeEach(() => {
    loader = TestBed.inject(TurnstileLoaderService);
    appendScript = spyOn(document.head, 'append');
  });

  afterEach(() => {
    delete browser.turnstile;
    delete browser.onColiclicTurnstileLoad;
  });

  it('shares the async load and resolves when Cloudflare calls its onload callback', async () => {
    const loading = loader.load();
    expect(loader.load()).toBe(loading);
    expect(appendScript).toHaveBeenCalledTimes(1);
    const script: HTMLScriptElement = appendScript.calls.mostRecent().args[0];
    expect(script.async).toBeTrue();
    expect(new URL(script.src).searchParams.get('onload')).toBe('onColiclicTurnstileLoad');
    expect(script.onload).toBeNull();

    const api = jasmine.createSpyObj<Turnstile>('Turnstile', ['render', 'reset', 'remove']);
    browser.turnstile = api;
    browser.onColiclicTurnstileLoad!();

    expect(await loading).toBe(api);
    expect(browser.onColiclicTurnstileLoad).toBeUndefined();
  });

  it('clears the callback after a script error and can retry', async () => {
    const loading = loader.load();
    const failedScript: HTMLScriptElement = appendScript.calls.mostRecent().args[0];
    const removeScript = spyOn(failedScript, 'remove');
    failedScript.dispatchEvent(new Event('error'));
    await expectAsync(loading).toBeRejectedWithError('Turnstile could not be loaded');
    expect(removeScript).toHaveBeenCalled();
    expect(browser.onColiclicTurnstileLoad).toBeUndefined();

    const retry = loader.load();
    const retryScript: HTMLScriptElement = appendScript.calls.mostRecent().args[0];
    expect(retryScript).not.toBe(failedScript);
    retryScript.dispatchEvent(new Event('error'));
    await expectAsync(retry).toBeRejected();
  });
});
