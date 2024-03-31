const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const index = require('./routes/index')
const users = require('./routes/users')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
// server port
app.listen(1129);
console.log('App started at port 1129...');
// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

const Ws = require('ws');
const server = new Ws.Server({port:8000})
server.on('open',handleOpen);
server.on('close',handleClose);
server.on('error',handleError);
server.on('connection',handleConnection);
function handleOpen(){
  console.log('BE: WebSocket open')
}
function handleClose(){
  console.log('BE: WebSocket close')
}
function handleError(){
  console.log('BE: WebSocket error')
}
function handleConnection(ws){
  console.log('BE: WebSocket connection');
  ws.on('message',handleMessage);
}
function handleMessage(msg){
  console.log(msg.toString());
  server.clients.forEach((c)=>{
    c.send(msg.toString());
  })
}
module.exports = app
