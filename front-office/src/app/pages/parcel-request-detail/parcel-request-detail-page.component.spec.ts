import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { ParcelRequestDetailPageComponent } from './parcel-request-detail-page.component';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelRequest } from '../../models/parcel-request.model';

describe('ParcelRequestDetailPageComponent', () => {
  let fixture: ComponentFixture<ParcelRequestDetailPageComponent>;
  let component: ParcelRequestDetailPageComponent;
  let service: jasmine.SpyObj<ParcelRequestService>;
  const request: ParcelRequest = { id: 5, senderId: 1, senderName: 'Alice', departure: 'Paris, France', destination: 'Abidjan, Côte d’Ivoire', packageTitle: 'Vêtements et livres', weight: 5, status: 'ACTIVE', createdAt: '2026-10-20T12:00:00' };
  beforeEach(async () => {
    service = jasmine.createSpyObj('ParcelRequestService', ['getRequest', 'closeRequest', 'cancelRequest', 'removeRequest']);
    service.getRequest.and.returnValue(of(request));
    service.closeRequest.and.returnValue(of({ ...request, status: 'CLOSED' }));
    service.cancelRequest.and.returnValue(of(void 0));
    service.removeRequest.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({ imports: [ParcelRequestDetailPageComponent], providers: [provideRouter([]), { provide: ParcelRequestService, useValue: service }, { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } }] }).compileComponents();
    fixture = TestBed.createComponent(ParcelRequestDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('renders the owner detail without a Trajet heading and handles optional fields', () => {
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(service.getRequest).toHaveBeenCalledWith(5);
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

  it('shows loading, a missing request, and a successful retry', () => {
    service.getRequest.and.returnValue(NEVER);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chargement');
    service.getRequest.and.returnValue(throwError(() => ({ status: 404 })));
    component.load(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('introuvable');
    service.getRequest.and.returnValue(of(request));
    component.load(); fixture.detectChanges();
    expect(component.loadError).toBe('');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(request.packageTitle);
  });
});
