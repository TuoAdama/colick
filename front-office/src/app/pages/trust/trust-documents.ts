import { CommercialContentVariant } from '../../models/app-config.model';
import { TrustDocument, TrustDocumentSlug, TrustSection } from './trust-document.model';

const DRAFT_DATE = '2026-09-14';
const DRAFT_DATE_LABEL = '14 septembre 2026';

export const TRUST_DOCUMENTS: Record<TrustDocumentSlug, TrustDocument> = {
  about: {
    slug: 'about',
    title: 'À propos de Coliclic',
    description: 'Découvrez la mission de Coliclic et son rôle dans la mise en relation entre expéditeurs et voyageurs.',
    version: '1.0',
    updatedAt: DRAFT_DATE,
    updatedAtLabel: DRAFT_DATE_LABEL,
    sections: [
      {
        id: 'mission',
        title: 'Notre mission',
        paragraphs: [
          'Coliclic rapproche les personnes qui souhaitent envoyer un colis et les voyageurs disposant de place pendant leur trajet.',
          'Notre objectif est de rendre cette mise en relation simple, lisible et fondée sur la confiance entre membres de la communauté.',
        ],
      },
      {
        id: 'fonctionnement',
        title: 'Comment fonctionne la plateforme ?',
        bullets: [
          'Le voyageur publie son trajet, la capacité disponible et son prix au kilo.',
          'L’expéditeur recherche un trajet et transmet les informations utiles sur son colis.',
          'Selon le type de réservation, la demande est acceptée immédiatement ou examinée par le voyageur.',
          'Après acceptation, le code de remise est envoyé par e-mail à l’adresse du compte de l’expéditeur, puis la remise est confirmée dans Coliclic.',
          'Après le trajet, les utilisateurs peuvent partager un avis sur leur expérience.',
        ],
      },
      {
        id: 'role',
        title: 'Le rôle de Coliclic',
        paragraphs: [
          'Coliclic agit comme intermédiaire technique de mise en relation. La plateforme n’est pas le transporteur du colis et ne devient pas partie au contrat de transport conclu entre les utilisateurs.',
          'Les utilisateurs restent responsables des informations publiées, de l’emballage, de la conformité du colis et des formalités douanières.',
        ],
      },
    ],
    related: [
      { label: 'Comment ça marche', route: '/comment-ca-marche' },
      { label: 'Sécurité', route: '/securite' },
      { label: 'Conditions générales d’utilisation', route: '/cgu' },
    ],
  },
  help: {
    slug: 'help',
    title: 'Centre d’aide',
    description: 'Réponses aux questions fréquentes sur les trajets, réservations, colis et comptes Coliclic.',
    version: '1.0',
    updatedAt: DRAFT_DATE,
    updatedAtLabel: DRAFT_DATE_LABEL,
    sections: [
      {
        id: 'reservation',
        title: 'Comment réserver une place ?',
        paragraphs: ['Recherchez un trajet, ouvrez sa fiche puis indiquez le colis, son poids et le contact du destinataire. Ce contact est transmis au voyageur pour organiser la remise. Une réservation instantanée est acceptée immédiatement ; une demande d’approbation attend la décision du voyageur. Après acceptation, le code de remise est envoyé par e-mail à l’adresse du compte de l’expéditeur.'],
      },
      {
        id: 'livraison',
        title: 'Comment confirmer la livraison ?',
        paragraphs: ['Après acceptation de la réservation, un code à six chiffres est envoyé par e-mail à l’adresse du compte de l’expéditeur. Le contact du destinataire saisi dans la demande est communiqué au voyageur pour organiser la remise ; il ne reçoit pas le code automatiquement. Le voyageur saisit ce code dans Coliclic pour enregistrer la livraison. Ne communiquez-le qu’au moment de la remise effective.'],
      },
      {
        id: 'probleme',
        title: 'Que faire en cas de problème ?',
        paragraphs: ['Conservez les échanges, photographies et justificatifs utiles, puis contactez rapidement notre support. Pour un objet dangereux ou une situation urgente, adressez-vous d’abord aux services compétents.'],
      },
      {
        id: 'compte',
        title: 'Compte et sécurité',
        paragraphs: ['Activez votre compte par e-mail, utilisez un mot de passe unique et ne partagez jamais vos codes de connexion ou de validation. Signalez au support tout comportement ou contenu suspect.'],
      },
    ],
    related: [
      { label: 'Contacter le support', route: '/contact' },
      { label: 'Sécurité', route: '/securite' },
      { label: 'Annulation et litiges', route: '/annulation-litiges' },
    ],
  },
  'transport-payment': {
    slug: 'transport-payment',
    title: 'Comment régler le transport ?',
    description: 'Découvrez les modalités de règlement du transport sur Coliclic.',
    version: '1.0',
    updatedAt: '2026-11-13',
    updatedAtLabel: '13 novembre 2026',
    sections: [
      {
        id: 'reglement-direct',
        title: 'Le règlement avec le voyageur',
        paragraphs: ['Coliclic vous met en relation avec un voyageur. Vous réglez le transport directement avec lui. Coliclic n’encaisse pas le règlement et ne facture pas de frais de service.'],
      },
      {
        id: 'moyen-de-paiement',
        title: 'Les modalités du règlement',
        paragraphs: [[
          'Convenez ensemble du montant, du moment du règlement et du moyen de paiement qui vous convient. Vous pouvez par exemple choisir ',
          { strong: 'Wero' },
          ', un ',
          { strong: 'virement instantané' },
          ' ou ',
          { strong: 'PayPal' },
          ', selon les services auxquels vous avez tous les deux accès.',
        ]],
      },
      {
        id: 'confirmation',
        title: 'La confirmation de la réservation',
        paragraphs: ['La confirmation d’une réservation concerne la demande de transport. Le règlement reste à organiser entre vous.'],
      },
    ],
    related: [{ label: 'Centre d’aide', route: '/aide' }],
  },
  terms: {
    slug: 'terms',
    title: 'Conditions générales d’utilisation',
    description: 'Règles applicables à l’utilisation de la plateforme Coliclic.',
    version: '1.0',
    updatedAt: DRAFT_DATE,
    updatedAtLabel: DRAFT_DATE_LABEL,
    sections: [
      { id: 'objet', title: 'Objet et acceptation', paragraphs: ['Les présentes conditions encadrent l’accès à Coliclic et la mise en relation entre voyageurs et expéditeurs. La création d’un compte vaut acceptation de la version présentée au moment de l’inscription.'] },
      { id: 'compte', title: 'Compte utilisateur', paragraphs: ['Chaque utilisateur fournit des informations exactes, protège ses accès et informe Coliclic de toute utilisation non autorisée. Un compte peut être suspendu en cas de fraude, de danger ou de violation de ces conditions.'] },
      { id: 'intermediation', title: 'Intermédiation', paragraphs: ['Coliclic fournit un service de mise en relation et n’est pas transporteur. Le voyageur et l’expéditeur décident librement de conclure leur opération et restent responsables de son exécution.'] },
      { id: 'annonces', title: 'Trajets, colis et réservations', paragraphs: ['Les annonces et demandes doivent être loyales, complètes et conformes à la loi. Le voyageur peut accepter ou refuser une demande soumise à approbation. Les objets interdits ou non déclarés ne doivent jamais être remis.'] },
      { id: 'paiement', title: 'Tarifs et règlement', paragraphs: ['Le voyageur fixe son prix au kilo. Coliclic ne collecte ni ne conserve les fonds ; le règlement est convenu directement entre les utilisateurs.'] },
      { id: 'remise', title: 'Remise et livraison', paragraphs: ['Le code de validation contribue à constater la remise. Il ne constitue ni une assurance, ni une expertise sur l’état ou la conformité du colis.'] },
      { id: 'responsabilite', title: 'Responsabilités', paragraphs: ['Chaque utilisateur répond de ses déclarations, de ses actes et du respect des règles de transport et de douane. Coliclic ne garantit ni le comportement d’un utilisateur, ni la conservation du colis, et ne fournit aucune assurance ou indemnisation.'] },
      { id: 'avis', title: 'Avis et contenus', paragraphs: ['Les avis doivent relater une expérience réelle, sans contenu illicite, injurieux ou trompeur. Coliclic peut retirer un contenu ou limiter un compte pour protéger la plateforme et ses utilisateurs.'] },
      { id: 'litiges', title: 'Réclamations et droit applicable', paragraphs: ['Une réclamation doit d’abord être adressée au support avec les justificatifs disponibles. Les coordonnées du médiateur de la consommation seront ajoutées avant publication. Le droit français s’applique sous réserve des protections impératives du consommateur.'] },
    ],
    related: [
      { label: 'Sécurité', route: '/securite' },
      { label: 'Annulation et litiges', route: '/annulation-litiges' },
      { label: 'Politique de confidentialité', route: '/confidentialite' },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Politique de confidentialité',
    description: 'Informations sur les données personnelles traitées par Coliclic et sur vos droits.',
    version: '1.0',
    updatedAt: DRAFT_DATE,
    updatedAtLabel: DRAFT_DATE_LABEL,
    sections: [
      { id: 'responsable', title: 'Responsable du traitement', paragraphs: ['Le responsable du traitement est Adama Tuo, personne physique éditant et exploitant Coliclic. Pour toute demande relative à vos données personnelles, vous pouvez écrire à support@atuo.fr.'] },
      { id: 'donnees', title: 'Données traitées', bullets: ['Identité, coordonnées, photo de profil et données de compte.', 'Trajets, demandes de colis, réservations et justificatifs associés.', 'Messages, avis, alertes et demandes envoyées au support.', 'Données techniques nécessaires à la sécurité et au fonctionnement du service.'] },
      { id: 'finalites', title: 'Finalités et bases légales', paragraphs: ['Les données sont utilisées pour créer et sécuriser le compte, exécuter le service demandé, faciliter les échanges et réservations, envoyer les notifications utiles, répondre au support et prévenir les abus. Selon le traitement, la base légale est l’exécution du contrat, l’obligation légale ou l’intérêt légitime de sécuriser le service.'] },
      { id: 'destinataires', title: 'Destinataires', paragraphs: ['Les données sont accessibles aux personnes autorisées chez Coliclic et, dans la limite nécessaire, aux prestataires d’hébergement, de messagerie, d’envoi d’e-mails ou SMS et d’authentification Google. Les informations nécessaires à une réservation sont partagées avec l’autre utilisateur concerné.'] },
      { id: 'conservation', title: 'Durées de conservation', paragraphs: ['Une matrice détaillée sera publiée après vérification des durées réellement appliquées aux comptes, réservations, messages, fichiers, journaux techniques et demandes de support. Les données ne seront pas annoncées comme supprimées automatiquement tant que ce mécanisme n’est pas vérifié.'] },
      { id: 'droits', title: 'Vos droits', paragraphs: ['Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données et vous opposer à certains traitements. Pour exercer vos droits, écrivez à support@atuo.fr. Vous pouvez également saisir la CNIL.'] },
      { id: 'cookies', title: 'Cookies et traceurs', paragraphs: ['Coliclic utilise les mécanismes strictement nécessaires à l’authentification et à la sécurité. Aucun traceur publicitaire ou de mesure d’audience ne doit être activé sans audit et, lorsque la loi l’exige, consentement préalable.'] },
    ],
    related: [
      { label: 'Conditions générales d’utilisation', route: '/cgu' },
      { label: 'Mentions légales', route: '/mentions-legales' },
      { label: 'Nous contacter', route: '/contact' },
    ],
  },
  'legal-notice': {
    slug: 'legal-notice',
    title: 'Mentions légales',
    description: 'Informations relatives à l’éditeur et à l’hébergement de Coliclic.',
    version: '1.0',
    updatedAt: DRAFT_DATE,
    updatedAtLabel: DRAFT_DATE_LABEL,
    notice: 'Les mentions légales doivent être complétées avec les coordonnées de l’éditeur et celles vérifiées de l’hébergeur avant la mise en production.',
    sections: [
      { id: 'editeur', title: 'Éditeur', paragraphs: ['Coliclic est édité par Adama Tuo, personne physique. Si l’édition du service est exercée à titre professionnel, les mentions doivent indiquer son domicile et son numéro de téléphone, même sans société. Si elle est exercée à titre non professionnel, l’éditeur peut préserver son anonymat auprès du public en indiquant le nom et l’adresse de son hébergeur, à condition de lui avoir communiqué ses informations d’identification. Contact : support@atuo.fr.'] },
      { id: 'publication', title: 'Direction de la publication', paragraphs: ['Le directeur de la publication est Adama Tuo.'] },
      { id: 'hebergement', title: 'Hébergement', paragraphs: ['Le nom, la raison sociale, l’adresse et les coordonnées de l’hébergeur devront être renseignés avant la mise en production.'] },
      { id: 'contact', title: 'Contact', paragraphs: ['Pour toute question sur le service ou la protection des données, écrivez à support@atuo.fr.'] },
    ],
    related: [
      { label: 'Politique de confidentialité', route: '/confidentialite' },
      { label: 'Conditions générales d’utilisation', route: '/cgu' },
      { label: 'Nous contacter', route: '/contact' },
    ],
  },
  security: {
    slug: 'security',
    title: 'Sécurité et objets interdits',
    description: 'Conseils de sécurité, règles d’emballage et catégories d’objets refusés sur Coliclic.',
    version: '1.0',
    updatedAt: DRAFT_DATE,
    updatedAtLabel: DRAFT_DATE_LABEL,
    sections: [
      { id: 'avant', title: 'Avant la remise', bullets: ['Vérifiez le profil, le trajet et les informations de votre interlocuteur.', 'Décrivez précisément le contenu, le poids et les précautions nécessaires.', 'Photographiez le colis fermé et conservez les échanges utiles.', 'N’acceptez jamais un colis dont vous ne pouvez pas contrôler la nature.'] },
      { id: 'interdits', title: 'Objets interdits', bullets: ['Marchandises illégales, volées ou contrefaites.', 'Armes, munitions, explosifs, stupéfiants et substances dangereuses ou inflammables.', 'Espèces, titres au porteur et objets dont la valeur ou la nature n’a pas été déclarée.', 'Animaux, denrées incompatibles avec le trajet et produits soumis à autorisation sans justificatif.', 'Tout objet interdit par le transporteur utilisé, le pays de départ, de transit ou de destination.'] },
      { id: 'emballage', title: 'Emballage et contrôle', paragraphs: ['L’expéditeur utilise un emballage adapté au poids, à la fragilité et aux conditions du trajet. Le voyageur peut refuser un colis mal emballé, différent de sa description ou présentant un risque.'] },
      { id: 'douane', title: 'Douane et réglementation', paragraphs: ['Les utilisateurs vérifient les restrictions, déclarations, taxes et justificatifs applicables dans chaque pays. Coliclic n’accomplit pas les formalités douanières à leur place.'] },
      { id: 'remise', title: 'Validation de la remise', paragraphs: ['Le code à six chiffres ne doit être transmis qu’après remise effective au destinataire. Il constitue un élément de suivi, pas une garantie sur l’état du colis.'] },
      { id: 'assurance', title: 'Assurance', paragraphs: ['Aucune assurance, garantie contre la perte ou indemnisation Coliclic n’est incluse. Les utilisateurs vérifient leurs couvertures personnelles avant d’accepter l’opération.'] },
      { id: 'signalement', title: 'Signaler un problème', paragraphs: ['Utilisez le formulaire de contact en indiquant le trajet ou la réservation concernée et joignez les éléments utiles. En cas de danger immédiat ou d’infraction présumée, contactez les autorités compétentes.'] },
    ],
    related: [
      { label: 'Centre d’aide', route: '/aide' },
      { label: 'Nous contacter', route: '/contact' },
      { label: 'Annulation et litiges', route: '/annulation-litiges' },
    ],
  },
  'cancellation-disputes': {
    slug: 'cancellation-disputes',
    title: 'Annulation et litiges',
    description: 'Règles d’annulation, de remboursement et de traitement des réclamations sur Coliclic.',
    version: '1.0',
    updatedAt: DRAFT_DATE,
    updatedAtLabel: DRAFT_DATE_LABEL,
    notice: 'Le médiateur de la consommation et ses coordonnées doivent être ajoutés avant toute mise en production.',
    sections: [
      { id: 'expediteur', title: 'Annulation par l’expéditeur', paragraphs: ['L’expéditeur peut annuler une réservation en attente ou acceptée tant que la livraison n’a pas été confirmée. Après livraison, une contestation suit la procédure de réclamation.'] },
      { id: 'voyageur', title: 'Annulation par le voyageur', paragraphs: ['Le voyageur peut annuler un trajet actif. Les expéditeurs ayant une demande en attente ou acceptée sont alors informés et les codes de validation associés sont invalidés.'] },
      { id: 'remboursement', title: 'Remboursement', paragraphs: ['Coliclic ne détient aucun fonds et ne peut pas rembourser un règlement organisé directement entre utilisateurs. Tout remboursement éventuel doit être convenu entre eux.'] },
      { id: 'reclamation', title: 'Déposer une réclamation', bullets: ['Contactez le support dès que possible.', 'Indiquez les références du trajet et de la réservation.', 'Joignez les échanges, photographies, reçus et autres justificatifs disponibles.', 'Laissez à Coliclic un délai raisonnable pour examiner la demande et répondre.'] },
      { id: 'mediation', title: 'Médiation', paragraphs: ['Après une réclamation écrite restée sans solution, un consommateur pourra saisir gratuitement le médiateur compétent. Son identité, son adresse et son site internet seront ajoutés avant publication.'] },
    ],
    related: [
      { label: 'Conditions générales d’utilisation', route: '/cgu' },
      { label: 'Sécurité', route: '/securite' },
      { label: 'Nous contacter', route: '/contact' },
    ],
  },
};

interface CommercialParagraphs {
  aboutRole: string;
  termsPayment: string;
  cancellationRefund: string;
}

const COMMERCIAL_PARAGRAPHS: Record<CommercialContentVariant, CommercialParagraphs> = {
  free: {
    aboutRole: 'Le règlement du transport est organisé directement entre les utilisateurs.',
    termsPayment: 'Le voyageur fixe son prix au kilo. Coliclic ne collecte ni ne conserve les fonds ; le règlement est convenu directement entre les utilisateurs.',
    cancellationRefund: 'Coliclic ne détient aucun fonds et ne peut pas rembourser un règlement organisé directement entre utilisateurs. Tout remboursement éventuel doit être convenu entre eux.',
  },
  commission: {
    aboutRole: 'Le règlement du transport suit les conditions affichées lors de la réservation.',
    termsPayment: 'Le voyageur fixe son prix au kilo. Le paiement et les frais applicables sont présentés lors de la réservation.',
    cancellationRefund: 'Une annulation admissible avant la livraison ouvre droit au remboursement intégral du paiement et des frais de plateforme. Les paiements via la plateforme ne doivent pas être proposés en production tant que ce remboursement n’est pas techniquement opérationnel.',
  },
};

export function trustDocumentFor(
  slug: TrustDocumentSlug,
  variant: CommercialContentVariant,
): TrustDocument {
  const document = TRUST_DOCUMENTS[slug];
  const copy = COMMERCIAL_PARAGRAPHS[variant];

  if (slug === 'transport-payment') {
    return variant === 'free' ? document : {
      ...document,
      description: 'Découvrez comment le paiement et les frais du transport sont présentés lors de la réservation.',
      sections: document.sections.map((section) => {
        if (section.id === 'reglement-direct') {
          return { ...section, title: 'Le paiement de la réservation', paragraphs: ['Le paiement est présenté comme géré par la plateforme. Le voyageur fixe son prix au kilo et les frais applicables sont indiqués avant la réservation.'] };
        }
        if (section.id === 'moyen-de-paiement') {
          return { ...section, title: 'Les modalités du paiement', paragraphs: ['Les modalités et le montant total sont affichés lors de la réservation.'] };
        }
        if (section.id === 'confirmation') {
          return { ...section, paragraphs: ['La réservation et le paiement suivent les conditions présentées avant sa confirmation.'] };
        }
        return section;
      }),
    };
  }

  const paragraphBySection: Partial<Record<string, string>> = slug === 'about'
    ? { role: copy.aboutRole }
    : slug === 'terms'
      ? { paiement: copy.termsPayment }
      : slug === 'cancellation-disputes'
        ? { remboursement: copy.cancellationRefund }
        : {};

  if (!Object.keys(paragraphBySection).length) return document;

  return {
    ...document,
    sections: document.sections.map((section: TrustSection) => {
      const paragraph = paragraphBySection[section.id];
      if (!paragraph) return section;
      if (slug === 'about') {
        return { ...section, paragraphs: [...(section.paragraphs ?? []), paragraph] };
      }
      return { ...section, paragraphs: [paragraph] };
    }),
  };
}
