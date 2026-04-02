import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { LocationService } from '../../../services/location.service';
import { Location } from '../../../models/location.model';

/**
 * AutocompleteComponent - Reusable auto-complete input with debounced search.
 * Fetches location suggestions from the API and allows keyboard navigation.
 */
@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autocomplete.component.html',
})
export class AutocompleteComponent implements OnInit, OnDestroy {
  /** Label text displayed above the input */
  @Input() label = '';

  /** Placeholder text for the input field */
  @Input() placeholder = '';

  /** SVG path for the icon displayed in the input */
  @Input() icon = '';

  /** Emits the selected location */
  @Output() selected = new EventEmitter<Location>();

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  private readonly locationService = inject(LocationService);

  /** Current search query text */
  query = '';

  /** List of location suggestions from the API */
  suggestions: Location[] = [];

  /** Whether the dropdown is visible */
  isOpen = false;

  /** Whether a search request is in progress */
  isLoading = false;

  /** Index of the currently highlighted suggestion (-1 = none) */
  highlightedIndex = -1;

  /** Whether a location has been selected */
  hasSelected = false;

  private readonly searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.isLoading = true;
          this.highlightedIndex = -1;
        }),
        switchMap((query) => {
          if (query.length < 2) {
            return of([]);
          }
          return this.locationService.searchLocations(query).pipe(
            catchError(() => of([]))
          );
        })
      )
      .subscribe((results) => {
        this.suggestions = results;
        this.isLoading = false;
        this.isOpen = results.length > 0;
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  /**
   * Handle input changes — trigger debounced search
   */
  onInputChange(): void {
    this.hasSelected = false;
    this.searchSubject.next(this.query);
    if (this.query.length < 2) {
      this.suggestions = [];
      this.isOpen = false;
    }
  }

  /**
   * Handle keyboard navigation in the dropdown
   */
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen || this.suggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(
          this.highlightedIndex + 1,
          this.suggestions.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0) {
          this.selectLocation(this.suggestions[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  /**
   * Select a location from the dropdown
   */
  selectLocation(location: Location): void {
    this.query = `${location.name}, ${location.country}`;
    this.hasSelected = true;
    this.close();
    this.selected.emit(location);
  }

  /**
   * Close the dropdown
   */
  close(): void {
    this.isOpen = false;
    this.highlightedIndex = -1;
  }

  /**
   * Show the dropdown when input gains focus (if we have suggestions)
   */
  onFocus(): void {
    if (this.suggestions.length > 0 && !this.hasSelected) {
      this.isOpen = true;
    }
  }

  /**
   * Close dropdown when clicking outside the component
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!this.inputRef?.nativeElement?.closest('.autocomplete-wrapper')?.contains(target)) {
      this.close();
    }
  }
}
