import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface JourneyStep {
  title: string;
  description: string;
  icon: string;
}

/**
 * Explains the Coliclic marketplace to senders and travelers.
 */
@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './how-it-works-page.component.html',
})
export class HowItWorksPageComponent {
  readonly senderSteps: JourneyStep[] = [
    {
      title: 'Recherchez un trajet',
      description: 'Indiquez le départ et la destination de votre colis pour découvrir les voyageurs disponibles.',
      icon: 'search',
    },
    {
      title: 'Comparez en confiance',
      description: 'Consultez le prix, le poids disponible et les avis laissés aux voyageurs avant de faire votre choix.',
      icon: 'compare_arrows',
    },
    {
      title: 'Envoyez votre demande',
      description: 'Précisez le poids, décrivez votre colis et ajoutez une photo si elle peut aider le voyageur.',
      icon: 'inventory_2',
    },
    {
      title: 'Réservez puis évaluez',
      description: 'Réservez immédiatement ou attendez l’accord du voyageur, puis confirmez la livraison et partagez votre avis.',
      icon: 'verified',
    },
  ];

  readonly travelerSteps: JourneyStep[] = [
    {
      title: 'Publiez votre trajet',
      description: 'Renseignez vos villes de départ et d’arrivée, le poids que vous pouvez transporter et votre tarif au kilo.',
      icon: 'edit_note',
    },
    {
      title: 'Recevez les demandes',
      description: 'Les expéditeurs intéressés vous contactent depuis la plateforme ; vous êtes aussi informé par e-mail.',
      icon: 'notifications',
    },
    {
      title: 'Choisissez vos envois',
      description: 'Acceptez ou refusez les demandes selon vos critères et suivez les personnes retenues.',
      icon: 'task_alt',
    },
    {
      title: 'Transportez et recevez votre paiement',
      description: 'Après la livraison, le paiement est versé selon la réservation, avec une commission Coliclic de 7 %.',
      icon: 'payments',
    },
  ];
}
