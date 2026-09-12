import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
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
    expect(fixture.nativeElement.textContent).toContain('Paris -> Abidjan');
    expect(fixture.nativeElement.textContent).toContain('5 - 15 €/kg');
  });

  it('renders empty state', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Vous n'avez aucune alerte active");
  });

  it('deletes an alert', () => {
    component.alerts = [{ id: 7, departure: 'Paris', destination: 'Abidjan' }];

    component.deleteAlert(component.alerts[0]);

    expect(tripAlertServiceMock.deleteAlert).toHaveBeenCalledOnceWith(7);
    expect(component.alerts).toEqual([]);
  });

  it('shows an error when deletion fails', () => {
    tripAlertServiceMock.deleteAlert.and.returnValue(throwError(() => new Error('failed')));
    component.alerts = [{ id: 7, departure: 'Paris', destination: 'Abidjan' }];

    component.deleteAlert(component.alerts[0]);

    expect(component.actionError).toContain('Impossible de supprimer');
    expect(component.deletingAlertId).toBeNull();
  });
});
