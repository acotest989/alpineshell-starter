// init() runs every time the route renders home.html
export const homePage = () => ({
  loadedAt: null,

  included: [
    {
      where: 'server/',
      title: 'A backend, in one binary',
      detail: 'PocketBase holds the database, auth and API — and serves this page, so there is no second process and no CORS.',
    },
    {
      where: 'services/auth.js',
      title: 'Accounts, none of them stubbed',
      detail: 'Register, verify by email, reset a password, change name, email or password, delete the account. /account is guarded.',
    },
    {
      where: 'server/Dockerfile',
      title: 'Ready to deploy',
      detail: 'One image with the binary, the migrations and this frontend. Everything lives in pb_data, so the volume is the deployment.',
    },
  ],

  steps: [
    {
      where: 'pages/',
      title: 'Add a page',
      detail: 'about.html + about.js, then one line in main.js: routes and pages.',
    },
    {
      where: 'services/ + models/',
      title: 'Fetch data',
      detail: 'The service knows the endpoint, the model maps the response. Pages see neither.',
    },
    {
      where: 'stores/',
      title: 'Share state',
      detail: 'Anything that outlives a route, or that code outside Alpine has to write.',
    },
  ],

  init() {
    this.loadedAt = new Date();
  },
});
