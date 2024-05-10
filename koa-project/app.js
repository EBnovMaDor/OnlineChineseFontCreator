const Koa = require('koa')
const app = new Koa()

const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
// const index = require('./routes/index')
// const users = require('./routes/users')
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

// logger
// app.use(async (ctx, next) => {
//   const start = new Date()
//   await next()
//   const ms = new Date() - start
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
// })

// routes
// app.use(index.routes(), index.allowedMethods())
// app.use(users.routes(), users.allowedMethods())
// server port
app.listen(1129);
console.log('App started at port 1129...');
// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});


// const mysql = require("mysql");
// const db_config = {
//   host: "localhost",
//   user: "localhost",
//   password: "123456",
//   port: "3306",
//   database: "testdb"
// }
// let connect = mysql.createConnection(db_config);

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
  if (op == 'i') {
    svgDatabase.findSvg(font).then(res => {
      // console.log('Count:', res);
      for (let e of res) {
        e.op = 'edit'
        // console.log("e:", e.toString())
        server.clients.forEach((c) => {
          c.send(JSON.stringify(e));
        })
      }
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
    // const arr = [jsonObj.font[0], jsonObj.svg_id, startPointX, startPointY, endPointX, endPointY, lines, isClose]
    const arr = [startPointX, startPointY, endPointX, endPointY, lines, isClose,fill, font, svg_id]
    // const arr2 = [jsonObj.font[0], jsonObj.svg_id]
    svgDatabase.updateSvg(arr)
    let e = new Object()
    e.op = 'edit'
    e.svg_id = svg_id
    e.font = font
    e.startPointX = startPointX
    e.startPointY = startPointY
    e.endPointX = endPointX
    e.endPointY = endPointY
    e.line = lines
    e.isClose = isClose
    e.fill = fill
    // console.log("e:", e)
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
    const arr = [jsonObj.font[0], jsonObj.svg_id, startPointX, startPointY, endPointX, endPointY, lines, isClose,fill]
    const arr1 = [startPointX, startPointY, endPointX, endPointY, lines, isClose,fill, font, svg_id]
    const arr2 = [jsonObj.font[0], jsonObj.svg_id]
    svgDatabase.countSvg(arr2).then(count => {
      // console.log('Count:', res);
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
    e.startPointX = startPointX
    e.startPointY = startPointY
    e.endPointX = endPointX
    e.endPointY = endPointY
    e.line = lines
    e.isClose = isClose
    e.fill = fill

    // console.log("e:", lines)
    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
  else if(op == 'delete'){
    const svg_id = jsonObj.svg_id
    const arr = [font, svg_id]
    svgDatabase.deleteSvg(arr)
    let e = new Object()
    e.op = 'delete'
    e.svg_id = svg_id
    e.font = font
    // console.log("e:", e)
    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
  else if(op == 'changeFill'){
    const svg_id = jsonObj.svg_id
    const fill = jsonObj.fill.toString()
    const arr = [fill,font, svg_id]
    svgDatabase.updateSvgFill(arr)
    let e = new Object()
    e.op = 'changeFill'
    e.svg_id = svg_id
    e.font = font
    e.fill = fill
    server.clients.forEach((c) => {
      c.send(JSON.stringify(e));
    })
  }
}
module.exports = app
