import { Injectable, computed, inject } from '@angular/core';
import { CommercialContentVariant } from '../models/app-config.model';
import { AppConfigService } from './app-config.service';

export interface CommercialContent {
  heroTrustLabel: string;
  securityIntro: string;
  securityTitle: string;
  securityDescription: string;
  advantageSecurityDescription: string;
  landingTrustTitle: string;
  landingTrustDescription: string;
  travelerFinalStepTitle: string;
  travelerFinalStepDescription: string;
  travelerTestimonial: string;
  senderTestimonial: string;
  ctaFooter: string;
  dashboardEarningsNote: string;
  bookingGrossLabel: string;
  bookingFeeLabel: string;
  bookingNetLabel: string;
  shareCardTrustLabel: string;
  footerCommercialLink: string;
}

export const COMMERCIAL_CONTENT: Record<CommercialContentVariant, CommercialContent> = {
  free: {
    heroTrustLabel: 'Mise en relation gratuite',
    securityIntro: 'Activation des comptes, avis et support contribuent à créer un cadre de confiance.',
    securityTitle: 'Règlement entre utilisateurs',
    securityDescription: 'Coliclic ne prélève aucuns frais et ne conserve pas les fonds : les utilisateurs organisent directement le règlement.',
    advantageSecurityDescription: 'Activation du compte, avis vérifiés et accompagnement par notre équipe.',
    landingTrustTitle: 'Zéro frais Coliclic',
    landingTrustDescription: 'La mise en relation est gratuite et le règlement est organisé directement entre utilisateurs.',
    travelerFinalStepTitle: 'Transportez et soyez rémunéré',
    travelerFinalStepDescription: 'Après la livraison, recevez directement le montant convenu avec l’expéditeur, sans commission Coliclic.',
    travelerTestimonial: 'Grâce à Coliclic, je trouve des expéditeurs pour mes voyages entre la France et le Sénégal, sans frais de plateforme.',
    senderTestimonial: "Les avis et l'activation des comptes m'ont rassurée. La mise en relation est simple et gratuite.",
    ctaFooter: 'Mise en relation gratuite. Coliclic ne prélève aucuns frais.',
    dashboardEarningsNote: 'Montants convenus, sans frais Coliclic',
    bookingGrossLabel: 'Montant convenu',
    bookingFeeLabel: 'Frais Coliclic',
    bookingNetLabel: 'Montant pour le voyageur',
    shareCardTrustLabel: 'Mise en relation gratuite',
    footerCommercialLink: 'Plateforme gratuite',
  },
  commission: {
    heroTrustLabel: 'Paiement sécurisé',
    securityIntro: 'Activation des comptes, paiement sécurisé, avis et support contribuent à créer un cadre de confiance.',
    securityTitle: 'Paiement sécurisé',
    securityDescription: 'Les transactions sont sécurisées et le paiement est libéré après confirmation de livraison.',
    advantageSecurityDescription: 'Activation du compte et paiement sécurisé sur la plateforme.',
    landingTrustTitle: 'Zéro stress',
    landingTrustDescription: 'Le paiement reste sécurisé jusqu’à confirmation de livraison.',
    travelerFinalStepTitle: 'Transportez et recevez votre paiement',
    travelerFinalStepDescription: 'Après la livraison, le paiement est versé selon la réservation, avec une commission Coliclic de 7 %.',
    travelerTestimonial: 'Grâce à Coliclic, je rentabilise mes voyages entre la France et le Sénégal. La commission de 7 % est raisonnable.',
    senderTestimonial: "Les avis et le paiement sécurisé m'ont rassurée. La plateforme est simple à utiliser.",
    ctaFooter: 'Commission de 7 % uniquement sur les transactions réussies. Pas de frais cachés.',
    dashboardEarningsNote: 'Hors frais de service plateforme (7 %)',
    bookingGrossLabel: 'Prix total payé',
    bookingFeeLabel: 'Commission Coliclic (7 %)',
    bookingNetLabel: 'Votre gain net',
    shareCardTrustLabel: 'Paiement sécurisé',
    footerCommercialLink: 'Nos tarifs',
  },
};

@Injectable({ providedIn: 'root' })
export class CommercialContentService {
  private readonly appConfig = inject(AppConfigService);

  readonly content = computed(() => COMMERCIAL_CONTENT[this.appConfig.config().contentVariant]);
}
