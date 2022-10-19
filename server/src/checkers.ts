
let Chalk = require('chalk');

export type Coord = [number, number];
export const BLACK = 0;
export const WHITE = 1;

export const X = 0;
export const Y = 1;

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

  constructor() {
    this.type = "pawn";
    this.owner = 0;
    this.position = [0,0];
    this.direction = 1;
  }
  abstract getAvailableMoves(board: Board): [number, number][];
  abstract copy(): Piece;

  moveTo(board: Board, position: [number, number]): boolean {

    let xdiff = position[X] - this.position[X], ydiff = position[Y] - this.position[Y];
    let hopped: [number, number] = [this.position[X] + xdiff/2, this.position[Y] + ydiff/2];
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
        if(piece.owner === BLACK) {
          board.points.white++;
        }else{
          board.points.black++;
        }
        // - remove piece from board, 
        // - replace with Empty
        board.setPos(hopped, new Empty());
        board.gamePieces.splice(board.gamePieces.indexOf(piece), 1);

        // check if becomes king 
        if(this.type === "pawn" && (position[Y] === 0 || position[Y] === board.height-1)) {
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
    if(this.type === "pawn" && (position[Y] === 0 || position[Y] === board.height-1)) {
      //replace piece on board with KingPiece
      let king = new KingPiece(this.owner, position);
      board.setPos(position, king);
      board.gamePieces.splice(board.gamePieces.indexOf(this), 1, king);
    }
    return false;
  }

  canJump(board: Board, piece: Piece | Empty, jumpPosition: Coord): boolean {
    return piece.type !== "empty"
      && piece.owner !== this.owner
      && board.exists(jumpPosition) !== null
      && board.getPos(jumpPosition).type === "empty";
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
      const possiblePosition: [number, number] = [this.position[X]+newx, this.position[Y]+this.direction];
      if(board.exists(possiblePosition) !== null) {
        const boardPos = board.getPos(possiblePosition);
        const jumpPosition: [number, number] = [this.position[X]+2 * newx, this.position[Y]+2 * this.direction];
        if(boardPos.type === "empty") {
          options.push(possiblePosition);
        } else if(this.canJump(board, boardPos, jumpPosition)) {
          options.push(jumpPosition);
        }
      }
    }
    return options;
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
        const possiblePosition: [number, number] = [this.position[X]+xdir, this.position[Y]+ydir];
        if(board.exists(possiblePosition) !== null) {
          const boardPos = board.getPos(possiblePosition);
          let jumpPosition: [number, number] = [this.position[X]+2 * xdir, this.position[Y]+ 2 * ydir];
          if(boardPos.type === "empty") {
            options.push(possiblePosition);
          } else if(this.canJump(board, boardPos, jumpPosition)) {
            options.push(jumpPosition);
          }
        }
      }
    }
    return options;
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
  replay: [Coord, Coord][] = [];
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
        let color: 0 | 1 = y < player_rows ? BLACK : WHITE;
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
              piece = new PawnPiece(BLACK, [x,y]);
              break;
            case 'B':
              piece = new KingPiece(BLACK, [x,y]);
              break;
            case 'w':
              piece = new PawnPiece(WHITE, [x,y]);
              break;
            case 'W':
              piece = new KingPiece(WHITE, [x,y]);
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
      this.turn = gameState.turn || BLACK;
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
    let jumps = false;
    let moves = this.gamePieces
      .filter(piece => piece.owner === player)
      .map(piece => {
        let availableMoves = piece.getAvailableMoves(this);
        if(!jumps && availableMoves.some(m => Math.abs(piece.position[X]-m[0]) > 1)) {
          jumps = true;
        }
        return {piece, moves: availableMoves}
      }).
      filter(o => o.moves.length > 0)

    if(jumps) {
      moves = moves.map(o => {
        let coords = o.moves.filter(m => Math.abs(o.piece.position[X]-m[0]) > 1);
        return {piece: o.piece, moves: coords};
      }).filter(o => o.moves.length > 0);
    }
    return moves;
  }

  print() {
    let result = "0 1 2 3 4 5 6 7 \n";
    for(let y = 0; y < this.height; y++) {
      let line = "";
      for(let x = 0; x < this.width; x++) {
        const pos = this.getPos([x,y]);
        line += (pos.type === "empty" ? "#" : pos.owner === BLACK ? (pos.type === "pawn" ? Chalk.red('b') : Chalk.red("B")) : (pos.type === "pawn" ? Chalk.green("w") : Chalk.green("W"))) + " ";
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
        board[y][x] = pos.type === "empty" ? "#" : pos.owner === BLACK ? (pos.type === "pawn" ? "b" : "B") : (pos.type === "pawn" ? "w" : "W");
      }
    }
    return {
      board,
      points: this.points,
      replay: this.replay,
      turn: this.turn,
    }

  }

  copy(): Board {
    const board = new Board(this.height, this.width, this.player_rows);
    board.turn = this.turn;
    board.points = Object.assign({}, this.points);
    board.gamePieces = [];
    board.replay = this.replay.slice();

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
    if(player === BLACK) {
      score += 1000 * this.points.black - 600 * this.points.white;
    }else{
      score += 1000 * this.points.white - 600 * this.points.black;
    }
    //console.log("Point Score:", score);

    //increase score if a piece can jump another
    let available_moves = this.getPlayerMoves(player);
    let jump_score = available_moves.reduce((score, pmove) => {
      return pmove.moves.reduce((count, position) => {
        return (Math.abs(pmove.piece.position[X] - position[X]) > 1 ? 1 : 0) + count;
      }, 0) + score;
    }, 0) * 10;

    //console.log("Jump Score:", jump_score);

    //increasing the number of kings
    let king_count = this.gamePieces
      .filter(piece => piece.owner === player)
      .reduce((score, p) => (p.type === "king" ? 30 : 10) + score, 0)
    //console.log("King Score:", king_count);

    let opposing_pieces = this.gamePieces.filter(piece => piece.owner === (player === BLACK ? WHITE : BLACK));
    //increase score if a piece moves forward
    let position_score = this.gamePieces
      .filter(piece => piece.owner === player)
      .reduce((score, piece) => {
        if(piece.type === "king") {
            return opposing_pieces
              .map(enemy => 20 - Math.max(Math.abs(enemy.position[X]-piece.position[X]), Math.abs(enemy.position[Y]-piece.position[Y])))
              .reduce((distancePoints, points) => Math.max(distancePoints, points)) + score;
        }else{
          if(player === BLACK) { 
              return piece.position[Y] + score
          }else{ 
              return Math.abs(piece.position[Y] - (this.height - 1)) + score
          }
        }
      }, 0)
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
        nextboard.turn = nextboard.turn === BLACK ? WHITE : BLACK;
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
  players: [boolean, boolean];

  constructor(gameState: iGameState | undefined = undefined) {
    this.turnSecret = 1;
    if(!gameState) {
      this.board = new Board();
    }else{
      this.board = new Board(8,8,3,gameState);
    }
    this.players = [false, false];
    this.updateTurnSecret();
  }

  getPlayer() {
    for(let color of [BLACK, WHITE]) {
      if(!this.players[color]) {
        this.players[color] = true;
        return color;
      }
    }
    return null;
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
