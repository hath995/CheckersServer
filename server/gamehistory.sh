curl http://localhost:3000/api/sample/1/;
curl -H "Content-Type: application/json" -d '{"move":[[1,2],[2,3]]}' http://localhost:3000/api/sample/1/0/move;
curl -H "Content-Type: application/json" -d '{"move":[[4,5],[3,4]]}' http://localhost:3000/api/sample/1/1/move;
curl -H "Content-Type: application/json" -d '{"move":[[3,2],[4,3]]}' http://localhost:3000/api/sample/1/0/move;
curl -H "Content-Type: application/json" -d '{"move":[[2,5],[1,4]]}' http://localhost:3000/api/sample/1/1/move;
curl -H "Content-Type: application/json" -d '{"move":[[4,3],[2,5]]}' http://localhost:3000/api/sample/1/0/move;
