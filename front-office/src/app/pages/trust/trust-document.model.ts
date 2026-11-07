export type TrustDocumentSlug =
  | 'about'
  | 'help'
  | 'terms'
  | 'privacy'
  | 'legal-notice'
  | 'security'
  | 'cancellation-disputes';

export interface TrustSection {
  id: string;
  title: string;
  paragraphs?: string[];
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
  version: string;
  updatedAt: string;
  updatedAtLabel: string;
  notice?: string;
  sections: TrustSection[];
  related: TrustRelatedDocument[];
}
