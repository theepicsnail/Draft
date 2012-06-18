#!/usr/bin/node

var http = require('http');
var fs = require('fs');
var sockjs = require('sockjs');
var node_static = require('node-static');

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


var count = 0;
sockjs_server.on('connection', function(socket) {
    sockets.push(socket);
    socket.write(JSON.stringify({'type':'sync','objects':objects,'users':sockets.length}));
    socket.on('data', function(message) {
        function pushUpdate(){
            for (var i in sockets){
                if (sockets[i] == socket) continue;
                console.log("Pushing message:"+count);
                count = count + 1;
                sockets[i].write(
                JSON.stringify(
                    {'type':'sync','objects':objects,'users':sockets.length}
                    ));
            }
        }

        var data = JSON.parse(message);
        console.log(message);
        switch(data.type){
        case 'update':
            objects[data.object][data.id]=data.val
        break;
        case 'push':
            objects[data.object].push(data.val)    
        break;
        }
        pushUpdate();
        
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
