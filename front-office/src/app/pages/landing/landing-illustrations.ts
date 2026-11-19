export interface LandingIllustration {
  id: string;
  label: string;
  src: string;
  alt: string;
  fullFrame?: {
    srcset: string;
    sizes: string;
  };
}

const travelerImage = '/images/landing-illustrations/traveler';

export const LANDING_ILLUSTRATIONS: readonly LandingIllustration[] = [
  {
    id: '1',
    label: 'Le passage de main',
    src: '/images/landing-illustrations/handoff.svg',
    alt: 'Deux mains se transmettent un colis scellé.',
  },
  {
    id: '2',
    label: 'Colis prêt à partir',
    src: '/images/landing-illustrations/packed.svg',
    alt: 'Un colis scellé repose sur une valise cabine orange.',
  },
  {
    id: '3',
    label: 'Le trajet partagé',
    src: '/images/landing-illustrations/route.svg',
    alt: 'Un colis au premier plan et deux repères reliés par un chemin en pointillés.',
  },
  {
    id: '4',
    label: 'Le regard complice',
    src: `${travelerImage}-480.webp`,
    alt: 'Un expéditeur remet un colis à une voyageuse, sa valise orange à côté d’elle.',
    fullFrame: {
      srcset: `${travelerImage}-360.webp 360w, ${travelerImage}-480.webp 480w, ${travelerImage}-880.webp 880w`,
      sizes: '(min-width: 1024px) 440px, (min-width: 768px) 120px, (max-height: 640px) 96px, 112px',
    },
  },
  {
    id: '5',
    label: 'La remise à destination',
    src: '/images/landing-illustrations/delivery.svg',
    alt: 'Un voyageur remet un colis à une personne sur le seuil de sa porte.',
  },
];
