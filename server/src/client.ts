
import * as readline from 'readline';
import * as request from 'request';


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var begin_game = request('http://localhost:3000/api/sample/1', (e,r,b) => {
  let input = "";

  function goAgain() {
    rl.question('Where do you want to move?\n', (answer) => {
      if(answer === "quit") {
        rl.close();
        return;
      }
      //answer = "1,2 3,4"
      let coords = answer.split(" ").map(p => p.split(",").map(Number));
      request.post({
        url:'http://localhost:3000/api/sample/1/0/move',
        json: {move: coords}
      }, (error, response, body) => {
        console.log(body, typeof body);
        if(body.turn == 1) {
          playAi();
        }else{
          goAgain();
        }
      })
    })
  }

  function playAi() {

      request.get('http://localhost:3000/api/sample/1/ai', function(e,r,b) {
        let body = JSON.parse(b);
        if(b.turn == 1) {
          playAi();
        }else{
          goAgain();
        }
      });
  }

  let body = JSON.parse(b);
  
  if(body.turn === 0) {
    goAgain();
  }else{
    playAi();
  }

});


