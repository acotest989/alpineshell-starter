import { createApp } from './alpineshell/index.js';

import { app } from './app.js';
import { session } from './stores/session.js';
import { homePage } from './pages/home.js';
import { loginPage } from './pages/login.js';

createApp({
  app, // state and methods merged into the root component, reachable from every page
  theme: '/theme.css',
  debug: true, // boot log + window.dbg

  // path -> page name. The name gives the template (/pages/<name>.html) and the title.
  // Use an object when a route needs different chrome than the rest:
  //   header/footer: omitted or true -> default partial, false -> none, 'name' -> that partial
  routes: {
    notfound: '404',
    '/': 'home',
    '/login': { page: 'login', header: false, footer: false },
  },

  protected: ['/account'], // prefix match: '/account' also covers '/account/orders'

  // Overrides only — a page with no entry gets its own name as the title.
  titles: {
    404: 'Page not found',
  },

  stores: { session }, // register new store here
  partials: ['header', 'footer', 'toast'], // register new partial here
  pages: { homePage, loginPage }, // register new page component here

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
