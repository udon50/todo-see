'use strict'
const express = require('express')
let todos=[{id:1, title:'ネーム', completed:false}
,{id:2, title:'下書き', completed:true}]

const app = express()

app.use(express.json())

//Todo一覧の取得
app.get('/api/todos',(req,res)=> { 
if (!req.query.completed) {
  return res.json(todos)
}

//全クライアントに対するSSE送信関数を保持する配列
let sseSenders=[]
// SSEのIDを管理するための変数
let sseId=1

//Todoの一覧の取得(SSE)
app.get('/api/todos/evets',(req,res)=> {
  // タイムアウトを抑止
  req.socket.setTimeout(0)
  res.set({
    // Content-TypeでSSEであることを示す
    'Content-Type':'text/event-stream',
  })

/** ToDoの更新に伴い、全クライアントに大してSSEを送信する */
function onUpdateTodos() {
  sseId += 1
  const data = JSON.stringify(todos)
  sseSenders.forEach(send => send(sseId,data))
}
 
  // クライアントにSSEを送信する関数を作成して登録
  const send=(id,data)=> res.write(`id:${id}\ndata:${data}\n\n`)
  sseSenders.push(send)
  // リクエスト発生時点の状態を送信
  send(sseId,JSON.stringify(todos))
  // リクエストがクローズされたらレスポンスを終了してSSE送信関数を配列から削除
  req.on('close',()=> {
    res.end()
    sseSenders = sseSenders.filter(_send => _send !== send)
  })
})


//completedクエリパラメータがある場合はToDoをフィルタリング
const completed = req.query.completed === 'true'
res.json(todos.filter(todo => todo.completed === completed))
})


//ToDoのIDの値を管理するための変数
let id = 2
//ToDoの新規登録
app.post('/api/todos',(req,res,next)=> {
  const {title} = req.body
  if (typeof title !== 'string' || !title) {
    //titleがリクエストに含まれない場合はステータスコード400(Bad Request)
    const err = new Error('title is required')
    err.statusCode = 400
    return next(err)
    onUpdateTodos()
  }
  
  //ToDoの作成
  const todo = {id:++id, title, completed:false}
  todos.push(todo)
  //ステータスコード201(Created)で結果を返す
  res.status(201).json(todo)
})

app.use('/api/todos/:id(\\d+)',(req,res,next)=> {
  const targetId = Number(req.params.id)
  const todo = todos.find(todo => todo.id === targetId)
  if (!todo) {
    const err = new Error('ToDo not found')
    err.statusCode = 404
    return next(err)
  }
  req.todo = todo
  next()
})

app.route('/api/todos/:id(\\d+)/completed')
.put((req,res)=> {
  req.todo.completed = true
  res.json(req.todo)
})
.delete((req,res)=> {
  req.todo.completed = false
  res.json(req.todo)
})

app.delete('/api/todos/:id(\\d+)',(req,res)=> {
  todos = todos.filter(todo => todo !== req.todo)
  res.status(204).end()
})

app.use((err,req,res,next)=> {
  console.error(err)
  res.status(err.statusCode || 500).json({error:err.message})
})

app.listen(3000)
  

// Next.jsによるルーティングのためこれ以降を追記
const next = require('next')
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
nextApp.prepare().then(
 // pagesディレクトリ内の各Reactコンポーネントに対するサーバサイドルーティング
 () => {
   app.get('*', nextApp.getRequestHandler())
   app.listen(3000)
 },
 err => {
 console.error(err)
 process.exit(1)
 }
)