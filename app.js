import { consumeRedirect } from './alpineshell/index.js';
import { money } from './lib/format.js';

// Merged into AlpineShell's root component — available to every page and partial.
export const app = {
  money,

  async signIn(email, password) {
    await this.$store.session.signIn(email, password);
    this.goTo(consumeRedirect() ?? '/'); // back to whatever the guard blocked
  },

  signOut() {
    this.$store.session.signOut();
    consumeRedirect();
    this.goTo('/login');
  },
};
