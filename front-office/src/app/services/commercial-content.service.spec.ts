import { COMMERCIAL_CONTENT } from './commercial-content.service';

describe('commercial content catalogue', () => {
  it('describes the free platform without payment promises', () => {
    const content = Object.values(COMMERCIAL_CONTENT.free).join(' ');

    expect(content).toContain('sans frais');
    expect(content).not.toContain('7 %');
    expect(content).not.toContain('paiement sécurisé');
  });

  it('keeps commission copy isolated in the commission variant', () => {
    const content = Object.values(COMMERCIAL_CONTENT.commission).join(' ');

    expect(content).toContain('7 %');
    expect(content).toContain('Paiement sécurisé');
  });
});
