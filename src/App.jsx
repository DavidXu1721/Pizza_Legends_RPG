import React from "react"
import Game from "./components/PizzaLegendsGame"

function App() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = React.useState(0);

  return (
    <>
    <div className="app">
      <Game count={count}/>
      
    </div>
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
    </>
  )
}

export default App
