curl http://localhost:3000/api/sample/1/;
curl -H "Content-Type: application/json" -d '{"move":[[5,2],[4,1]]}' http://localhost:3000/api/sample/1/1/move;
curl -H "Content-Type: application/json" -d '{"move":[[6,5],[7,6]]}' http://localhost:3000/api/sample/1/0/move;
curl -H "Content-Type: application/json" -d '{"move":[[4,1],[5,0]]}' http://localhost:3000/api/sample/1/1/move;
