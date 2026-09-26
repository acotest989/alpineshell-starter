import { createApp } from 'alpineshell';

import { app } from './app.js';
import { session } from './stores/session.js';
import { homePage } from './pages/home.js';
import { accountPage } from './pages/account/overview.js';
import { loginPage } from './pages/account/login.js';
import { registerPage } from './pages/account/register.js';
import { verifyPage } from './pages/account/verify.js';
import { forgotPage } from './pages/account/forgot.js';
import { resetPage } from './pages/account/reset.js';
import { confirmEmailPage } from './pages/account/confirm-email.js';

// Signing in, and the pages a mail links to, stand alone: no header, no footer.
const alone = (page) => ({ page, header: false, footer: false });

createApp({
  app, // state and methods merged into the root component, reachable from every page
  theme: '/assets/theme.css',
  debug: true, // boot log, window.dbg, warnings, and a marker where a partial failed

  // path -> page name. The name is where the page lives, 'account/login' being
  // /pages/account/login.html, and it is also the title unless `titles` gives one.
  // Use an object when a route needs different chrome than the rest:
  //   header/footer: omitted or true -> default partial, false -> none, 'name' -> that partial
  routes: {
    notfound: '404',
    '/': 'home',
    '/account': 'account/overview',
    '/login': alone('account/login'),
    '/register': alone('account/register'),
    // The paths the mail templates link to; the token is the whole point of the route.
    '/verify/:token': alone('account/verify'),
    '/forgot-password': alone('account/forgot'),
    '/reset-password/:token': alone('account/reset'),
    '/confirm-email/:token': alone('account/confirm-email'),
  },

  protected: ['/account'], // prefix match: '/account' also covers '/account/orders'

  // For what a session alone does not grant. Signed out still goes to the login page; signed
  // in and refused goes home, before anything under the prefix renders:
  // allow: { '/admin': (session) => session.user?.admin === true },

  // A page with no entry here is titled by its name, which suits 'home' and not
  // 'account/login'.
  titles: {
    404: 'Page not found',
    'account/overview': 'Account',
    'account/login': 'Sign in',
    'account/register': 'Create an account',
    'account/verify': 'Verify your email',
    'account/forgot': 'Reset your password',
    'account/reset': 'Set a new password',
    'account/confirm-email': 'Confirm your new email',
  },

  stores: { session }, // register new store here
  // Only partials you render yourself with x-html; header and footer are fetched by the router.
  partials: ['toast', 'scrolltop'],
  // register new page component here
  pages: {
    homePage,
    accountPage, loginPage, registerPage, verifyPage, forgotPage, resetPage, confirmEmailPage,
  },

  // Defaults in effect — uncomment to change:
  // siteName: document.title,   // suffix after the page title
  // loginPath: '/login',        // where the guard sends a signed-out visitor
  // homePath: '/',              // fallback for redirects and goBack()
  // pagesDir: '/pages',         // '<page>.html' is looked up here
  // partialsDir: '/partials',
  // targetId: 'page',           // element the router renders into
  // header: 'header',           // partial above every page, false to drop it
  // footer: 'footer',
});
