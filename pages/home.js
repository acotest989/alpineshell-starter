// init() runs every time the route renders home.html
export const homePage = () => ({
  loadedAt: null,

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
