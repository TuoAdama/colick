import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { ParcelRequest } from '../../models/parcel-request.model';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelRequestDetailPageComponent } from './parcel-request-detail-page.component';

describe('ParcelRequestDetailPageComponent', () => {
  const request: ParcelRequest = { id: 1, senderId: 10, senderName: 'Alice', departure: 'Paris', destination: 'Abidjan', packageTitle: 'Documents', weight: 2, status: 'ACTIVE', description: 'Fragile', packagePhotoUrl: '/photo.png', createdAt: '2026-06-01T12:00:00' };
  let fixture: ComponentFixture<ParcelRequestDetailPageComponent>;
  let component: ParcelRequestDetailPageComponent;
  let service: jasmine.SpyObj<ParcelRequestService>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({ id: '1' }));
    service = jasmine.createSpyObj('ParcelRequestService', ['getMyRequest', 'closeRequest', 'cancelRequest']);
    service.getMyRequest.and.returnValue(of(request));
    service.closeRequest.and.returnValue(of({ ...request, status: 'CLOSED' }));
    service.cancelRequest.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({
      imports: [ParcelRequestDetailPageComponent],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { paramMap: params } }, { provide: ParcelRequestService, useValue: service }],
    }).compileComponents();
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    spyOn(window, 'confirm').and.returnValue(true);
    fixture = TestBed.createComponent(ParcelRequestDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('loads the detail directly by URL and displays optional fields', () => {
    fixture.detectChanges();
    expect(service.getMyRequest).toHaveBeenCalledWith(1);
    const host: HTMLElement = fixture.nativeElement;
    for (const text of ['Paris → Abidjan', 'Documents', '2 kg', 'Date flexible', 'Publiée le', 'Fragile']) expect(host.textContent).toContain(text);
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/photo.png');
    expect(host.querySelector('a')?.getAttribute('href')).toBe('/parcel-requests');
  });

  it('omits absent optional information', () => {
    service.getMyRequest.and.returnValue(of({ ...request, description: undefined, packagePhotoUrl: undefined, createdAt: undefined }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Description du colis');
    expect(fixture.nativeElement.textContent).not.toContain('Publiée le');
  });

  it('redirects invalid IDs without fetching', () => {
    params.next(convertToParamMap({ id: 'invalid' }));
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/404']);
    expect(service.getMyRequest).not.toHaveBeenCalled();
  });

  it('redirects missing requests to 404', () => {
    service.getMyRequest.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/404']);
  });

  it('shows access denied without retrying a forbidden request', () => {
    service.getMyRequest.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Vous n’avez pas accès');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('shows loading then retries a temporary error', () => {
    const pending = new Subject<ParcelRequest>();
    service.getMyRequest.and.returnValue(pending);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    pending.error(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();
    service.getMyRequest.and.returnValue(of(request));
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(component.request).toEqual(request);
    expect(component.loadError).toBe('');
  });

  it('cancels stale loads when the route ID changes', () => {
    const stale = new Subject<ParcelRequest>();
    service.getMyRequest.and.returnValues(stale, of({ ...request, id: 2 }));
    fixture.detectChanges();
    params.next(convertToParamMap({ id: '2' }));
    stale.next(request);
    expect(component.request?.id).toBe(2);
  });

  it('marks the request found and disables subsequent actions', () => {
    fixture.detectChanges();
    component.closeRequest();
    fixture.detectChanges();
    expect(service.closeRequest).toHaveBeenCalledWith(1);
    expect(component.request?.status).toBe('CLOSED');
    expect(fixture.nativeElement.textContent).toContain('Trouvée');
    component.cancelRequest();
    expect(service.cancelRequest).not.toHaveBeenCalled();
    for (const button of fixture.nativeElement.querySelectorAll('button')) expect(button.disabled).toBeTrue();
  });

  it('cancels a confirmed request', () => {
    fixture.detectChanges();
    component.cancelRequest();
    expect(window.confirm).toHaveBeenCalled();
    expect(service.cancelRequest).toHaveBeenCalledWith(1);
    expect(component.request?.status).toBe('CANCELLED');
  });

  it('does not cancel when confirmation is abandoned', () => {
    (window.confirm as jasmine.Spy).and.returnValue(false);
    fixture.detectChanges();
    component.cancelRequest();
    expect(service.cancelRequest).not.toHaveBeenCalled();
    expect(component.isProcessing).toBeFalse();
  });

  for (const action of ['close', 'cancel'] as const) {
    it(`blocks both actions while ${action} is pending and allows retry after failure`, () => {
      const pending = new Subject<never>();
      if (action === 'close') service.closeRequest.and.returnValue(pending);
      else service.cancelRequest.and.returnValue(pending);
      fixture.detectChanges();
      if (action === 'close') component.closeRequest();
      else component.cancelRequest();
      fixture.detectChanges();
      for (const button of fixture.nativeElement.querySelectorAll('button')) expect(button.disabled).toBeTrue();
      component.closeRequest();
      component.cancelRequest();
      expect(service.closeRequest.calls.count() + service.cancelRequest.calls.count()).toBe(1);
      pending.error(new Error('offline'));
      fixture.detectChanges();
      expect(component.isProcessing).toBeFalse();
      expect(component.request?.status).toBe('ACTIVE');
      expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
      for (const button of fixture.nativeElement.querySelectorAll('button')) expect(button.disabled).toBeFalse();
    });
  }
});
