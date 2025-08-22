import React from 'react'
import useScript from '../hooks/useScript'
import '../styles/TextMessage.css'
import '../styles/SceneTransition.css'
import '../styles/Battle.css'
import '../styles/KeyboardMenu.css'
import '../styles/Hud.css'
import '../styles/Menus.css'

function PizzaLegendsGame(props) {
  useScript('./src/scripts/init.js', ['defer'], 'module')
  console.log("rerendering game " + props.count)
  return (
    <div id='pizza-legends-RPG'>
      <canvas className="game-canvas" width={352} height={198}></canvas>
    </div>
  )
}

export default PizzaLegendsGame
