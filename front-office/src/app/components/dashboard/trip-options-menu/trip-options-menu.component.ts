import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-trip-options-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-options-menu.component.html',
})
export class TripOptionsMenuComponent {
  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  @Input({ required: true }) tripId!: number;
  @Input({ required: true }) tripLabel!: string;
  @Input() canDownload = false;
  @Input() canComplete = false;
  @Input() canCancel = false;
  @Input() isDownloading = false;
  @Input() isCompleting = false;
  @Input() appearance: 'default' | 'minimal' = 'default';
  @Input() verticalPosition: 'bottom' | 'top' = 'bottom';

  @Output() downloadPng = new EventEmitter<number>();
  @Output() completeTrip = new EventEmitter<number>();
  @Output() cancelTrip = new EventEmitter<number>();

  isOpen = false;
  menuStyles: Record<string, string> = { visibility: 'hidden' };

  toggleMenu(event: Event): void {
    event.stopPropagation();

    if (this.isOpen) {
      this.closeMenu();
      return;
    }

    // Render the panel (hidden) so its dimensions can be measured.
    this.menuStyles = { visibility: 'hidden' };
    this.isOpen = true;
    this.cdr.detectChanges();

    // Compute and apply the position now that the panel is in the DOM.
    this.updateMenuPosition();
    this.cdr.detectChanges();
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  onDownload(event: Event): void {
    event.stopPropagation();

    if (!this.canDownload || this.isDownloading) {
      return;
    }

    this.downloadPng.emit(this.tripId);
    this.closeMenu();
  }

  onComplete(event: Event): void {
    event.stopPropagation();

    if (!this.canComplete || this.isCompleting) {
      return;
    }

    this.completeTrip.emit(this.tripId);
    this.closeMenu();
  }

  onCancel(event: Event): void {
    event.stopPropagation();

    if (!this.canCancel) {
      return;
    }

    this.cancelTrip.emit(this.tripId);
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) {
      return;
    }

    const target = event.target as Node | null;

    if (target && this.elementRef.nativeElement.contains(target)) {
      return;
    }

    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isOpen) {
      return;
    }

    this.updateMenuPosition();
    this.cdr.detectChanges();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event): void {
    if (!this.isOpen) {
      return;
    }

    // Ignore scroll events that originate from inside the menu panel itself.
    const menuPanel = this.elementRef.nativeElement.querySelector('[role="menu"]');
    if (menuPanel instanceof HTMLElement && menuPanel.contains(event.target as Node)) {
      return;
    }

    this.updateMenuPosition();
    this.cdr.detectChanges();
  }

  private updateMenuPosition(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const triggerButton = this.elementRef.nativeElement.querySelector('button[aria-haspopup="menu"]');
    const menuPanel = this.elementRef.nativeElement.querySelector('[role="menu"]');

    if (!(triggerButton instanceof HTMLElement) || !(menuPanel instanceof HTMLElement)) {
      return;
    }

    const triggerRect = triggerButton.getBoundingClientRect();
    const menuWidth = menuPanel.offsetWidth || 224;
    const menuHeight = menuPanel.offsetHeight || 0;
    const viewportPadding = 12;
    const panelOffset = 8;
    const preferredTop = this.verticalPosition === 'top';
    const spaceAbove = triggerRect.top - viewportPadding;
    const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
    const shouldOpenAbove = preferredTop
      ? spaceAbove >= menuHeight || spaceAbove > spaceBelow
      : spaceBelow < menuHeight && spaceAbove > spaceBelow;

    const left = Math.min(
      Math.max(viewportPadding, triggerRect.right - menuWidth),
      Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding),
    );

    const top = shouldOpenAbove
      ? Math.max(viewportPadding, triggerRect.top - menuHeight - panelOffset)
      : Math.min(window.innerHeight - menuHeight - viewportPadding, triggerRect.bottom + panelOffset);

    this.menuStyles = {
      left: `${left}px`,
      top: `${Math.max(viewportPadding, top)}px`,
    };
  }
}
