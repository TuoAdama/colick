interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  shape?: 'pill' | 'rectangular' | 'circle' | 'square';
  width?: number;
  text?: 'signin_with' | 'signup_with';
  logo_alignment?: 'left' | 'center';
}

interface GoogleAccountsIdApi {
  initialize(configuration: GoogleIdConfiguration): void;
  renderButton(parent: HTMLElement, options: GoogleButtonConfiguration): void;
  disableAutoSelect(): void;
}

interface GoogleIdentityWindow {
  accounts: {
    id: GoogleAccountsIdApi;
  };
}

interface Window {
  google?: GoogleIdentityWindow;
}
