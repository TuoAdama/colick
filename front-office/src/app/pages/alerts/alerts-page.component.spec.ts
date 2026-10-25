import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TripAlert } from '../../models/trip-alert.model';
import { AlertsPageComponent } from './alerts-page.component';
import { AuthService } from '../../services/auth.service';
import { TripAlertService } from '../../services/trip-alert.service';

describe('AlertsPageComponent', () => {
  let fixture: ComponentFixture<AlertsPageComponent>;
  let component: AlertsPageComponent;
  let router: Router;

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
  };

  const tripAlertServiceMock = {
    getMyAlerts: jasmine.createSpy('getMyAlerts').and.returnValue(of([])),
    deleteAlert: jasmine.createSpy('deleteAlert').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: TripAlertService, useValue: tripAlertServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(window, 'confirm').and.returnValue(true);
    authServiceMock.isLoggedIn.and.returnValue(true);
    tripAlertServiceMock.getMyAlerts.calls.reset();
    tripAlertServiceMock.getMyAlerts.and.returnValue(of([]));
    tripAlertServiceMock.deleteAlert.calls.reset();
    tripAlertServiceMock.deleteAlert.and.returnValue(of(void 0));
  });

  it('redirects unauthenticated users to login', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);

    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(tripAlertServiceMock.getMyAlerts).not.toHaveBeenCalled();
  });

  it('loads alerts', () => {
    tripAlertServiceMock.getMyAlerts.and.returnValue(of([
      {
        id: 1,
        departure: 'Paris',
        destination: 'Abidjan',
        date: '2026-06-20',
        minPrice: 5,
        maxPrice: 15,
        createdAt: '2026-06-16T10:00:00',
      },
    ]));

    fixture.detectChanges();

    expect(component.alerts.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Paris → Abidjan');
    expect(fixture.nativeElement.textContent).toContain('5 - 15 €/kg');
  });

  it('renders empty state', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Vous n’avez aucune alerte active");
  });

  it('deletes an alert', () => {
    component.alerts = [{ id: 7, departure: 'Paris', destination: 'Abidjan' }];

    component.deleteAlert(component.alerts[0]);
    component.confirmDeleteAlert();

    expect(tripAlertServiceMock.deleteAlert).toHaveBeenCalledOnceWith(7);
    expect(component.alerts).toEqual([]);
  });

  it('shows an error when deletion fails', () => {
    tripAlertServiceMock.deleteAlert.and.returnValue(throwError(() => new Error('failed')));
    component.alerts = [{ id: 7, departure: 'Paris', destination: 'Abidjan' }];

    component.deleteAlert(component.alerts[0]);
    component.confirmDeleteAlert();

    expect(component.deleteError).toContain('Impossible de supprimer');
    expect(component.deletingAlertId).toBeNull();
  });

  function renderAlerts(alerts: TripAlert[]): void {
    tripAlertServiceMock.getMyAlerts.and.returnValue(of(alerts));
    fixture.detectChanges();
  }

  it('leaves the main landmark to the application shell', () => {
    renderAlerts([{ id: 1, departure: 'Nantes', destination: 'Abidjan' }]);

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('main, [role="main"]')).toBeNull();
    expect(page.querySelector('h1')?.textContent).toBe('Mes alertes');
    expect(page.querySelector('section[aria-label="Mes recherches sauvegardées"]')).not.toBeNull();
  });

  it('renders the chosen layout and default criteria without missing creation metadata', () => {
    renderAlerts([{ id: 1, departure: 'Nantes', destination: 'Abidjan' }]);

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h1')?.textContent).toBe('Mes alertes');
    expect(page.textContent).toContain('Retrouvez vos recherches sauvegardées.');
    expect(page.querySelector('header a')?.getAttribute('href')).toBe('/search');
    const card = page.querySelector('article')!;
    expect(card.textContent).toContain('Nantes → Abidjan');
    expect(card.textContent).toContain('Active');
    expect(card.textContent).toContain('Toutes dates');
    expect(card.textContent).toContain('Tous prix');
    expect(card.textContent).not.toContain('Créée le');
    expect(card.querySelector('button')?.getAttribute('aria-label'))
      .toBe('Supprimer l’alerte Nantes vers Abidjan');
  });

  it('renders supplied criteria and preserves all search parameters in the consultation link', () => {
    const alert: TripAlert = {
      id: 1, departure: 'Nantes', destination: 'Abidjan', date: '2026-09-20',
      minPrice: 5, maxPrice: 15, sort: 'date_asc', createdAt: '2026-09-14T17:24:00',
    };
    renderAlerts([alert]);

    const card: HTMLElement = fixture.nativeElement.querySelector('article');
    expect(card.textContent).toContain(component.dateLabel(alert.date));
    expect(card.textContent).toContain('5 - 15 €/kg');
    expect(card.textContent).toContain('Créée le ' + component.createdAtLabel(alert.createdAt));
    const link = card.querySelector('a')!;
    expect(link.textContent).toContain('Voir les trajets');
    const url = new URL(link.getAttribute('href')!, 'http://localhost');
    expect(url.pathname).toBe('/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      from: 'Nantes', to: 'Abidjan', date: '2026-09-20', sort: 'date_asc',
      minPrice: '5', maxPrice: '15',
    });
  });

  it('uses the default search sort and omits absent filters', () => {
    renderAlerts([{ id: 1, departure: 'Nantes', destination: 'Abidjan' }]);

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('article a');
    const url = new URL(link.getAttribute('href')!, 'http://localhost');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      from: 'Nantes', to: 'Abidjan', sort: 'price_asc',
    });
  });

  it('formats one-sided prices, including zero, with French accents', () => {
    expect(component.priceLabel({ id: 1, departure: 'A', destination: 'B', minPrice: 0 }))
      .toBe('Dès 0 €/kg');
    expect(component.priceLabel({ id: 1, departure: 'A', destination: 'B', maxPrice: 12 }))
      .toBe('Jusqu’à 12 €/kg');
  });

  it('omits invalid creation dates', () => {
    renderAlerts([{ id: 1, departure: 'Nantes', destination: 'Abidjan', createdAt: 'invalid' }]);

    expect(fixture.nativeElement.querySelector('article').textContent).not.toContain('Créée le');
  });

  it('announces loading without showing an empty state', () => {
    const response = new Subject<TripAlert[]>();
    tripAlertServiceMock.getMyAlerts.and.returnValue(response);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('section').getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Chargement');
    expect(fixture.nativeElement.textContent).not.toContain('aucune alerte');
    response.next([]);
    response.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('aucune alerte');
  });

  it('reports a load failure without claiming there are no alerts', () => {
    tripAlertServiceMock.getMyAlerts.and.returnValue(throwError(() => new Error('failed')));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('Impossible de charger');
    expect(fixture.nativeElement.textContent).not.toContain('aucune alerte');
  });

  function openDeleteModal(): HTMLButtonElement {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('article button');
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    return trigger;
  }

  function modalConfirmButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[role="dialog"] button:not([data-testid])');
  }

  it('asks for confirmation without sending a delete request', async () => {
    renderAlerts([{ id: 7, departure: 'Nantes', destination: 'Abidjan' }]);
    openDeleteModal();
    await fixture.whenStable();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('Supprimer cette alerte ?');
    expect(dialog.textContent).toContain('Nantes → Abidjan');
    expect(modalConfirmButton().textContent).toContain('Supprimer');
    expect(document.activeElement).toBe(dialog.querySelector('[data-testid="confirm-modal-cancel"]'));
    expect(window.confirm).not.toHaveBeenCalled();
    expect(tripAlertServiceMock.deleteAlert).not.toHaveBeenCalled();
    expect(component.alerts.length).toBe(1);
  });

  it('cancels deletion and restores focus to the trash button', async () => {
    renderAlerts([{ id: 7, departure: 'Nantes', destination: 'Abidjan' }]);
    const trigger = openDeleteModal();
    await fixture.whenStable();

    fixture.nativeElement.querySelector('[data-testid="confirm-modal-cancel"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(component.alertToDelete).toBeNull();
    expect(tripAlertServiceMock.deleteAlert).not.toHaveBeenCalled();
    expect(component.alerts.length).toBe(1);
  });

  for (const dismissal of ['Escape', 'backdrop']) {
    it('dismisses confirmation through ' + dismissal + ' without deleting', () => {
      renderAlerts([{ id: 7, departure: 'Nantes', destination: 'Abidjan' }]);
      openDeleteModal();
      const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
      if (dismissal === 'Escape') {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      } else {
        dialog.click();
      }
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
      expect(tripAlertServiceMock.deleteAlert).not.toHaveBeenCalled();
    });
  }

  it('shows deletion progress, prevents duplicate requests and renders empty state after deletion', () => {
    const response = new Subject<void>();
    tripAlertServiceMock.deleteAlert.and.returnValue(response);
    renderAlerts([{ id: 7, departure: 'Nantes', destination: 'Abidjan' }]);
    const trigger = openDeleteModal();
    modalConfirmButton().click();
    fixture.detectChanges();

    expect(trigger.disabled).toBeTrue();
    expect(trigger.getAttribute('aria-busy')).toBe('true');
    expect(modalConfirmButton().disabled).toBeTrue();
    expect(modalConfirmButton().textContent).toContain('Suppression…');
    expect(fixture.nativeElement.querySelector('[data-testid="confirm-modal-cancel"]').disabled).toBeTrue();
    component.confirmDeleteAlert();
    component.deleteAlert({ id: 8, departure: 'Paris', destination: 'Dakar' });
    component.cancelDeleteAlert();
    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    dialog.click();
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(component.alertToDelete?.id).toBe(7);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(tripAlertServiceMock.deleteAlert).toHaveBeenCalledOnceWith(7);

    response.next();
    response.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('article')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('aucune alerte');
  });

  it('keeps the selected alert and allows retrying inside the modal when deletion fails', () => {
    tripAlertServiceMock.deleteAlert.and.returnValue(throwError(() => new Error('failed')));
    renderAlerts([{ id: 7, departure: 'Nantes', destination: 'Abidjan' }]);
    openDeleteModal();
    modalConfirmButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"] [role="alert"]').textContent)
      .toContain('Impossible de supprimer');
    expect(modalConfirmButton().disabled).toBeFalse();
    expect(component.alerts.length).toBe(1);
    tripAlertServiceMock.deleteAlert.and.returnValue(of(void 0));
    modalConfirmButton().click();
    fixture.detectChanges();
    expect(tripAlertServiceMock.deleteAlert).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(component.alerts).toEqual([]);
  });

  it('deletes only the selected alert and clears an old modal error on reopening', () => {
    renderAlerts([
      { id: 7, departure: 'Nantes', destination: 'Abidjan' },
      { id: 8, departure: 'Paris', destination: 'Dakar' },
    ]);
    component.deleteAlert(component.alerts[0]);
    component.deleteError = 'Previous failure';
    component.cancelDeleteAlert();
    component.confirmDeleteAlert();
    expect(tripAlertServiceMock.deleteAlert).not.toHaveBeenCalled();
    component.deleteAlert(component.alerts[1]);
    fixture.detectChanges();
    expect(component.deleteError).toBe('');
    expect(fixture.nativeElement.querySelector('[role="dialog"]').textContent).toContain('Paris → Dakar');
    modalConfirmButton().click();
    fixture.detectChanges();
    expect(tripAlertServiceMock.deleteAlert).toHaveBeenCalledOnceWith(8);
    expect(component.alerts.map(alert => alert.id)).toEqual([7]);
  });
});
