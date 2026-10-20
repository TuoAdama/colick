import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { Location } from '../../models/location.model';
import { ParcelRequestService } from '../../services/parcel-request.service';

@Component({
  selector: 'app-parcel-request-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent],
  templateUrl: './parcel-request-form-page.component.html',
})
export class ParcelRequestFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly parcelRequestService = inject(ParcelRequestService);

  departure: Location | null = null;
  destination: Location | null = null;
  departureQuery = '';
  destinationQuery = '';
  desiredDate = '';
  packageTitle = '';
  weight: number | null = null;
  description = '';
  selectedPhotoFile: File | null = null;
  selectedPhotoName = '';

  requestId: number | null = null;
  existingPhotoUrl = '';
  isLoading = false;
  loadError = '';
  editable = true;
  savedRequestId: number | null = null;
  isSubmitting = false;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap?.get('id');
    if (id) {
      this.requestId = Number(id);
      this.loadRequest();
      return;
    }
    const from = this.route.snapshot.queryParamMap.get('from')?.trim() ?? '';
    const to = this.route.snapshot.queryParamMap.get('to')?.trim() ?? '';
    const date = this.route.snapshot.queryParamMap.get('date')?.trim() ?? '';

    this.departureQuery = from;
    this.destinationQuery = to;
    this.desiredDate = date;
    if (from) {
      this.departure = this.createLocationFromQuery(from);
    }
    if (to) {
      this.destination = this.createLocationFromQuery(to);
    }
  }

  get isFormValid(): boolean {
    return this.editable && !this.isLoading && !this.loadError && !!this.departure
      && !!this.destination
      && this.packageTitle.trim().length > 0
      && this.weight !== null
      && this.weight >= 0.1;
  }

  onDepartureSelected(location: Location): void {
    this.departure = location;
  }

  onDestinationSelected(location: Location): void {
    this.destination = location;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedPhotoFile = file;
    this.selectedPhotoName = file?.name ?? '';
  }

  loadRequest(): void {
    if (!this.requestId || !Number.isSafeInteger(this.requestId) || this.requestId <= 0) {
      this.loadError = 'Ce besoin est introuvable.';
      return;
    }
    this.isLoading = true;
    this.loadError = '';
    this.parcelRequestService.getMyRequest(this.requestId).subscribe({
      next: (request) => {
        this.isLoading = false;
        this.editable = request.status === 'ACTIVE';
        this.departureQuery = request.departure;
        this.destinationQuery = request.destination;
        this.departure = this.createLocationFromQuery(request.departure);
        this.destination = this.createLocationFromQuery(request.destination);
        this.desiredDate = request.desiredDate ?? '';
        this.packageTitle = request.packageTitle;
        this.weight = request.weight;
        this.description = request.description ?? '';
        this.existingPhotoUrl = request.packagePhotoUrl ?? '';
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = error.status === 404 ? 'Ce besoin est introuvable.' : 'Impossible de charger ce besoin.';
      },
    });
  }

  retryPhoto(): void {
    if (this.savedRequestId === null || !this.selectedPhotoFile || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.uploadSavedPhoto();
  }

  private uploadSavedPhoto(): void {
    if (this.savedRequestId === null || !this.selectedPhotoFile) return;
    this.parcelRequestService.uploadPhoto(this.savedRequestId, this.selectedPhotoFile).subscribe({
      next: () => this.finish(),
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Le besoin est enregistré, mais la photo n’a pas pu être envoyée. Vous pouvez réessayer.';
      },
    });
  }

  private finish(): void {
    if (this.requestId) void this.router.navigate(['/parcel-requests', this.requestId]);
    else void this.router.navigate(['/parcel-requests'], { queryParams: { tab: 'mine' } });
  }

  submit(): void {
    if (this.isSubmitting || this.savedRequestId !== null) return;
    if (!this.isFormValid || !this.departure || !this.destination || this.weight === null) {
      this.errorMessage = 'Veuillez renseigner les informations obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const body = {
      departure: this.departure.name,
      destination: this.destination.name,
      desiredDate: this.desiredDate || undefined,
      packageTitle: this.packageTitle.trim(),
      weight: this.weight,
      description: this.description.trim() || undefined,
    };
    const operation = this.requestId
      ? this.parcelRequestService.updateRequest(this.requestId, body)
      : this.parcelRequestService.createRequest(body);
    operation.subscribe({
      next: (saved) => {
        this.savedRequestId = saved.id;
        if (this.selectedPhotoFile) this.uploadSavedPhoto();
        else this.finish();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = this.requestId ? 'Impossible de modifier ce besoin pour le moment.' : 'Impossible de publier votre demande pour le moment.';
      },
    });
  }

  cancelAfterSave(): void { if (!this.isSubmitting) this.finish(); }

  cancel(): void {
    if (this.requestId) void this.router.navigate(['/parcel-requests', this.requestId]);
    else void this.router.navigate(['/search']);
  }

  private createLocationFromQuery(name: string): Location {
    return {
      id: 0,
      name,
      country: '',
      isoCode: '',
      type: 'CITY',
    };
  }
}
