import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContactPageComponent } from './contact-page.component';
import { ContactService } from '../../services/contact.service';

describe('ContactPageComponent', () => {
  let fixture: ComponentFixture<ContactPageComponent>;
  let component: ContactPageComponent;
  const contactServiceMock = { send: jasmine.createSpy('send').and.returnValue(of(void 0)) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPageComponent],
      providers: [{ provide: ContactService, useValue: contactServiceMock }],
    }).compileComponents();
    fixture = TestBed.createComponent(ContactPageComponent);
    component = fixture.componentInstance;
    contactServiceMock.send.calls.reset();
    contactServiceMock.send.and.returnValue(of(void 0));
  });

  it('does not submit an invalid form and displays validation feedback', () => {
    component.onSubmit();

    expect(contactServiceMock.send).not.toHaveBeenCalled();
    expect(component.contactForm.controls.email.touched).toBeTrue();
    expect(component.contactForm.controls.subject.touched).toBeTrue();
    expect(component.contactForm.controls.message.touched).toBeTrue();
  });

  it('submits a valid form, clears it, and displays confirmation', () => {
    component.contactForm.setValue({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });

    component.onSubmit();

    expect(contactServiceMock.send).toHaveBeenCalledWith({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });
    expect(component.contactForm.getRawValue()).toEqual({ email: '', subject: '', message: '' });
    expect(component.successMessage).toContain('bien été envoyé');
  });

  it('keeps form values and displays a rate-limit error', () => {
    contactServiceMock.send.and.returnValue(throwError(() => ({ status: 429 })));
    component.contactForm.setValue({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });

    component.onSubmit();

    expect(component.contactForm.getRawValue().message).toBe('Bonjour');
    expect(component.errorMessage).toContain('Trop de messages');
  });

  it('displays a technical error while preserving the form', () => {
    contactServiceMock.send.and.returnValue(throwError(() => ({ status: 500 })));
    component.contactForm.setValue({ email: 'ada@example.com', subject: 'Question', message: 'Bonjour' });

    component.onSubmit();

    expect(component.contactForm.getRawValue().email).toBe('ada@example.com');
    expect(component.errorMessage).toContain('erreur technique');
  });

  it('enforces subject and message length limits', () => {
    component.contactForm.setValue({ email: 'ada@example.com', subject: 'a'.repeat(151), message: 'b'.repeat(5001) });

    expect(component.contactForm.controls.subject.hasError('maxlength')).toBeTrue();
    expect(component.contactForm.controls.message.hasError('maxlength')).toBeTrue();
  });
});
