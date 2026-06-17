import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let routerEvents: Subject<NavigationEnd>;
  let routerMock: { url: string; events: Subject<NavigationEnd> };

  beforeEach(async () => {
    routerEvents = new Subject<NavigationEnd>();
    routerMock = {
      url: '/',
      events: routerEvents,
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: Router, useValue: routerMock }],
    })
      .overrideComponent(AppComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('keeps shared marketing chrome on public pages', () => {
    expect(fixture.componentInstance.showSharedChrome).toBeTrue();

    routerEvents.next(new NavigationEnd(1, '/search', '/search'));

    expect(fixture.componentInstance.showSharedChrome).toBeTrue();
  });

  it('hides shared marketing chrome on dashboard shell routes', () => {
    const dashboardRoutes = [
      '/dashboard',
      '/trips',
      '/trips/42/reservations/7/profile',
      '/propose',
      '/propose/42',
      '/messages',
      '/settings',
      '/sent-bookings',
      '/sent-bookings/7/7',
    ];

    for (const route of dashboardRoutes) {
      routerEvents.next(new NavigationEnd(1, route, route));

      expect(fixture.componentInstance.showSharedChrome).withContext(route).toBeFalse();
    }
  });
});
