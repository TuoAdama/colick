import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalFocusDirective } from './modal-focus.directive';

@Component({
  standalone: true,
  imports: [ModalFocusDirective],
  template: `
    <button id="modal-opener" type="button">Ouvrir</button>
    @if (isOpen) {
      <div role="dialog" appModalFocus="#modal-initial">
        @if (isInitialVisible) {
          <button id="modal-initial" type="button">Initial</button>
        }
        <button id="modal-disabled" type="button" disabled>Désactivé</button>
        <button id="modal-last" type="button">Dernier</button>
      </div>
    }
  `,
})
class ModalFocusTestComponent {
  isOpen = false;
  isInitialVisible = true;
}

describe('ModalFocusDirective', () => {
  let fixture: ComponentFixture<ModalFocusTestComponent>;
  let component: ModalFocusTestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalFocusTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalFocusTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function openDialog(): Promise<void> {
    (fixture.nativeElement.querySelector('#modal-opener') as HTMLButtonElement).focus();
    component.isOpen = true;
    component.isInitialVisible = true;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('moves focus to the configured initial element', async () => {
    await openDialog();

    expect(document.activeElement?.id).toBe('modal-initial');
  });

  it('loops Tab from the last enabled control to the first control', async () => {
    await openDialog();
    const last = fixture.nativeElement.querySelector('#modal-last') as HTMLButtonElement;
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(document.activeElement?.id).toBe('modal-initial');
  });

  it('loops Shift+Tab from the first control to the last enabled control', async () => {
    await openDialog();
    const initial = fixture.nativeElement.querySelector('#modal-initial') as HTMLButtonElement;
    initial.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    initial.dispatchEvent(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(document.activeElement?.id).toBe('modal-last');
  });

  it('returns focus to the dialog when the focused control is removed', async () => {
    await openDialog();
    component.isInitialVisible = false;
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(document.activeElement?.id).toBe('modal-last');
  });

  it('restores focus to the opener when the dialog closes', async () => {
    await openDialog();
    component.isOpen = false;
    fixture.detectChanges();

    expect(document.activeElement?.id).toBe('modal-opener');
  });
});
