import { AdminUser } from '../../models/admin.model';

export function connectionLabels(user: AdminUser): string {
  return user.connectionMethods.map(method => method === 'GOOGLE' ? 'Google' : 'Mot de passe').join(' · ') || 'Non disponible';
}

export function adminDate(value?: string): string {
  return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Non disponible';
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Actif', COMPLETED: 'Terminé', CANCELLED: 'Annulé', PENDING: 'En attente',
    ACCEPTED: 'Acceptée', REJECTED: 'Refusée', REMOVED: 'Retirée', DELIVERED: 'Livrée',
  };
  return labels[status] ?? status;
}
