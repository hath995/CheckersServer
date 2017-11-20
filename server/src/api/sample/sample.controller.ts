import { Request, Response, NextFunction } from 'express';
import {Game, Board} from '../../checkers';

console.log("haa??");
let Games: Game[] = [];
export let controller = {
    getById: (req: Request, res: Response, next: NextFunction) => {
        let gId = req.params.id; 
        if(!Games[gId]) {
          Games[gId] = new Game();
        }
        res.json(Games[gId].json());
        next();
    },
    get: (req: Request, res: Response, next: NextFunction) => {
        res.json({hello: true});
        next();
    },
    put: (req: Request, res: Response, next: NextFunction) => {
        res.json({ok: true});
        next();
    },
    delete: (req: Request, res: Response, next: NextFunction) => {
        res.json({ok: true});
        next();
    },
    playMove: (req: Request, res: Response, next: NextFunction) => {
      let player: 0 | 1 = <0 | 1>Number(req.params.player);
      let gId: number = req.params.id;
      console.log(req.body, "Body");
      let move: [[number, number],[number, number]] = req.body.move;
      let result: any = {};
      if(player === Games[gId].board.turn) {
        let game = Games[gId];
        console.log("SUGGESTED MOVE", game.board.minimax(player, 2, 0));

        let piece = game.board.getPos(move[0]);
        if(piece.type !== "empty" && piece.owner === player) {
          let canJumpAgain = piece.moveTo(game.board, move[1]);
          //if(piece.position[0] != move[1][0] || piece.position[1] != move[1][1]) {
            //console.log("ERROR PIECE POSITION NOT UPDATED", piece);
          //}
          game.board.print();
          result = game.json();
          if(!canJumpAgain) {
            game.board.turn = game.board.turn === 0 ? 1 : 0;
            result.turn = game.board.turn
          }else{
            result.moves = game.board.getPlayerMoves(player);
          }

        }
      }
      console.log("Score", Games[gId].board.evaluate(player));

      res.json(result);
      next();
    },
    getMove: (req: Request, res: Response, next: NextFunction) => {
      let player: number = Number(req.params.player);
      let gId: number = req.params.id;
      if(player === Games[gId].board.turn) {
        let states = Games[gId].json();
        let moves = Games[gId].board.getPlayerMoves(player);
        res.json({moves});
      }else{
        res.json({moves:[]})
      }
      next();
    }
};
