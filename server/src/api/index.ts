import { Router } from 'express';
import { gameRouter } from './game/game.router';

let router = Router();
router.use('/game', gameRouter);

export let apiRouter = router;

