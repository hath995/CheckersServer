import * as express from 'express';
import * as cors from 'cors';
import { apiRouter } from './api';
import { appMiddleware, errorHandler } from './middleware';
import logger from './util/logger';

let app = express();
app.use(cors());
app.use(appMiddleware(app));
app.use('/api', apiRouter);
app.use(errorHandler);

export default app;
