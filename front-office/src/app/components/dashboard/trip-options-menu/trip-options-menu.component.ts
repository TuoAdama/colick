import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

@Component({
  selector: 'app-trip-options-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-options-menu.component.html',
})
export class TripOptionsMenuComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input({ required: true }) tripId!: number;
  @Input({ required: true }) tripLabel!: string;
  @Input() canDownload = false;
  @Input() canComplete = false;
  @Input() isDownloading = false;
  @Input() isCompleting = false;

  @Output() downloadPng = new EventEmitter<number>();
  @Output() completeTrip = new EventEmitter<number>();

  isOpen = false;

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
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
}
