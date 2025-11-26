import express from 'express';
import bodyParser from 'body-parser';

// createApp: small helper to create an express app and mount a router for tests
export function createApp(router) {
  const app = express();
  app.use(bodyParser.json());
  if (router) app.use('/api', router);
  return app;
}

export default createApp;
