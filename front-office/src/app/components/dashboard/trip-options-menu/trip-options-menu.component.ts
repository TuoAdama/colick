import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-trip-options-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-options-menu.component.html',
})
export class TripOptionsMenuComponent implements AfterViewChecked {
  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  @ViewChild('triggerButton') private triggerButton?: ElementRef<HTMLElement>;
  @ViewChild('menuPanel') private menuPanel?: ElementRef<HTMLElement>;

  @Input({ required: true }) tripId!: number;
  @Input({ required: true }) tripLabel!: string;
  @Input() canDownload = false;
  @Input() canDelete = false;
  @Input() canComplete = false;
  @Input() canCancel = false;
  @Input() isDownloading = false;
  @Input() isDeleting = false;
  @Input() isCompleting = false;
  @Input() appearance: 'default' | 'minimal' = 'default';
  @Input() showDeleteOption = false;

  @Output() downloadPng = new EventEmitter<number>();
  @Output() deleteTrip = new EventEmitter<number>();
  @Output() completeTrip = new EventEmitter<number>();
  @Output() cancelTrip = new EventEmitter<number>();

  isOpen = false;
  menuStyles: Record<string, string> = { top: '-9999px', left: '-9999px' };

  private pendingPositionUpdate = false;

  ngAfterViewChecked(): void {
    if (this.pendingPositionUpdate && this.menuPanel && this.triggerButton) {
      this.pendingPositionUpdate = false;
      this.updateMenuPosition();
      this.cdr.detectChanges();
    }
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();

    if (this.isOpen) {
      this.closeMenu();
      return;
    }

    this.menuStyles = { top: '-9999px', left: '-9999px' };
    this.isOpen = true;
    this.pendingPositionUpdate = true;
  }

  closeMenu(): void {
    this.isOpen = false;
    this.pendingPositionUpdate = false;
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

  onDelete(event: Event): void {
    event.stopPropagation();

    if (!this.canDelete || this.isDeleting) {
      return;
    }

    this.deleteTrip.emit(this.tripId);
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
    if (this.isOpen) {
      this.updateMenuPosition();
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event): void {
    if (!this.isOpen) {
      return;
    }

    const menuPanel = this.menuPanel?.nativeElement;
    if (menuPanel?.contains(event.target as Node)) {
      return;
    }

    this.updateMenuPosition();
  }

  private updateMenuPosition(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const triggerEl = this.triggerButton?.nativeElement;
    const panelEl = this.menuPanel?.nativeElement;

    if (!triggerEl || !panelEl) {
      return;
    }

    const triggerRect = triggerEl.getBoundingClientRect();
    const menuWidth = panelEl.offsetWidth || 224;
    const menuHeight = panelEl.offsetHeight || 0;
    const viewportPadding = 12;
    const panelOffset = 8;

    const spaceAbove = triggerRect.top - viewportPadding;
    const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
    const shouldOpenAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;

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
