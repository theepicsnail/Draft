#!/usr/bin/node

var http = require('http');
var fs = require('fs');
var sockjs = require('sockjs');
var node_static = require('node-static');
var Canvas = require('canvas')
var draft = require('./draft.js')

var static_dir = new node_static.Server(__dirname);

var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.2.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var http_server = http.createServer();

var port = process.argv[2] || 12345;

var host = '0.0.0.0';

var sockets = [];

var objects = {'points':[], 'lines':[], 'circles':[]}

function Point(x,y){
    ret = new Object();
    ret.x = x;
    ret.y = y;
    return ret;
}
function Line(p1, p2){
    ret = new Object();
    ret.p1 = p1;
    ret.p2 = p2;
    return ret;
}
function Circle(center, p2){
    return Line(center, p2);
}

objects.points.push(Point(50,80));
objects.points.push(Point(80,30));
objects.points.push(Point(100,100));
objects.lines.push(Line(0,1));
objects.lines.push(Line(2,1));
objects.lines.push(Line(0,2));
objects.circles.push(Circle(0,1));



sockjs_server.on('connection', function(socket) {
    sockets.push(socket);
    socket.write(JSON.stringify({'type':'sync','objects':objects,'users':sockets.length}));
    socket.on('data', function(message) {
        var data = JSON.parse(message);
        draft.path = []
        if (data.type == 'path'){
            while(data.path.length > 0){
                var item = data.path.pop()
                draft.path.push(item);
                console.log(draft.brushes);
                console.log(item);
                if (draft.path.length > 1){
                    draft.brushes[item.b].draw(item)
                }
            };
            for (var i in sockets){
                if (sockets[i] == socket) continue;
                sockets[i].write(message);
            }
        }
    });
    socket.on('end', function() {
        var i = sockets.indexOf(socket)
        sockets.splice(i,1)
    });
});

setInterval(function(){
    var message = JSON.stringify({'type':'stats','usercount':sockets.length});
    for (var i in sockets){
        sockets[i].write(message);
    }
},10000)

http_server.addListener('request', function(req, res) {
     static_dir.serve(req, res);
});

http_server.addListener('upgrade', function(req, res) {
     res.end();
});

sockjs_server.installHandlers(http_server, {prefix:'/sjs'});

http_server.listen(port, host);

console.log('draft is listening on '+host+':'+port)
