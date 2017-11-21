import { Request, Response, NextFunction } from 'express';
import {Game, Board, BLACK, WHITE} from '../../checkers';

let Games: Game[] = [];
let DEBUG = false;
export let controller = {
    getById: (req: Request, res: Response, next: NextFunction) => {
        let gId = req.params.id; 
        if(!Games[gId]) {
        
          if(DEBUG) {
            Games[gId] = new Game({"board":[["#","b","#","#","#","#","#","#"],["#","#","b","#","#","#","#","#"],["#","b","#","b","#","w","#","b"],["w","#","#","#","#","#","#","#"],["#","#","#","b","#","#","#","b"],["#","#","#","#","#","#","b","#"],["#","#","#","#","#","#","#","#"],["#","#","#","#","#","#","#","#"]],"turn":1});
          }else{
            Games[gId] = new Game();
          }
        }
        Games[gId].board.print();
        res.json(Games[gId].json());
        next();
    },
    get: (req: Request, res: Response, next: NextFunction) => {
        res.json({hello: true});
        next();
    },
    delete: (req: Request, res: Response, next: NextFunction) => {
        res.json({ok: true});
        next();
    },
    getPlayer: (req: Request, res: Response, next: NextFunction) => {
      let gId: number = req.params.id;
      let game = Games[gId];
      res.json({player: Games[gId].getPlayer()});
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
        //console.log("SUGGESTED MOVE", game.board.minimax(player, 4, 0));

        let piece = game.board.getPos(move[0]);
        if(piece.type !== "empty" && piece.owner === player) {
          let canJumpAgain = piece.moveTo(game.board, move[1]);
          game.board.replay.push(move);
          //if(piece.position[0] != move[1][0] || piece.position[1] != move[1][1]) {
            //console.log("ERROR PIECE POSITION NOT UPDATED", piece);
          //}
          game.board.print();
          result = game.json();
          if(!canJumpAgain) {
            game.board.turn = game.board.turn === BLACK ? WHITE : BLACK;
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
    ai: (req: Request, res: Response, next: NextFunction) => {
      let gId: number = req.params.id;
      let result: any = {};
      if(1 === Games[gId].board.turn) {
        let game = Games[gId];
        let now: any = new Date();
        let [score,move] = game.board.minimax(1, 5, 0);
        console.log(score,move);
        console.log("DEPTH 2", (<any>new Date())-<number>now);
        if(move === null) {
          throw new Error("null move illegal");
        }
        console.log("SUGGESTED MOVE", move, score);

        let piece = game.board.getPos(move[0]);
        if(piece.type !== "empty" && piece.owner === 1) {
          let canJumpAgain = piece.moveTo(game.board, move[1]);
          game.board.replay.push(move);
          //if(piece.position[0] != move[1][0] || piece.position[1] != move[1][1]) {
            //console.log("ERROR PIECE POSITION NOT UPDATED", piece);
          //}
          game.board.print();
          result = game.json();
          if(!canJumpAgain) {
            game.board.turn = game.board.turn === BLACK ? WHITE : BLACK;
            result.turn = game.board.turn
          }else{
            result.moves = game.board.getPlayerMoves(1);
          }

        }
      }
      console.log("Score", Games[gId].board.evaluate(1));

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
