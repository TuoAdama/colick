import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ContactPageComponent } from './contact-page.component';
import { ContactService } from '../../services/contact.service';
import { AppConfigService } from '../../services/app-config.service';
import { Turnstile, TurnstileLoaderService } from '../../services/turnstile-loader.service';

describe('ContactPageComponent', () => {
  let fixture: ComponentFixture<ContactPageComponent>;
  let component: ContactPageComponent;
  const contactServiceMock = jasmine.createSpyObj<ContactService>('ContactService', ['send', 'submitDispute']);
  let turnstile: jasmine.SpyObj<Turnstile>;
  let loader: jasmine.SpyObj<TurnstileLoaderService>;
  let route: { snapshot: { data: { contactMode?: string }; queryParamMap: ReturnType<typeof convertToParamMap> } };

  beforeEach(async () => {
    route = { snapshot: { data: {}, queryParamMap: convertToParamMap({}) } };
    turnstile = jasmine.createSpyObj<Turnstile>('Turnstile', ['render', 'reset', 'remove']);
    turnstile.render.and.returnValue('widget-id');
    loader = jasmine.createSpyObj<TurnstileLoaderService>('TurnstileLoaderService', ['load']);
    loader.load.and.resolveTo(turnstile);
    await TestBed.configureTestingModule({
      imports: [ContactPageComponent],
      providers: [
        { provide: ContactService, useValue: contactServiceMock },
        { provide: ActivatedRoute, useValue: route },
        { provide: AppConfigService, useValue: { config: () => ({ contactTurnstileSiteKey: 'public-key' }) } },
        { provide: TurnstileLoaderService, useValue: loader },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ContactPageComponent);
    component = fixture.componentInstance;
    contactServiceMock.send.calls.reset();
    contactServiceMock.send.and.returnValue(of(void 0));
    contactServiceMock.submitDispute.calls.reset();
    contactServiceMock.submitDispute.and.returnValue(of(void 0));
  });

  it('does not submit an invalid form and displays validation feedback', () => {
    component.onSubmit();

    expect(contactServiceMock.send).not.toHaveBeenCalled();
    expect(component.contactForm.controls.email.touched).toBeTrue();
    expect(component.contactForm.controls.subject.touched).toBeTrue();
    expect(component.contactForm.controls.message.touched).toBeTrue();
  });

  it('rejects whitespace-only subject and message locally', () => {
    component.contactForm.patchValue({ email: 'ada@example.com', subject: '   ', message: '  ' });

    component.onSubmit();

    expect(contactServiceMock.send).not.toHaveBeenCalled();
    expect(component.contactForm.controls.subject.hasError('required')).toBeTrue();
    expect(component.contactForm.controls.message.hasError('required')).toBeTrue();
  });

  it('waits for Turnstile, sends its token, and resets the widget after submission', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.contactForm.patchValue({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });

    component.onSubmit();
    expect(contactServiceMock.send).not.toHaveBeenCalled();
    const options = turnstile.render.calls.mostRecent().args[1];
    expect(options.sitekey).toBe('public-key');
    options.callback('expired-token');
    options['expired-callback']();
    component.onSubmit();
    expect(contactServiceMock.send).not.toHaveBeenCalled();

    options.callback('verified-token');
    component.onSubmit();

    expect(contactServiceMock.send).toHaveBeenCalledOnceWith({
      email: 'ada@example.com', subject: 'Question', message: 'Bonjour', turnstileToken: 'verified-token',
    });
    expect(turnstile.reset).toHaveBeenCalledOnceWith('widget-id');
    expect(component.turnstileToken()).toBe('');
    expect(component.contactForm.getRawValue()).toEqual({ email: '', subject: '', message: '', tripReference: '', bookingReference: '' });
    expect(component.successMessage).toContain('bien été envoyé');
    fixture.destroy();
    expect(turnstile.remove).toHaveBeenCalledOnceWith('widget-id');
  });

  it('keeps form values and displays a rate-limit error', () => {
    component.turnstileToken.set('verified-token');
    contactServiceMock.send.and.returnValue(throwError(() => ({ status: 429 })));
    component.contactForm.patchValue({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });

    component.onSubmit();

    expect(component.contactForm.getRawValue().message).toBe('Bonjour');
    expect(component.errorMessage).toContain('Trop de messages');
  });

  it('displays a technical error while preserving the form', () => {
    component.turnstileToken.set('verified-token');
    contactServiceMock.send.and.returnValue(throwError(() => ({ status: 500 })));
    component.contactForm.patchValue({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });

    component.onSubmit();

    expect(component.contactForm.getRawValue().email).toBe('ada@example.com');
    expect(component.errorMessage).toContain('erreur technique');
  });

  it('enforces subject and message length limits', () => {
    component.contactForm.patchValue({ email: 'ada@example.com', subject: 'a'.repeat(151), message: 'b'.repeat(5001) });

    expect(component.contactForm.controls.subject.hasError('maxlength')).toBeTrue();
    expect(component.contactForm.controls.message.hasError('maxlength')).toBeTrue();
  });

  it('requires a fresh token after an anti-spam rejection and preserves the message', async () => {
    contactServiceMock.send.and.returnValue(throwError(() => ({ status: 422 })));
    fixture.detectChanges();
    await fixture.whenStable();
    const options = turnstile.render.calls.mostRecent().args[1];
    component.contactForm.patchValue({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });

    options.callback('rejected-token');
    component.onSubmit();
    component.onSubmit();

    expect(contactServiceMock.send).toHaveBeenCalledTimes(1);
    expect(component.errorMessage).toContain('vérification anti-spam');
    expect(component.contactForm.controls.message.value).toBe('Bonjour');
    expect(turnstile.reset).toHaveBeenCalledOnceWith('widget-id');

    contactServiceMock.send.and.returnValue(of(void 0));
    options.callback('new-token');
    component.onSubmit();
    expect(contactServiceMock.send.calls.mostRecent().args[0].turnstileToken).toBe('new-token');
  });

  it('still includes the context when reporting a traveler profile', () => {
    route.snapshot.queryParamMap = convertToParamMap({ type: 'report', travelerId: '7', tripId: '12' });
    fixture.detectChanges();
    component.turnstileToken.set('verified-token');
    component.contactForm.patchValue({ email: 'ada@example.com', message: 'Merci de vérifier ce profil.' });
    component.onSubmit();

    expect(contactServiceMock.send).toHaveBeenCalledOnceWith({
      email: 'ada@example.com', subject: 'Signalement d’un profil voyageur', message: 'Merci de vérifier ce profil.',
      category: 'PROFILE_REPORT', travelerId: 7, tripId: 12, turnstileToken: 'verified-token',
    });
  });

  describe('dispute form', () => {
    beforeEach(() => {
      fixture.destroy();
      route.snapshot.data = { contactMode: 'dispute' };
      fixture = TestBed.createComponent(ContactPageComponent);
      component = fixture.componentInstance;
    });

    it('sends structured references once and resets the form after confirmation', () => {
      const response = new Subject<void>();
      contactServiceMock.submitDispute.and.returnValue(response);
      component.contactForm.patchValue({
        email: 'ada@example.com', message: ' Le colis est arrivé endommagé. ',
        tripReference: ' TRIP-1 ', bookingReference: '42',
      });

      component.onSubmit();
      component.onSubmit();

      expect(contactServiceMock.send).not.toHaveBeenCalled();
      expect(contactServiceMock.submitDispute).toHaveBeenCalledOnceWith({
        email: 'ada@example.com', description: 'Le colis est arrivé endommagé.',
        tripReference: 'TRIP-1', bookingReference: '42',
      });
      expect(component.successMessage).toBe('');
      response.next();
      response.complete();
      fixture.detectChanges();

      expect(loader.load).not.toHaveBeenCalled();
      expect(component.contactForm.getRawValue()).toEqual({
        email: '', subject: '', message: '', tripReference: '', bookingReference: '',
      });
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Votre réclamation a bien été envoyée');
    });

    it('preserves the description after a failed send and can retry without references', () => {
      contactServiceMock.submitDispute.and.returnValue(throwError(() => ({ status: 429 })));
      component.contactForm.patchValue({ email: 'ada@example.com', message: 'Mon colis est introuvable.', tripReference: '  ' });
      component.onSubmit();

      expect(component.errorMessage).toContain('Trop de messages');
      expect(component.contactForm.controls.message.value).toBe('Mon colis est introuvable.');

      contactServiceMock.submitDispute.and.returnValue(of(void 0));
      component.onSubmit();

      expect(contactServiceMock.submitDispute.calls.mostRecent().args[0]).toEqual({
        email: 'ada@example.com', description: 'Mon colis est introuvable.',
        tripReference: undefined, bookingReference: undefined,
      });
      expect(component.errorMessage).toBe('');
    });

    it('validates required fields and enforces the description and reference lengths', () => {
      component.contactForm.patchValue({ email: 'invalid', message: '  ' });
      component.onSubmit();
      expect(component.contactForm.controls.email.hasError('email')).toBeTrue();
      expect(component.contactForm.controls.message.hasError('required')).toBeTrue();

      component.contactForm.patchValue({ email: 'ada@example.com', message: 'a'.repeat(4701), tripReference: 'b'.repeat(101) });
      component.onSubmit();
      expect(component.contactForm.controls.message.hasError('maxlength')).toBeTrue();
      expect(component.contactForm.controls.tripReference.hasError('maxlength')).toBeTrue();
      expect(contactServiceMock.submitDispute).not.toHaveBeenCalled();

      component.contactForm.patchValue({ message: 'a'.repeat(4700), tripReference: 'b'.repeat(100), bookingReference: 'c'.repeat(100) });
      component.onSubmit();
      expect(contactServiceMock.submitDispute).toHaveBeenCalledOnceWith({
        email: 'ada@example.com', description: 'a'.repeat(4700),
        tripReference: 'b'.repeat(100), bookingReference: 'c'.repeat(100),
      });
    });
  });
});
