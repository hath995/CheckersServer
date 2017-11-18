
import Chalk from 'chalk';

export type Coord = [number, number];

export class Empty {
  type: "empty";
  constructor() {
    this.type = "empty";
  }
  copy(): Empty {
    return new Empty();
  }
}

export abstract class Piece {
  type: "pawn" | "king";
  owner: 0 | 1;
  position: [number, number];
  direction: -1 | 1;

  abstract getAvailableMoves(board: Board): [number, number][];
  abstract copy(): Piece;

  moveTo(board: Board, position: [number, number]): boolean {

    let xdiff = position[0] - this.position[0], ydiff = position[1] - this.position[1];
    let hopped: [number, number] = [this.position[0] + xdiff/2, this.position[1] + ydiff/2];
    console.log(this.position,position,hopped)

    // update position in board, replace with Empty
    board.setPos(this.position, new Empty());
    // update position in piece
    this.position = position;
    board.setPos(position, this);
    // if an opponent piece was jumped then 
    if(Math.abs(xdiff) > 1) {
      let piece = board.getPos(hopped);
      console.log(hopped, piece);
      if(piece.type === "pawn" || piece.type === "king") {
        // increment points for owner
        if(piece.owner === 0) {
          board.points.white++;
        }else{
          board.points.black++;
        }
        // - remove piece from board, 
        // - replace with Empty
        board.setPos(hopped, new Empty());
        board.gamePieces.splice(board.gamePieces.indexOf(piece), 1);

        // check if becomes king 
        if(this.type === "pawn" && (position[1] === 0 || position[1] === board.height-1)) {
          //replace piece on board with KingPiece
          let king = new KingPiece(this.owner, position);
          board.setPos(position, king);
          board.gamePieces.splice(board.gamePieces.indexOf(this), 1, king);

          return false;
        }

        // check if can jump again 
        return this.getAvailableMoves(board).some(p => Math.abs(this.position[0]-p[0]) > 1);
      }else {
        throw new Error("Cannot jump empty square");
      }
    }
    return false;
  }
}

export class PawnPiece extends Piece {
  constructor(owner: 0 | 1, position: [number, number]) {
    super();
    this.type = "pawn";
    this.position = position;
    this.owner = owner;
    this.direction = owner ? -1 : 1;
  }

  getAvailableMoves(board: Board): [number,number][] {
    let options = [];
    for(let newx of [1,-1]) {
      const possiblePosition: [number, number] = [this.position[0]+newx, this.position[1]+this.direction];
      if(board.exists(possiblePosition) !== null) {
        const boardPos = board.getPos(possiblePosition);
        if(boardPos.type === "empty") {
          options.push(possiblePosition);
        } else if(this.canJump(board, boardPos, newx)) {
          let jumpPosition: [number, number] = [this.position[0]+2 * newx, this.position[1]+2 * this.direction];
          options.push(jumpPosition);
        }
      }
    }
    return options;
  }

  canJump(board: Board, piece: Piece | Empty, xdir: number): boolean {
    return piece.type !== "empty"
      && piece.owner !== this.owner
      && board.getPos([this.position[0]+2 * xdir, this.position[1]+2 * this.direction]).type === "empty";
  }

  copy(): PawnPiece {
    return new PawnPiece(this.owner, <[number,number]>this.position.slice());
  }
}

export class KingPiece extends Piece {

  constructor(owner: 0 | 1, position: [number, number]) {
    super();
    this.type = "pawn";
    this.position = position;
    this.owner = owner;
  }

  getAvailableMoves(board: Board): [number,number][] {
    let options = [];
    for(let xdir of [1,-1]) {
      for(let ydir of [1,-1]) {
        const possiblePosition: [number, number] = [this.position[0]+xdir, this.position[1]+ydir];
        if(board.exists(possiblePosition) !== null) {
          const boardPos = board.getPos(possiblePosition);
          if(boardPos.type === "empty") {
            options.push(possiblePosition);
          } else if(this.canJump(board, boardPos, xdir, ydir)) {
            let jumpPosition: [number, number] = [this.position[0]+2 * xdir, this.position[1]+ 2 * ydir];
            options.push(jumpPosition);
          }
        }
      }
    }
    return options;
  }

