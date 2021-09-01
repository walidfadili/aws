import React, { useRef, useEffect, Redirect } from 'react';
import * as tf from "@tensorflow/tfjs";
import axios from 'axios';
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import Webcam from "react-webcam";
import { addSymbol, drawMesh, patternDetection } from "./utilities";
import "./Speech"
import './style.css';
import App from './App';
import { getGradient } from '@tensorflow/tfjs';
import { Synthesis } from './speechSynthesis';
import {
  BrowserRouter as Router,
  Route,
  Link,
} from "react-router-dom";

function commencer(e) {    Synthesis("Bonjour et Bienvenue dans votre session d'examen, je suis Lina, votre surveillante. Je vous rappelle les règles : Il est strictement interdit de regarder en dehors de votre écran. Il est strictement interdit d'utiliser un quelconque support ou de communiquer avec d'autres personnes. Toute tentative de fraude sera enregistré et pénalisé. Cliquez sur Arreter pour terminer votre session. Bon courage")  }

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAlertOpen: false,
      // history: createBrowserHistory(),
    };
  }

  componentDidMount() {
    Synthesis("Bonjour ca va ?")
  }
  render() {


    return (
      <Router>

        <Route path="/App" exact render={() => <App />} />
        <div style={{
          alignItems: "center",
          marginLeft: '40%',
          marginTop: '20%'
        }}>
          <Link to="/App">
            <button onClick={commencer}>
              Commencer
            </button>
            
          </Link>

        </div>



      </Router>

    );
  }
}

/*function Home() {

  

  
}*/

export default Home;
