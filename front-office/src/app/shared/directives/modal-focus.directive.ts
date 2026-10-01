import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keeps keyboard focus inside a modal dialog and restores its trigger on close.
 */
@Directive({
  selector: '[appModalFocus]',
  standalone: true,
})
export class ModalFocusDirective implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private previouslyFocusedElement: HTMLElement | null = null;
  private destroyed = false;

  /** CSS selector for the element that receives focus when the dialog opens. */
  @Input('appModalFocus') initialFocusSelector = '';

  ngAfterViewInit(): void {
    const activeElement = this.document.activeElement;
    this.previouslyFocusedElement = activeElement instanceof HTMLElement ? activeElement : null;

    queueMicrotask(() => {
      if (!this.destroyed) {
        this.focusInitialElement();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.previouslyFocusedElement?.isConnected) {
      this.previouslyFocusedElement.focus();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = this.getFocusableElements();
    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = this.document.activeElement;

    if (!this.elementRef.nativeElement.contains(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? lastElement : firstElement).focus();
    } else if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private focusInitialElement(): void {
    const initialElement = this.findInitialElement();
    (initialElement ?? this.getFocusableElements()[0])?.focus();
  }

  private findInitialElement(): HTMLElement | null {
    if (!this.initialFocusSelector) {
      return null;
    }

    try {
      const element = this.elementRef.nativeElement.querySelector<HTMLElement>(this.initialFocusSelector);
      return element && this.isFocusable(element) ? element : null;
    } catch {
      return null;
    }
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(this.elementRef.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((element) => this.isFocusable(element));
  }

  private isFocusable(element: HTMLElement): boolean {
    return !element.hasAttribute('disabled')
      && !element.hasAttribute('hidden')
      && element.tabIndex >= 0;
  }
}
