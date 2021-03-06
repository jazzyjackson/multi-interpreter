var fs = require('fs')
var http = require('http')
var path = require('path')
var spawn = require('child_process').spawn
var figjam = require('./figjam.js')
var interpret = require('./interpret.js')
var bookkeeper = require('../bookkeeper.js')

var handleRequest = (request,response) => ({
    'GET': () => streamFileOrFigtree(request.url.split('?')[0])
                   .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
                   .pipe(response),
    'POST': () => interpret(decodeURI(request.url.split('?')[1]), {cwd: '.' + request.url.split('?')[0]})
                 .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
                 .pipe(response),
    'PUT': () => request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
                        .on('finish', () => { response.writeHead(201); response.end() })
                        .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) }),
    'DELETE': () => fs.unlink('.' + request.url, err => { response.writeHead( err ? 500 : 204); response.end(JSON.stringify(err))})
})[request.method]()

/* if a file is requested, stream it right back */
/* but if there's no pathname a.k.a. '/' index route, read figtree.json and concatanate files in a continuous stream */ 
function streamFileOrFigtree(pathname){
    return pathname.slice(-1) == '/' ? figjam('figtree.json')
                                     : fs.createReadStream(pathname.slice(1))
}

/* This works whether you call it as a standalone process, or import the function as a module */
/* node interpret hello */
var switchboardCalledDirectly = process.argv[1].split(path.sep).slice(-1)[0].includes('switchboard')

if(switchboardCalledDirectly){
    var server = http.createServer()
    server.listen()
    server.on('listening', () => console.log(server.address().port))
    server.on('request', handleRequest)
}

/* require('./interpret')('hello') */
module.exports = handleRequest