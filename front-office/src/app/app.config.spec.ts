import { ApplicationRef, Component, ComponentRef } from '@angular/core';
import { Location, ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { appRouterScrolling } from './app.config';

@Component({
  standalone: true,
  template: '',
})
class TestPageComponent {}

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class TestRootComponent {}

describe('app router scrolling', () => {
  let router: Router;
  let viewportScroller: jasmine.SpyObj<ViewportScroller>;
  let rootComponent: ComponentRef<TestRootComponent>;
  let rootElement: HTMLDivElement;

  beforeEach(async () => {
    viewportScroller = jasmine.createSpyObj<ViewportScroller>('ViewportScroller', [
      'setHistoryScrollRestoration',
      'getScrollPosition',
      'scrollToPosition',
      'scrollToAnchor',
      'setOffset',
    ]);
    viewportScroller.getScrollPosition.and.returnValue([0, 640]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'parcel-search', component: TestPageComponent },
            { path: 'login', component: TestPageComponent },
          ],
          appRouterScrolling,
        ),
        { provide: ViewportScroller, useValue: viewportScroller },
      ],
    });

    rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    rootComponent = TestBed.inject(ApplicationRef).bootstrap(TestRootComponent, rootElement);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/parcel-search?from=Paris&to=Abidjan');
    await new Promise((resolve) => setTimeout(resolve));
    viewportScroller.scrollToPosition.calls.reset();
  });

  afterEach(() => {
    rootComponent.destroy();
    rootElement.remove();
  });

  it('scrolls to the top after an imperative navigation', async () => {
    await router.navigate(['/login'], {
      queryParams: { returnUrl: '/parcel-search?from=Paris&to=Abidjan' },
    });

    await new Promise((resolve) => setTimeout(resolve));

    expect(viewportScroller.scrollToPosition).toHaveBeenCalledWith([0, 0]);
  });

  it('restores the saved position after a browser back navigation', async () => {
    await router.navigate(['/login']);
    await new Promise((resolve) => setTimeout(resolve));
    viewportScroller.scrollToPosition.calls.reset();

    const navigationEnd = firstValueFrom(
      router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    );
    TestBed.inject(Location).back();
    await navigationEnd;
    await new Promise((resolve) => setTimeout(resolve));

    expect(viewportScroller.scrollToPosition).toHaveBeenCalledWith([0, 640]);
  });
});
