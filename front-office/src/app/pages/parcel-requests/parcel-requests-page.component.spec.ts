import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MessagingService } from '../../services/messaging.service';
import { ParcelRequestService } from '../../services/parcel-request.service';
import { ParcelRequestsPageComponent } from './parcel-requests-page.component';

describe('ParcelRequestsPageComponent', () => {
  let fixture: ComponentFixture<ParcelRequestsPageComponent>;
  let component: ParcelRequestsPageComponent;
  let router: Router;

  const availableRequest = {
    id: 1,
    senderId: 10,
    senderName: 'Alice Sender',
    departure: 'Paris',
    destination: 'Abidjan',
    desiredDate: '2026-07-01',
    packageTitle: 'Documents',
    weight: 2,
    status: 'ACTIVE' as const,
  };

  const parcelRequestServiceMock = {
    getAvailableRequests: jasmine.createSpy('getAvailableRequests').and.returnValue(of([availableRequest])),
    getMyRequests: jasmine.createSpy('getMyRequests').and.returnValue(of([])),
    closeRequest: jasmine.createSpy('closeRequest').and.returnValue(of({ ...availableRequest, status: 'CLOSED' })),
    cancelRequest: jasmine.createSpy('cancelRequest').and.returnValue(of(void 0)),
  };

  const messagingServiceMock = {
    createConversationDraft: jasmine.createSpy('createConversationDraft').and.returnValue(of({ id: 99 })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelRequestsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ParcelRequestService, useValue: parcelRequestServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelRequestsPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(window, 'confirm').and.returnValue(true);
    parcelRequestServiceMock.getAvailableRequests.calls.reset();
    parcelRequestServiceMock.getAvailableRequests.and.returnValue(of([availableRequest]));
    parcelRequestServiceMock.getMyRequests.calls.reset();
    parcelRequestServiceMock.getMyRequests.and.returnValue(of([]));
    parcelRequestServiceMock.closeRequest.calls.reset();
    parcelRequestServiceMock.closeRequest.and.returnValue(of({ ...availableRequest, status: 'CLOSED' }));
    parcelRequestServiceMock.cancelRequest.calls.reset();
    parcelRequestServiceMock.cancelRequest.and.returnValue(of(void 0));
    messagingServiceMock.createConversationDraft.calls.reset();
    messagingServiceMock.createConversationDraft.and.returnValue(of({ id: 99 }));
  });

  it('loads available requests and renders them', () => {
    fixture.detectChanges();

    expect(parcelRequestServiceMock.getAvailableRequests).toHaveBeenCalled();
    expect(component.availableRequests.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Paris → Abidjan');
    expect(fixture.nativeElement.textContent).toContain('Documents');
  });

  it('filters available requests', () => {
    fixture.detectChanges();
    component.departureFilter = 'Paris';
    component.destinationFilter = 'Abidjan';
    component.dateFilter = '2026-07-01';

    component.loadAvailableRequests();

    expect(parcelRequestServiceMock.getAvailableRequests).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: '2026-07-01',
    });
  });

  it('opens a conversation for a parcel request', () => {
    fixture.detectChanges();

    component.contactSender(availableRequest);

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      parcelRequestId: 1,
      recipientId: 10,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 99 } });
  });

  it('closes one of my active requests', () => {
    component.myRequests = [availableRequest];

    component.closeRequest(availableRequest);

    expect(parcelRequestServiceMock.closeRequest).toHaveBeenCalledWith(1);
    expect(component.myRequests[0].status).toBe('CLOSED');
  });

  it('shows an error when contact fails', () => {
    messagingServiceMock.createConversationDraft.and.returnValue(throwError(() => new Error('failed')));
    fixture.detectChanges();

    component.contactSender(availableRequest);

    expect(component.actionError).toContain('Impossible de demarrer');
    expect(component.contactingRequestId).toBeNull();
  });
});
