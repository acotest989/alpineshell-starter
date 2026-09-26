// init() runs every time the route renders home.html
export const homePage = () => ({
  loadedAt: null,

  included: [
    {
      where: 'pb_hooks/ + pb_migrations/',
      title: 'A backend, in one binary',
      detail: 'The database, auth and API in one binary that serves this page too — no second process, no CORS. Extend it with JavaScript hooks, or in Go when those run out.',
    },
    {
      where: 'services/auth.js',
      title: 'Accounts, none of them stubbed',
      detail: 'Register, verify by email, reset a password, change name, email or password, delete the account. /account is guarded, and easy to extend with OAuth2 and the other options in PocketBase settings.',
    },
    {
      where: 'Dockerfile',
      title: 'Ready to deploy',
      detail: 'One image with the binary, the migrations and this frontend inside. Everything lives in pb_data, so the volume is the deployment — and fly.toml has one host spelled out.',
    },
  ],

  steps: [
    {
      where: 'pages/',
      title: 'Add a page',
      detail: 'about.html + about.js, then a line each in main.js: routes and pages.',
    },
    {
      where: 'services/',
      title: 'Fetch data',
      detail: 'A service knows the endpoint and turns what comes back into your own shape. Pages see neither.',
    },
    {
      where: 'stores/',
      title: 'Share state',
      detail: 'Anything that outlives a route, or that code outside Alpine has to write.',
    },
    {
      where: 'lib/',
      title: 'Add a helper',
      detail: 'helpers.js takes the ones with no subject yet. Import it where you need it, or hang it on app.js and every template can call it.',
    },
  ],

  init() {
    this.loadedAt = new Date();
  },
});
