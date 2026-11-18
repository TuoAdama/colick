export type TrustDocumentSlug =
  | 'about'
  | 'help'
  | 'transport-payment'
  | 'terms'
  | 'privacy'
  | 'legal-notice'
  | 'security'
  | 'cancellation-disputes';

export type TrustParagraphPart = string | { strong: string } | TrustRelatedDocument;

export interface TrustSection {
  id: string;
  title: string;
  paragraphs?: (string | readonly TrustParagraphPart[])[];
  bullets?: string[];
}

export interface TrustRelatedDocument {
  label: string;
  route: string;
}

export interface TrustDocument {
  slug: TrustDocumentSlug;
  title: string;
  description: string;
  updatedAt: string;
  updatedAtLabel: string;
  sections: TrustSection[];
  related: TrustRelatedDocument[];
}
