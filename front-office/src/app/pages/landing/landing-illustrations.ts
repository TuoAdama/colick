export const LANDING_ILLUSTRATIONS = [
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
    label: 'Le voyageur de confiance',
    src: '/images/landing-illustrations/traveler.svg',
    alt: 'Un voyageur reçoit un colis, sa valise à côté de lui.',
  },
  {
    id: '5',
    label: 'La remise à destination',
    src: '/images/landing-illustrations/delivery.svg',
    alt: 'Un voyageur remet un colis à une personne sur le seuil de sa porte.',
  },
] as const;

export type LandingIllustration = (typeof LANDING_ILLUSTRATIONS)[number];
