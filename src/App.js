import React, { useRef, useEffect } from 'react';
import axios from 'axios';
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import Webcam from "react-webcam";
import { addSymbol, drawMesh, patternDetection } from "./utilities";
import "./Speech"
import './style.css';
import { Synthesis } from './speechSynthesis';



// Variables Utiles 

var symbolList = []; // liste des symboles(file)


var DATA = [] // Données récupéré de la BDD
var params = null // paramètres de la detection de mouvement du visage/pupille
var periodeSymbole = 0
var periodeEch = 0
var logs = []

var myText = null; // texte à afficher dans l'alerte
var detection = null; // pattern detecté, null si aucun pattern 

// Variables pour la décision après une période d'echantillonage
var gauche = 0;
var droite = 0;
var haut = 0;
var bas = 0;
var ecran = 0;

// nombre de pattern dettecté, au bout de "severte" ppatern, le robot le signal et les compteur se mettent à 0
var nbrPatternGauche = 0;
var nbrPatternDroite = 0;
var nbrPatternHaut = 0;
var nbrPatternBas = 0;
var check = 0; // variable utile pour la detection des patterns
var severite = 2; // nombre de pattern detecté au bout duquel le robot va se prononcer 


// fonction d'arret de la surveillance
function arreter() {
  Synthesis("Vous avez terminé votre session d'examen, votre enseignant recevra un rapport complet de votre session. Bon courage pour la suite et à très bientot")
 
  var data = {
    "logs": logs
  }
  axios.post('https://test-it-project.herokuapp.com/api/logs', data)
    .then((response) => {
      console.log(response)
    })

}


class Alert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: 'Vous regardez l\'écran',
      color: 0,
      seconds: 0
    };
  }



  componentDidMount() {
    axios.get('https://test-it-project.herokuapp.com/api/robots/api/robots'
    ).then((response) => {
      DATA = response.data[0].patterns
      //console.log(response.data[1])
      params = response.data[1].params
      periodeEch = response.data[1].periodeEch
      periodeSymbole = response.data[1].periodeSymbole
    })



    this.interval = setInterval(() => { // Cycle de detection d'un symbole 
      this.change()
      gauche = 0;
      droite = 0
      bas = 0
      haut = 0
      ecran = 0
    }, 500);

  }



  change() {

    // décision du symbole à prendre arpès un temps d'echantillonage

    if (Math.max(gauche, droite, haut, bas, ecran) == ecran) {
      myText = "écran"
    }
    else if (Math.max(gauche, droite, haut, bas, ecran) == droite) {
      myText = "droite"
    }
    else if (Math.max(gauche, droite, haut, bas, ecran) == haut) {
      myText = "haut"
    }
    else if (Math.max(gauche, droite, haut, bas, ecran) == bas) {
      myText = "bas"
    }
    else if (Math.max(gauche, droite, haut, bas, ecran) == gauche) {
      myText = "gauche"
    }

    // detection des patterns
    addSymbol(symbolList, myText)
    detection = patternDetection(symbolList, DATA)
    var now = new Date()
    var date = now.getDate()+"/"+now.getMonth()+"/"+now.getFullYear()+"-"+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds()+":"+now.getMilliseconds()

    if (detection == "pattern bas") {
      logs.push({
        pattern : detection,
        date : date
      })
      symbolList = []
      myText = detection
      if (nbrPatternBas == severite - 1) {
        Synthesis("Nous avons detecté un " + myText)
        nbrPatternBas = 0
      }
      else {
        nbrPatternBas++
      }

    }
    else if (detection == "pattern haut") {
      logs.push({
        pattern : detection,
        date : date
      })
      symbolList = [];
      myText = detection
      if (nbrPatternHaut == severite - 1) {
        Synthesis("Nous avons detecté un " + myText)
        nbrPatternHaut = 0
      }
      else {
        nbrPatternHaut++
      }

    }
    else if (detection == "pattern droite") {
      logs.push({
        pattern : detection,
        date : date
      })
      symbolList = [];
      myText = detection
      if (nbrPatternDroite == severite - 1) {

        Synthesis("Nous avons detecté un " + myText)
        nbrPatternDroite = 0
      }
      else {
        nbrPatternDroite++
      }

    }
    else if (detection == "pattern gauche") {
      check++;
      logs.push({
        pattern : detection,
        date : date
      })
      symbolList = [];
      myText = detection
      if (nbrPatternGauche == severite - 1) {
        Synthesis("Nous avons detecté un " + myText)
        nbrPatternGauche = 0
      }
      else if (check == 3) {
        Synthesis("C'est la troisième fois que vous regardez à gauche monsieur")
      }
      else {
        nbrPatternGauche++
      }

    }




    if (myText == "écran") {
      this.setState({
        color: 0
      })
    }
    else {
      this.setState({
        color: 1
      })
    }

    this.setState(state => ({
      text: myText
    }));
  }



  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (


      <div style={{
        marginInline: 30,
        alignItems: 'center'
      }}>

        {this.state.color ? <div style={{
          backgroundColor: 'red',


        }}> {this.state.text} </div> : <div style={{
          backgroundColor: 'green'
        }}> {this.state.text} </div>}

      </div>
    );
  }
}



function App() {

  //Synthesis("Bonjour et bienvenue dans votre session d'examen, je me présente, je suis Lina, votre nouvelle surveillante")
  var text = null;
  //Ref
  const webcamRef = useRef(null);
  const canvasRef = useRef(null)


  //  Load Facemesh
  const runFacemesh = async () => {
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    setInterval(() => {
      detect(net);

    }, /*periodeEch*/50);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      // NEW MODEL
      const face = await net.estimateFaces({ input: video });

      // Get canvas context
      const ctx = canvasRef.current.getContext("2d");
      requestAnimationFrame(() => {
        drawMesh(face, ctx, params);
        if (drawMesh(face, ctx, params) == "gauche") {
          gauche++
        }
        else if (drawMesh(face, ctx, params) == "droite") {
          droite++
        }
        else if (drawMesh(face, ctx, params) == "haut") {
          haut++
        }
        else if (drawMesh(face, ctx, params) == "bas") {
          bas++
        }
        else if (drawMesh(face, ctx, params) == "écran") {
          ecran++
        }
      });
    }
  };

  useEffect(() => { runFacemesh() }, []);


  return (
    <div className="App">


      <div id="main" style={{
        marginLeft: 600
      }}>

        <Webcam
          ref={webcamRef}
          style={{
            // position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            /* width: 0,
             height: 0,*/
            //  position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            /*left: 0,
            right: 0,
            textAlign: "center",*/
            zindex: 9,
            width: 0,
            height: 0,
          }}
        />
        <div style={{
          width: 640
        }}><Alert id="alert"></Alert> </div>

        <button style={{
          width: 640
        }} onClick={arreter}>
          Arrêter
        </button>
      </div>
    </div>
  );
}

export default App;
