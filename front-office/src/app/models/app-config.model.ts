export type CommercialMode = 'FREE' | 'COMMISSION';
export type CommercialContentVariant = 'free' | 'commission';

export interface PublicAppConfig {
  commercialMode: CommercialMode;
  platformFeeRate: number;
  features: {
    platformPayment: boolean;
    platformFee: boolean;
  };
  contentVariant: CommercialContentVariant;
}

export const FREE_APP_CONFIG: PublicAppConfig = {
  commercialMode: 'FREE',
  platformFeeRate: 0,
  features: {
    platformPayment: false,
    platformFee: false,
  },
  contentVariant: 'free',
};
