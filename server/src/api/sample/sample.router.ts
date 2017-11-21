import { Router } from 'express';
import { controller } from './sample.controller';
import * as bodyParser from 'body-parser';

let router = Router();

router.route('/')
    .get(controller.get)
console.log("EH?");

router.route('/:id')
    .get(controller.getById)
    .delete(controller.delete);

router.route('/:id/ai')
    .get(controller.ai);

router.route('/:id/:player/move')
    .post(bodyParser.json(), controller.playMove)
    .get(controller.getMove);

export let sampleRouter = router;
