import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ParcelRequest } from '../../models/parcel-request.model';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { routeCity, routeCountry } from '../../shared/utils/sent-booking-presentation';

@Component({
  selector: 'app-parcel-request-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './parcel-request-detail-page.component.html',
  styleUrls: ['./parcel-request-detail-page.component.css'],
})
export class ParcelRequestDetailPageComponent implements OnInit {
  private readonly service = inject(ParcelRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadCancelled = new Subject<void>();
  private readonly changeDetector = inject(ChangeDetectorRef);
  @ViewChild('menuTrigger') menuTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuArea') menuArea?: ElementRef<HTMLElement>;
  request: ParcelRequest | null = null;
  isLoading = false;
  loadError = '';
  accessDenied = false;
  actionError = '';
  busy = false;
  menuOpen = false;
  confirmation: 'cancel' | 'remove' | null = null;
  readonly routeCity = routeCity;
  readonly routeCountry = routeCountry;
  get active(): boolean { return this.request?.status === 'ACTIVE'; }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => this.load(params.get('id')));
  }

  load(value = this.route.snapshot.paramMap.get('id')): void {
    this.loadCancelled.next();
    this.request = null;
    this.menuOpen = false;
    this.confirmation = null;
    this.busy = false;
    this.actionError = '';
    this.accessDenied = false;
    this.isLoading = false;
    const id = Number(value);
    this.loadError = '';
    if (!/^[1-9]\d*$/.test(value ?? '') || !Number.isSafeInteger(id)) {
      this.loadError = 'Ce besoin est introuvable.';
      return;
    }
    this.isLoading = true;
    this.service.getMyRequest(id).pipe(takeUntil(this.loadCancelled), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (request) => { this.request = request; this.isLoading = false; },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.accessDenied = error.status === 403;
        this.loadError = error.status === 404 ? 'Ce besoin est introuvable.'
          : error.status === 403 ? 'Vous ne pouvez pas consulter ce besoin.'
          : 'Impossible de charger ce besoin.';
      },
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.changeDetector.detectChanges();
      this.menuArea?.nativeElement.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  }

  closeMenu(restoreFocus = false): void {
    this.menuOpen = false;
    if (restoreFocus) this.menuTrigger?.nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  outsideClick(event: MouseEvent): void {
    if (this.menuOpen && !this.menuArea?.nativeElement.contains(event.target as Node)) this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  escape(): void { if (this.menuOpen) this.closeMenu(true); }

  @HostListener('document:focusin', ['$event'])
  focusChanged(event: FocusEvent): void {
    if (this.menuOpen && !this.menuArea?.nativeElement.contains(event.target as Node)) this.closeMenu();
  }

  menuKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(this.menuArea?.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = items.indexOf(this.document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
    items[next]?.focus();
  }

  ask(action: 'cancel' | 'remove'): void {
    if (this.busy || (action === 'cancel' && !this.active)) return;
    this.closeMenu(true);
    this.actionError = '';
    this.confirmation = action;
  }

  dismissConfirmation(): void { if (!this.busy) this.confirmation = null; }

  confirmAction(): void {
    if (!this.request || !this.confirmation || this.busy) return;
    const action = this.confirmation;
    this.busy = true;
    this.actionError = '';
    const operation = action === 'remove' ? this.service.removeRequest(this.request.id) : this.service.cancelRequest(this.request.id);
    operation.pipe(takeUntil(this.loadCancelled), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy = false;
        this.confirmation = null;
        if (action === 'remove') void this.router.navigate(['/parcel-requests']);
        else if (this.request) this.request = { ...this.request, status: 'CANCELLED' };
      },
      error: () => { this.busy = false; this.actionError = 'Impossible de réaliser cette action. Veuillez réessayer.'; },
    });
  }

  closeRequest(): void {
    if (!this.request || !this.active || this.busy) return;
    this.busy = true;
    this.actionError = '';
    this.service.closeRequest(this.request.id).pipe(takeUntil(this.loadCancelled), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (request) => { this.request = request; this.busy = false; },
      error: () => { this.busy = false; this.actionError = 'Impossible de fermer ce besoin. Veuillez réessayer.'; },
    });
  }

  statusLabel(status: ParcelRequest['status']): string {
    return { ACTIVE: 'Active', CLOSED: 'Fermée', CANCELLED: 'Annulée' }[status];
  }

  dateLabel(value?: string): string {
    if (!value) return 'Date flexible';
    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
