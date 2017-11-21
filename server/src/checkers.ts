
import Chalk from 'chalk';

export type Coord = [number, number];

function flatMap<A, B>(items: A[], fn: (a: A) => B[]): B[] {
  let result: B[] = [];
  for(let item of items) {
    let b = fn(item);
    result = result.concat(b);
  }
  return result;
}

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
    //console.log(this.position,position,hopped)

    // update position in board, replace with Empty
    board.setPos(this.position, new Empty());
    // update position in piece
    this.position = position;
    board.setPos(position, this);
    // if an opponent piece was jumped then 
    if(Math.abs(xdiff) > 1) {
      let piece = board.getPos(hopped);
      //console.log(hopped, piece);
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

    // check if becomes king 
    if(this.type === "pawn" && (position[1] === 0 || position[1] === board.height-1)) {
      //replace piece on board with KingPiece
      let king = new KingPiece(this.owner, position);
      board.setPos(position, king);
      board.gamePieces.splice(board.gamePieces.indexOf(this), 1, king);

      return false;
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
    let destination: Coord = [this.position[0]+2 * xdir, this.position[1]+2 * this.direction];
    return piece.type !== "empty"
      && piece.owner !== this.owner
      && board.exists(destination) !== null
      && board.getPos(destination).type === "empty";
  }

  copy(): PawnPiece {
    return new PawnPiece(this.owner, <[number,number]>this.position.slice());
  }
}

export class KingPiece extends Piece {

  constructor(owner: 0 | 1, position: [number, number]) {
    super();
    this.type = "king";
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
    let destination: Coord = [this.position[0]+2 * xdir, this.position[1]+ 2 * ydir];
    return piece.type !== "empty"
      && piece.owner !== this.owner
      && board.exists(destination) !== null
      && board.getPos(destination).type === "empty";
  }


  copy(): KingPiece {
    return new KingPiece(this.owner, <[number,number]>this.position.slice());
  }
}

interface iGameState {
  board: string[][],
  turn: 0 | 1,
  points?: {
    black: number,
    white: number
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
  constructor(h: number = 8, w: number = 8, player_rows = 3, gameState: null | iGameState = null) {
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

    if(gameState === null) {
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
    }else{
      for(let y = 0; y < this.height; y++) {
        this.positions[y] = [];
        for(let x = 0; x < this.width; x++) {
          let piece: Piece | Empty;
          switch(gameState.board[y][x]) {
            case 'b':
              piece = new PawnPiece(0,[x,y]);
              break;
            case 'B':
              piece = new KingPiece(0,[x,y]);
              break;
            case 'w':
              piece = new PawnPiece(1,[x,y]);
              break;
            case 'W':
              piece = new KingPiece(1,[x,y]);
              break;
            default:
              piece = new Empty();
          }
          if(piece.type !== "empty") {
            this.gamePieces.push(piece);
          }
          this.positions[y][x] = piece;
        }
      }
      this.turn = gameState.turn || 0;
      this.points = gameState.points || this.points;
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

  getPlayerMoves(player: 0 | 1): {piece: Piece, moves: [number,number][]}[] {
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
        line += (pos.type === "empty" ? "#" : pos.owner === 0 ? (pos.type === "pawn" ? Chalk.red('b') : Chalk.red("B")) : (pos.type === "pawn" ? Chalk.green("w") : Chalk.green("W"))) + " ";
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
      points: this.points,
      turn: this.turn,
    }

  }

  copy(): Board {
    const board = new Board(this.height, this.width, this.player_rows);
    board.turn = this.turn;
    board.points = Object.assign({}, this.points);
    board.gamePieces = [];

    for(let y = 0; y < this.height; y++) {
      board.positions[y] = [];
      for(let x = 0; x < this.width; x++) {
        let piece = this.positions[y][x].copy();
        if(piece.type !== "empty") {
        board.gamePieces.push(piece)
        }
        board.positions[y][x] = piece;
      }
    }

    return board;
  }

  //scoring function to help ai evaluate board positions
  evaluate(player: 0 | 1): number {
    let score: number = 0;
    if(player === 0) {
      score += 1000 * this.points.black - 600 * this.points.white;
    }else{
      score += 1000 * this.points.white - 600 * this.points.black;
    }
    //console.log("Point Score:", score);

    //increase score if a piece can jump another
    let available_moves = this.getPlayerMoves(player);
    let jump_score = available_moves.reduce((score, pmove) => {
      return pmove.moves.reduce((count, position) => {
        return (Math.abs(pmove.piece.position[0] - position[0]) > 1 ? 1 : 0) + count;
      }, 0) + score;
    }, 0) * 10;

    //console.log("Jump Score:", jump_score);

    //increasing the number of kings
    let king_count = this.gamePieces
      .filter(piece => piece.owner === player)
      .reduce((score, p) => (p.type === "king" ? 30 : 10) + score, 0)
    //console.log("King Score:", king_count);

    //increase score if a piece moves forward
    let position_score = this.gamePieces
      .filter(piece => piece.owner === player)
      .reduce((score, piece) => (player === 0 ? piece.position[1] :  Math.abs(piece.position[1] - (this.height - 1))) + score, 0)
    //console.log("position Score:", position_score);

    return score + jump_score + king_count + position_score;
  }

  minimax(player: 0 | 1, maxDepth: number, currentDepth: number): [number, [Coord, Coord] | null] {
    if(currentDepth ===  maxDepth) {
      return [this.evaluate(player), null]
    }

    let bestMove: [Coord, Coord] | null = null;
    let bestScore: number;
    if(this.turn === player) {
      bestScore = -Infinity;
    }else{
      bestScore = Infinity;
    }

    let playerMoves = this.getPlayerMoves(this.turn);
    let possibleMoves: {piece: Piece, coord: Coord}[] = flatMap(playerMoves, move => {
      return move.moves.map(coord => ({piece: move.piece, coord: coord}));
    });

    for(let move of possibleMoves) {
      let nextboard: Board = this.copy();
      let piece: Piece | Empty = nextboard.getPos(move.piece.position);
      let canJumpAgain: boolean = false;
      if(piece.type === "empty") {
        throw new Error("Attempting to move empty space");
      }else{
        canJumpAgain = piece.moveTo(nextboard, move.coord);
      }

      if(!canJumpAgain) {
        nextboard.turn = nextboard.turn === 0 ? 1 : 0;
      }

      let [currentScore, currentMove] = nextboard.minimax(player, maxDepth, currentDepth+1);

      if(this.turn === player) {
        if(currentScore > bestScore) {
          bestScore = currentScore;
          bestMove = [move.piece.position, move.coord]
        }
      }else{
        if(currentScore < bestScore) {
          bestScore = currentScore;
          bestMove = [move.piece.position, move.coord];
        }
      }
    }

  return [bestScore, bestMove];

  }
}

export class Game {
  board: Board;
  turnSecret: number;

  constructor(gameState: iGameState | undefined = undefined) {
    if(!gameState) {
      this.board = new Board();
    }else{
      this.board = new Board(8,8,3,gameState);
    }
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
