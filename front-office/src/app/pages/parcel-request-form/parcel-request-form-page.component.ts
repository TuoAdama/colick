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

  isSubmitting = false;
  errorMessage = '';

  ngOnInit(): void {
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
    return !!this.departure
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

  submit(): void {
    if (!this.isFormValid || !this.departure || !this.destination || this.weight === null) {
      this.errorMessage = 'Veuillez renseigner les informations obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.parcelRequestService.createRequest({
      departure: this.departure.name,
      destination: this.destination.name,
      desiredDate: this.desiredDate || undefined,
      packageTitle: this.packageTitle.trim(),
      weight: this.weight,
      description: this.description.trim() || undefined,
    }).subscribe({
      next: (createdRequest) => {
        if (!this.selectedPhotoFile) {
          void this.router.navigate(['/parcel-requests'], { queryParams: { tab: 'mine' } });
          return;
        }
        this.parcelRequestService.uploadPhoto(createdRequest.id, this.selectedPhotoFile).subscribe({
          next: () => void this.router.navigate(['/parcel-requests'], { queryParams: { tab: 'mine' } }),
          error: () => {
            this.isSubmitting = false;
            this.errorMessage = 'La demande est publiee, mais la photo n’a pas pu etre envoyee.';
          },
        });
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Impossible de publier votre demande pour le moment.';
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/search']);
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
