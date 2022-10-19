# Checkers Node API Server

## Prerequisite
- npm install

## Commands
1. `npm start` - Starts the node server using  using ts-node
2. `npm run build` - Builds the application and puts the generated javascript files into dist folder
3. `npm run build:live` - server will run and restart upon code changes

## Route Reference

### GET Routes

1. `/api/game/:id` - supplying an id will start a new checkers game with that id, or return the state of the board
2. `/api/game/:id/player` - returns the current player turn for the given game id
3. `/api/game/:id/ai` - If it is the AI's turn it will pick a "good" move, it will return the new state of the board and the current turn 
4. `/api/game/:id/:player/move` - will get a list of the valid moves for the given player in the given game id


### POST Routes

1. `/api/game/:id/:player/move` - posting a move for a given player, will return the new state of the board and the current turn
