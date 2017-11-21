"use strict";
exports.__esModule = true;
var readline = require("readline");
var request = require("request");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var begin_game = request('http://localhost:3000/api/sample/1', function (e, r, b) {
    var input = "";
    function goAgain() {
        rl.question('Where do you want to move?\n', function (answer) {
            if (answer === "quit") {
                rl.close();
                return;
            }
            //answer = "1,2 3,4"
            var coords = answer.split(" ").map(function (p) { return p.split(",").map(Number); });
            request.post({
                url: 'http://localhost:3000/api/sample/1/0/move',
                json: { move: coords }
            }, function (error, response, body) {
                console.log(body, typeof body);
                if (body.turn == 1) {
                    playAi();
                }
                else {
                    goAgain();
                }
            });
        });
    }
    function playAi() {
        request.get('http://localhost:3000/api/sample/1/ai', function (e, r, b) {
            var body = JSON.parse(b);
            if (b.turn == 1) {
                playAi();
            }
            else {
                goAgain();
            }
        });
    }
    var body = JSON.parse(b);
    if (body.turn === 0) {
        goAgain();
    }
    else {
        playAi();
    }
});
