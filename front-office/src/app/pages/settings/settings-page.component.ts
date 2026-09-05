import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UpdateProfileRequest } from '../../models/auth.model';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Section 1: Informations générales ─────────────────────────────────────
  infoForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
  });
  infoSuccess = '';
  infoError = '';
  isSavingInfo = false;

  // Photo
  photoPreview: string | null = null;
  selectedPhotoFile: File | null = null;
  isUploadingPhoto = false;
  photoError = '';

  // ── Section 2: Changer l'e-mail ───────────────────────────────────────────
  emailForm = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]],
  });
  emailSuccess = '';
  emailError = '';
  isSendingEmail = false;

  // ── Section 3: Changer le mot de passe ────────────────────────────────────
  passwordForm = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });
  passwordSuccess = '';
  passwordError = '';
  isSavingPassword = false;

  /** Observable stream of the currently authenticated user. */
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const user = this.authService.getUser();
    if (user) {
      this.infoForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
      });
      this.emailForm.patchValue({
        newEmail: user.email,
      });
      this.photoPreview = user.photoUrl ?? null;
    }
  }

  hasLocalPassword(): boolean {
    return this.authService.getUser()?.hasPassword !== false;
  }

  // ── Photo ─────────────────────────────────────────────────────────────────
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.selectedPhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.photoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
    this.uploadPhoto();
  }

  uploadPhoto(): void {
    const user = this.authService.getUser();
    if (!user || !this.selectedPhotoFile) return;
    this.isUploadingPhoto = true;
    this.photoError = '';
    this.authService.uploadPhoto(user.id, this.selectedPhotoFile).subscribe({
      next: () => { this.isUploadingPhoto = false; },
      error: () => { this.photoError = "Erreur lors de l'upload de la photo."; this.isUploadingPhoto = false; },
    });
  }

  // ── Infos générales ──────────────────────────────────────────────────────
  saveInfo(): void {
    if (this.infoForm.invalid || this.isSavingInfo) return;
    const user = this.authService.getUser();
    if (!user) return;
    this.isSavingInfo = true;
    this.infoSuccess = '';
    this.infoError = '';
    const val = this.infoForm.value;
    const payload: UpdateProfileRequest = {
      firstName: val.firstName ?? undefined,
      lastName: val.lastName ?? undefined,
      phone: val.phone || undefined,
    };
    this.authService.updateProfile(user.id, payload).subscribe({
      next: () => { this.infoSuccess = 'Informations mises à jour.'; this.isSavingInfo = false; },
      error: () => { this.infoError = 'Erreur lors de la mise à jour.'; this.isSavingInfo = false; },
    });
  }

  // ── Email ────────────────────────────────────────────────────────────────
  sendEmailChange(): void {
    if (this.emailForm.invalid || this.isSendingEmail) return;
    const user = this.authService.getUser();
    if (!user) return;
    this.isSendingEmail = true;
    this.emailSuccess = '';
    this.emailError = '';
    const newEmail = this.emailForm.value.newEmail!;
    this.authService.requestEmailChange(user.id, newEmail).subscribe({
      next: () => {
        this.emailSuccess = `Un lien de confirmation a été envoyé à ${newEmail}. Vérifiez votre boîte mail.`;
        this.isSendingEmail = false;
      },
      error: () => { this.emailError = "Erreur lors de l'envoi. L'adresse est peut-être déjà utilisée."; this.isSendingEmail = false; },
    });
  }

  // ── Password ─────────────────────────────────────────────────────────────
  savePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword) return;
    const val = this.passwordForm.value;
    if (val.newPassword !== val.confirmPassword) {
      this.passwordError = 'Les nouveaux mots de passe ne correspondent pas.';
      return;
    }
    const user = this.authService.getUser();
    if (!user) return;
    this.isSavingPassword = true;
    this.passwordSuccess = '';
    this.passwordError = '';
    this.authService.changePassword(user.id, val.oldPassword!, val.newPassword!).subscribe({
      next: () => {
        this.passwordSuccess = 'Mot de passe mis à jour avec succès.';
        this.passwordForm.reset();
        this.isSavingPassword = false;
      },
      error: () => { this.passwordError = 'Ancien mot de passe incorrect ou erreur serveur.'; this.isSavingPassword = false; },
    });
  }

  saveProfileChanges(): void {
    const user = this.authService.getUser();
    if (!user) return;

    this.saveInfo();

    const nextEmail = this.emailForm.value.newEmail?.trim();
    if (nextEmail && nextEmail !== user.email) {
      this.sendEmailChange();
    }

    if (this.hasLocalPassword()) {
      const val = this.passwordForm.value;
      const hasPasswordInput = !!(val.oldPassword || val.newPassword || val.confirmPassword);
      if (hasPasswordInput) {
        this.savePassword();
      }
    }
  }

  resetProfileForms(): void {
    const user = this.authService.getUser();
    if (!user) return;

    this.infoForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
    });
    this.emailForm.reset({
      newEmail: user.email,
    });
    this.passwordForm.reset();
    this.infoSuccess = '';
    this.infoError = '';
    this.emailSuccess = '';
    this.emailError = '';
    this.passwordSuccess = '';
    this.passwordError = '';
  }
}
