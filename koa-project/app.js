const Koa = require('koa')
const app = new Koa()

const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const svgDatabase = require('./service/mysql')
// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text'],
  multipart: true
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))


app.listen(1129);
console.log('App started at port 1129...');
// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

const Ws = require('ws');
const server = new Ws.Server({ port: 8000 });
server.on('open', handleOpen);
server.on('close', handleClose);
server.on('error', handleError);
server.on('connection', handleConnection);
function handleOpen() {
  console.log('BE: WebSocket open')
}
function handleClose() {
  console.log('BE: WebSocket close')
}
function handleError() {
  console.log('BE: WebSocket error')
}
function handleConnection(ws) {
  console.log('BE: WebSocket connection');
  ws.on('message', handleMessage);
}
function handleMessage(msg) {

  const jsonObj = JSON.parse(msg);
  const op = jsonObj.op
  const font = jsonObj.font
  const word = jsonObj.word
  if (op == 'i') {
    svgDatabase.findSvg([font,word]).then(res => {
      for (let e of res) {
        e.op = 'edit'
        server.clients.forEach((c) => {
          c.send(JSON.stringify(e));
        })
      }
    })
  }
  else if (op == 'preview') {
    svgDatabase.findSvg([font,word]).then(res => {
      for (let e of res) {
        e.op = 'preview'
        server.clients.forEach((c) => {
          c.send(JSON.stringify(e));
        })
      }
      // console.log("preview:",word)
      var jsonObj = {op:"previewEnd",font:font,word:word};
      server.clients.forEach((c) => {
        c.send(JSON.stringify(jsonObj));
      })
    })
  }
  else if (op == 'Fontpreview') {
    svgDatabase.findSvg([font,word]).then(res => {
      for (let e of res) {
        e.op = 'Fontpreview'
        server.clients.forEach((c) => {
          c.send(JSON.stringify(e));
        })
      }
      var jsonObj = {op:"FontpreviewEnd",font:font,word:word};
      server.clients.forEach((c) => {
        c.send(JSON.stringify(jsonObj));
      })
    })
  }
  else if (op == 'edit') {
    const svg_id = jsonObj.svg_id
    const valuesArr = Object.values(jsonObj.svg[0]);
    const startPointX = valuesArr[0]
    const startPointY = valuesArr[1]
    const endPointX = valuesArr[2]
    const endPointY = valuesArr[3]
    const lines = JSON.stringify(valuesArr[4])
    const isClose = valuesArr[5].toString()
    const fill = jsonObj.fill.toString()
    const arr = [startPointX, startPointY, endPointX, endPointY, lines, isClose,fill, font,word, svg_id]
    svgDatabase.updateSvg(arr)
    let e = new Object()
    e.op = 'edit'
    e.svg_id = svg_id
    e.font = font
    e.word = word
    e.startPointX = startPointX
    e.startPointY = startPointY
    e.endPointX = endPointX
    e.endPointY = endPointY
    e.line = lines
    e.isClose = isClose
    e.fill = fill
    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
  else if(op == 'add'){
    const svg_id = jsonObj.svg_id
    const valuesArr = Object.values(jsonObj.svg[0]);
    const startPointX = valuesArr[0]
    const startPointY = valuesArr[1]
    const endPointX = valuesArr[2]
    const endPointY = valuesArr[3]
    const lines = JSON.stringify(valuesArr[4])
    const isClose = valuesArr[5].toString()
    const fill = jsonObj.fill.toString()
    const arr = [font, word,svg_id, startPointX, startPointY, endPointX, endPointY, lines, isClose,fill]
    const arr1 = [startPointX, startPointY, endPointX, endPointY, lines, isClose,fill, font,word, svg_id]
    const arr2 = [font, word,svg_id]
    svgDatabase.countSvg(arr2).then(count => {
      if(count > 0){
        svgDatabase.updateSvg(arr1)
      }
      else{
        svgDatabase.addSvg(arr)
      }
    })
    let e = new Object()
    e.op = 'edit'
    e.svg_id = svg_id
    e.font = font
    e.word = word
    e.startPointX = startPointX
    e.startPointY = startPointY
    e.endPointX = endPointX
    e.endPointY = endPointY
    e.line = lines
    e.isClose = isClose
    e.fill = fill

    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
  else if(op == 'delete'){
    const svg_id = jsonObj.svg_id
    const arr = [font,word, svg_id]
    svgDatabase.deleteSvg(arr)
    let e = new Object()
    e.op = 'delete'
    e.svg_id = svg_id
    e.font = font
    e.word = word
    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
  else if(op == 'changeFill'){
    const svg_id = jsonObj.svg_id
    const fill = jsonObj.fill.toString()
    const arr = [fill,font,word, svg_id]
    svgDatabase.updateSvgFill(arr)
    let e = new Object()
    e.op = 'changeFill'
    e.svg_id = svg_id
    e.font = font
    e.word = word
    e.fill = fill
    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
  else if(op == 'editEnd'){
    let e = new Object()
    e.op = 'editEnd'
    e.font = font
    e.word = word
    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
}
module.exports = app
