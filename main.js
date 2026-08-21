import { createApp } from 'alpineshell';

import { app } from './app.js';
import { session } from './stores/session.js';
import { homePage } from './pages/home.js';
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { verifyPage } from './pages/verify.js';
import { forgotPage } from './pages/forgot.js';
import { resetPage } from './pages/reset.js';
import { confirmEmailPage } from './pages/confirm-email.js';
import { accountPage } from './pages/account.js';

createApp({
  app, // state and methods merged into the root component, reachable from every page
  theme: '/assets/theme.css',
  debug: true, // boot log, window.dbg, warnings, and a marker where a partial failed

  // path -> page name. The name gives the template (/pages/<name>.html) and the title.
  // Use an object when a route needs different chrome than the rest:
  //   header/footer: omitted or true -> default partial, false -> none, 'name' -> that partial
  routes: {
    notfound: '404',
    '/': 'home',
    '/login': { page: 'login', header: false, footer: false },
    '/register': { page: 'register', header: false, footer: false },
    // The paths the mail templates link to; the token is the whole point of the route.
    '/verify/:token': { page: 'verify', header: false, footer: false },
    '/forgot-password': { page: 'forgot', header: false, footer: false },
    '/reset-password/:token': { page: 'reset', header: false, footer: false },
    '/confirm-email/:token': { page: 'confirm-email', header: false, footer: false },
    '/account': 'account',
  },

  protected: ['/account'], // prefix match: '/account' also covers '/account/orders'

  // Overrides only — a page with no entry gets its own name as the title.
  titles: {
    404: 'Page not found',
    login: 'Sign in',
    register: 'Create an account',
    verify: 'Verify your email',
    forgot: 'Reset your password',
    reset: 'Set a new password',
    'confirm-email': 'Confirm your new email',
  },

  stores: { session }, // register new store here
  // Only partials you render yourself with x-html; header and footer are fetched by the router.
  partials: ['toast'],
  // register new page component here
  pages: {
    homePage, loginPage, registerPage, verifyPage,
    forgotPage, resetPage, confirmEmailPage, accountPage,
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
