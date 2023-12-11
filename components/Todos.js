// 外部のモジュールで公開されたものを利用するためのimport文
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import 'isomorphic-fetch'
import e from 'express'


// 各ページに関する情報の定義
const pages = {
    index: { title: 'すべてのToDo' },
    active: { title: '未完了のToDo', completed: false },
    completed: { title: '完了したToDo', completed: true }
  }
  
  // Reactコンポーネントの実装
  export default function Todos(props) {
    const { title, completed } = pages[props.page]
  
    // コンポーネントの状態の初期化と、propsの値に応じた更新
    const [todos, setTodos] = useState([])
    useEffect(() => {
      // fetch によるToDo取得の実装を削除
      // fetch(`/api/todos${fetchQuery}`)
      //   .then(async res => {
      //     const json = await res.json()
      //     res.ok ? setTodos(json) : alert(json)
      //   })


    // EventSourceを使った実装に置き換え
    const eventSource = new EventSource('/api/todos/events')
    // SSE受信時の処理
    eventSource.addEventListener('message', e => {
      const todos = JSON.parse(e.data)
      setTodos(
        typeof completed === 'undefined'
          ? todos
          : todos.filter(todo => todo.completed === completed)
      )
    })

//エラーハンドリング
eventSource.addEventListener('error', e => console.log('SSEエラー', e))
// useEffectで関数を返すと副作用のクリーンアップとして実行される
// ここでは、EventSourceインスタンスをクローズする
return () => eventSource.close()
}, [props.page])


// CSRでページを切り替えるためのリンク
const pageLinks = Object.keys(pages).map((page, index) =>
 <Link href={`/${page === 'index' ? '' : page}`} key={index} passHref>
 <span style={{ marginRight: 10 }}>{pages[page].title}</span>
 </Link>
)}//}を感で付けているのでこの位置で正しいかわかっていない。

// Reactコンポーネントを実装し、外部のモジュールで利用可能なようexport文で公開
export default function Todos(props) {
 const { title, fetchQuery } = pages[props.page]
 // コンポーネントの状態の初期化と、propsの値に応じた更新
 const [todos, setTodos] = useState([])
 useEffect(() => {
 fetch(`/api/todos${fetchQuery}`)
 .then(async res => res.ok
 ? setTodos(await res.json())
 : alert(await res.text())
 )
 }, [props.page])
 // このコンポーネントが描画するUIをJSX構文で記述して返す
 return (
 <>
 <Head>
 <title>{title}</title>
 </Head>
 <h1>{title}</h1>
 {/* ToDo一覧の表示 */}
 <ul>
 {todos.map(({ id, title, completed }) =>
 <li key={id}>
 <span style={completed ? { textDecoration: 'line-through' } : {}}>
 {title}
 </span>
 </li>
 )}
 </ul>
 <div>{pageLinks}</div>
 </>
    )   
    }
