import { ParcelRequest } from '../../models/parcel-request.model';

export function dateLabel(date?: string): string {
  if (!date) {
    return 'Date flexible';
  }
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function createdAtLabel(createdAt?: string): string | null {
  if (!createdAt) {
    return null;
  }
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function statusLabel(status: ParcelRequest['status']): string {
  return ({ ACTIVE: 'Active', CLOSED: 'Trouvée', CANCELLED: 'Annulée' } as Record<ParcelRequest['status'], string>)[status];
}

export function statusClass(status: ParcelRequest['status']): string {
  return ({
    ACTIVE: 'bg-success/10 text-success',
    CLOSED: 'bg-primary/10 text-primary',
    CANCELLED: 'bg-text-muted/10 text-text-muted',
  } as Record<ParcelRequest['status'], string>)[status];
}
