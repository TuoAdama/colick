import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject, NEVER, of, throwError } from 'rxjs';
import { ParcelRequestDetailPageComponent } from './parcel-request-detail-page.component';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelRequest } from '../../models/parcel-request.model';

describe('ParcelRequestDetailPageComponent', () => {
  let fixture: ComponentFixture<ParcelRequestDetailPageComponent>;
  let component: ParcelRequestDetailPageComponent;
  let service: jasmine.SpyObj<ParcelRequestService>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const request: ParcelRequest = { id: 5, senderId: 1, senderName: 'Alice', departure: 'Paris, France', destination: 'Abidjan, Côte d’Ivoire', packageTitle: 'Vêtements et livres', weight: 5, status: 'ACTIVE', createdAt: '2026-10-20T12:00:00' };
  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({ id: '5' }));
    service = jasmine.createSpyObj('ParcelRequestService', ['getMyRequest', 'closeRequest', 'cancelRequest', 'removeRequest']);
    service.getMyRequest.and.returnValue(of(request));
    service.closeRequest.and.returnValue(of({ ...request, status: 'CLOSED' }));
    service.cancelRequest.and.returnValue(of(void 0));
    service.removeRequest.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({ imports: [ParcelRequestDetailPageComponent], providers: [provideRouter([]), { provide: ParcelRequestService, useValue: service }, { provide: ActivatedRoute, useValue: { paramMap: params, snapshot: { paramMap: convertToParamMap({ id: '5' }) } } }] }).compileComponents();
    fixture = TestBed.createComponent(ParcelRequestDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('renders the owner detail without a Trajet heading and handles optional fields', () => {
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(service.getMyRequest).toHaveBeenCalledWith(5);
    expect(host.querySelector('h1')?.textContent).toContain(request.packageTitle);
    expect(host.textContent).toContain('Date flexible');
    expect(host.textContent).toContain('Aucune description fournie.');
    expect(Array.from(host.querySelectorAll('h2')).map(el => el.textContent?.trim())).toEqual(['Votre colis']);
    expect(host.querySelector('.parcel-photo')).toBeNull();
    expect(host.querySelector('.back-link')?.getAttribute('href')).toBe('/parcel-requests');
    expect(host.querySelector('[role="menu"]')).toBeNull();
  });

  it('opens an accessible menu, moves keyboard focus and closes with Escape or outside click', () => {
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const trigger = host.querySelector<HTMLButtonElement>('.menu-trigger')!;
    trigger.click();
    fixture.detectChanges();
    const items = host.querySelectorAll<HTMLElement>('[role="menuitem"]');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(items[0].getAttribute('href')).toBe('/parcel-requests/5/edit');
    expect(document.activeElement).toBe(items[0]);
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger);
    expect(component.menuOpen).toBeFalse();
    trigger.click();
    host.querySelector('h1')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(component.menuOpen).toBeFalse();
  });

  it('confirms cancellation and keeps the request visible in history', () => {
    fixture.detectChanges();
    component.ask('cancel');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(service.cancelRequest).not.toHaveBeenCalled();
    component.confirmAction();
    fixture.detectChanges();
    expect(service.cancelRequest).toHaveBeenCalledWith(5);
    expect(component.request?.status).toBe('CANCELLED');
    expect(fixture.nativeElement.querySelector('.primary-action')).toBeNull();
  });

  it('cancels a confirmation without calling the API', () => {
    fixture.detectChanges();
    component.ask('remove');
    component.dismissConfirmation();
    component.confirmAction();
    expect(service.removeRequest).not.toHaveBeenCalled();
  });

  it('removes only after confirmation and returns to the list', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    component.ask('remove');
    component.confirmAction();
    expect(service.removeRequest).toHaveBeenCalledWith(5);
    expect(navigate).toHaveBeenCalledWith(['/parcel-requests']);
  });

  it('shows failure inside the confirmation and allows retry without duplicate submissions', () => {
    service.removeRequest.and.returnValue(throwError(() => new Error('network')));
    fixture.detectChanges();
    component.ask('remove');
    component.confirmAction();
    expect(component.confirmation).toBe('remove');
    expect(component.actionError).toContain('réessayer');
    service.removeRequest.and.returnValue(NEVER);
    component.confirmAction();
    component.confirmAction();
    expect(service.removeRequest).toHaveBeenCalledTimes(2);
    component.dismissConfirmation();
    expect(component.confirmation).toBe('remove');
  });

  it('closes an active request and hides inactive actions while retaining removal', () => {
    fixture.detectChanges();
    component.closeRequest();
    fixture.detectChanges();
    expect(component.request?.status).toBe('CLOSED');
    component.toggleMenu();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[role="menuitem"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[role="menuitem"]')?.textContent).toContain('Supprimer');
    component.closeRequest();
    expect(service.closeRequest).toHaveBeenCalledTimes(1);
  });

  it('reloads a reused route and ignores the previous pending response', () => {
    const oldResponse = new Subject<ParcelRequest>();
    service.getMyRequest.and.returnValue(oldResponse);
    fixture.detectChanges();
    service.getMyRequest.and.returnValue(of({ ...request, id: 6, packageTitle: 'Nouveau besoin' }));
    params.next(convertToParamMap({ id: '6' }));
    oldResponse.next(request);
    expect(service.getMyRequest).toHaveBeenCalledWith(6);
    expect(component.request?.id).toBe(6);
    expect(component.request?.packageTitle).toBe('Nouveau besoin');
  });

  it('ignores an action response after navigating to another need', () => {
    const closeResponse = new Subject<ParcelRequest>();
    service.closeRequest.and.returnValue(closeResponse);
    fixture.detectChanges();
    component.closeRequest();
    service.getMyRequest.and.returnValue(of({ ...request, id: 6 }));
    params.next(convertToParamMap({ id: '6' }));
    closeResponse.next({ ...request, status: 'CLOSED' });
    expect(component.request?.id).toBe(6);
    expect(component.request?.status).toBe('ACTIVE');
    expect(component.busy).toBeFalse();
  });

  it('rejects malformed identifiers and does not offer retry for denied access', () => {
    fixture.detectChanges();
    service.getMyRequest.calls.reset();
    params.next(convertToParamMap({ id: '5abc' }));
    expect(service.getMyRequest).not.toHaveBeenCalled();
    expect(component.request).toBeNull();
    service.getMyRequest.and.returnValue(throwError(() => ({ status: 403 })));
    params.next(convertToParamMap({ id: '6' }));
    fixture.detectChanges();
    expect(component.accessDenied).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain('Réessayer');
  });

  it('shows loading, a missing request, and a successful retry', () => {
    service.getMyRequest.and.returnValue(NEVER);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chargement');
    service.getMyRequest.and.returnValue(throwError(() => ({ status: 404 })));
    component.load(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('introuvable');
    service.getMyRequest.and.returnValue(of(request));
    component.load(); fixture.detectChanges();
    expect(component.loadError).toBe('');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(request.packageTitle);
  });
});