  canJump(board: Board, piece: Piece | Empty, xdir: number, ydir: number): boolean {
    return piece.type !== "empty"
      && piece.owner !== this.owner
      && board.getPos([this.position[0]+2 * xdir, this.position[1]+ 2 * ydir]).type === "empty";
  }


  copy(): KingPiece {
    return new KingPiece(this.owner, <[number,number]>this.position.slice());
  }
}

export class Board {
  positions: (Empty | Piece)[][];
  width: number;
  height: number;
  gamePieces: Piece[];
  player_rows: number;
  turn: 0 | 1; //0 is Black , 1 is White
  points: {
    black: number,
    white: number
  };
  constructor(h: number = 8, w: number = 8, player_rows = 3, positions = null) {
    this.width = w;
    this.height = h;
    this.positions = [];
    this.gamePieces = [];
    this.player_rows = player_rows;
    this.turn = 0;
    this.points = {
      black: 0,
      white: 0
    }

    if(positions === null) {
      for(let y = 0; y < this.height; y++) {
        let color: 0 | 1 = y < player_rows ? 0 : 1;
        this.positions[y] = [];

        for(let x = 0; x < this.width; x++) {
          if((x % 2 == 1 && y % 2 == 0 || x % 2 == 0 && y % 2 == 1) && Math.min(y, this.height-1-y) < player_rows) {
            const piece = new PawnPiece(color, [x,y]);
            this.positions[y][x] = piece;
            this.gamePieces.push(piece);
          }else{
            this.positions[y][x] = new Empty();
          }
        }
      }
    }
  }

  setPos([x,y]: [number, number], piece: Empty | Piece): void {
    this.positions[y][x] = piece;
  }

  getPos([x,y]: [number, number]): Empty | Piece {
    return this.positions[y][x];
  }

  exists([x, y]: [number, number]): [number, number] | null {
    if(x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return [x,y];
    }
    return null;
  }

  getPlayerMoves(player: 0 | 1) {
    return this.gamePieces
          .filter(piece => piece.owner === player)
          .map(piece => ({piece, moves: piece.getAvailableMoves(this)})).
          filter(o => o.moves.length > 0)
  }

  print() {
    let result = "0 1 2 3 4 5 6 7 \n";
    for(let y = 0; y < this.height; y++) {
      let line = "";
      for(let x = 0; x < this.width; x++) {
        const pos = this.getPos([x,y]);
        line += (pos.type === "empty" ? "#" : pos.owner === 0 ? Chalk.red("B") : Chalk.green("W")) + " ";
      }
      result += line + ` ${y}\n`;
    }
    console.log(result);
  }

  json(): any {
    let board: string[][] = [];
    for(let y = 0; y < this.height; y++) {
      board[y] = [];
      for(let x = 0; x < this.width; x++) {
        const pos = this.getPos([x,y]);
        board[y][x] = pos.type === "empty" ? "#" : pos.owner === 0 ? (pos.type === "pawn" ? "b" : "B") : (pos.type === "pawn" ? "w" : "W");
      }
    }
    return {
      board,
      turn: this.turn,
    }

  }

  copy(): Board {
    const board = new Board(this.height, this.width, this.player_rows);
    board.turn = this.turn;
    board.points = Object.assign({}, this.points);

    for(let y = 0; y < this.height; y++) {
      board.positions[y] = [];
      for(let x = 0; x < this.width; x++) {
        board.positions[y][x] = this.positions[y][x].copy();
      }
    }

    return board;
  }
}

export class Game {
  board: Board;
  turnSecret: number;

  constructor() {
    this.board = new Board();
    this.updateTurnSecret();
  }
  
  json() {
    return this.board.json();
  }

  updateTurnSecret(): void {
    this.turnSecret = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }

}

export function playGame(board: Board, actions: [Coord, Coord][]) {

  board.print();
  for(let action of actions) {
    let piece = board.getPos(action[0]);
    if(piece.type !== "empty") {
      piece.moveTo(board, action[1]);
    }
    board.print();
  }

}

//var myboard = new Board();
////myboard.print();

//var moves: [Coord, Coord][] = [[[1,2],[2,3]], [[2,5],[3,4]], [[3,2],[4,3]], [[6,5],[5,4]]]
//playGame(myboard, moves);


//myboard.gamePieces
  //.filter(p => p.owner === 1)
  //.filter(p => p.getAvailableMoves(myboard).length > 0)
  //.map(p => console.log(p.position, p.getAvailableMoves(myboard)))
