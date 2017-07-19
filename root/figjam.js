// creates a readable stream from a figtree - a configuration graph in JSON
// continuous stream that allows the browser to start painting ASAP
// but retains original file format
// I don't attempt to graph all possible HTML configurations
// just my own design - styles and scripts saved locally, + arbitrary blocks in the head
// the body is a graph 
// this version only handles a flat body, body object with properties which will be converted to divs with classname same as property name

//but by the time this code calls babel, the style and graph will have already been served, so it will be a subtle delay between page loading and page becoming active

/* an example figtree */
var fs = require('fs')
var path = require('path')
var { PassThrough } = require('stream')

async function figjam(figtreeFilename, jam){ //jam, a readable stream
    /* Whatever filepath is given to figjam, assume the paths are relative to that filename, so, copy the filepath */
    var figtree = JSON.parse(fs.readFileSync(figtreeFilename)) // this should happen very fast, but it would be nice to await readFile once I'm on node 8.
    var figDirectory = figtreeFilename.split('/').slice(0,-1).join('/')
    /* push the head and the style sheets */
    jam.push('<html><head>')
    for(var thisStyle of figtree.styles) {
        jam.push(`<style filename="${thisStyle}">\n`)
        var thisStyleFilePath = path.join(figDirectory,'gui',thisStyle)
        await promise2pipe(thisStyleFilePath, jam)
        jam.push(`</style>\n`)
    }
    /* followed by any other nodes in the head. Link, Title, Meta, etc. */
    for(var node in figtree.head){
        jam.push(`<${node} `)
        for(var attribute in figtree.head[node]){
            jam.push(`${attribute}="${figtree.head[node][attribute]}" `)
        }
        jam.push(`/>\n`)
    }
    /* finished with head. Render the graph of the body object */
    jam.push('</head><body>')
    for(var block in figtree.body){
        jam.push(`<div class="${block}"`)
        for(var attribute in figtree.body[block]){
            jam.push(` ${attribute}="${figtree.body[block][attribute]}"`)
        }
        jam.push(`></div>\n`)
    }
    /* before ending the body tag, append a script tag for every javascript file */
    for(var thisScript of figtree.scripts){
        jam.push(`<script filename="${thisScript}">\n`)
        var thisScriptFilePath = path.join(figDirectory,'gui',thisScript)
        /* if you needed to transpile, this is a good place
        just launch a child process to run Babel on the script and push that */
        await promise2pipe(thisScriptFilePath, jam)
        jam.push(`</script>\n`)
    }
    jam.push('</body></html>')
    jam.push(null)
}

function promise2pipe(filename, readable){
    return new Promise((resolve, reject) => {
        filestream = fs.createReadStream(filename)
                       .on('end', resolve)
                       .on('error', reject)
                       .pipe(readable, {end: false})
    })
}

var figjamCalledDirectly = process.argv[1].split(path.sep).slice(-1)[0] == 'figjam'

if(figjamCalledDirectly && process.argv[2]){
    var jam = new PassThrough
    figjam(process.argv[2], jam)
    jam.pipe(process.stdout)
}

module.exports = filename => {
    var jam = new PassThrough
    figjam(filename, jam)
    return jam
}