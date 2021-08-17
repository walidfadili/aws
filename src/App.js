import React, { useRef, useEffect } from 'react';
import * as tf from "@tensorflow/tfjs";
import axios from 'axios';
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import Webcam from "react-webcam";
import { addSymbol, drawMesh, patternDetection } from "./utilities";
import "./Speech"
import './style.css';
import { getGradient } from '@tensorflow/tfjs';
import { Synthesis } from './speechSynthesis';




var symbolList=[];
var lastSymbol = null;

var DATA=[]
var params=null
var periodeSymbole=0
var periodeEch=0

var myText=null;
var detection=null;
var gauche=0;
var droite=0;
var haut=0;
var bas=0;
var ecran=0;

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
    ).then((response)=>{
    DATA=response.data[0].patterns
    //console.log(response.data[1])
    params=response.data[1].params
    periodeEch=response.data[1].periodeEch
    periodeSymbole=response.data[1].periodeSymbole
  
  })
    
    this.interval = setInterval(() => {
      this.change()
      gauche=0;
      droite=0
      bas=0
      haut=0
      ecran=0
    }, 500);
    
  }

  change() {
    if (Math.max(gauche,droite,haut,bas,ecran)==gauche){
      myText="gauche"
     // console.log("gauche",gauche)
    }
    else if(Math.max(gauche,droite,haut,bas,ecran)==droite){
      myText="droite"
     // console.log("droite",droite)
    }
    else if(Math.max(gauche,droite,haut,bas,ecran)==haut){
      myText="haut"
     // console.log("haut",haut)
    }
    else if(Math.max(gauche,droite,haut,bas,ecran)==bas){
      myText="bas"
     // console.log("bas",bas)
    }
    else if(Math.max(gauche,droite,haut,bas,ecran)==ecran){
      myText="écran"
     // console.log("écran",ecran)
    }
    addSymbol(symbolList,myText)
    detection=patternDetection(symbolList,DATA)
    if (detection != null) {
      
      if (detection != lastSymbol || lastSymbol == null){
        myText=detection
        console.log(myText)
        Synthesis(myText+" detecté")
        lastSymbol=myText
      }
      
      
    }
    
   // console.log(symbolList)

    if (myText=="écran"){
      this.setState({
        color: 0
      })
    }
    else{
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
        
        { this.state.color ? <div style={{
          backgroundColor: 'red',
          
          
        }}> {this.state.text} </div> : <div style={{
          backgroundColor: 'green'
        }}> {this.state.text} </div>}
                
      </div>
    );
  }
}



function App() {

  
  var text=null;
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
      const face = await net.estimateFaces({input:video});
      //console.log(face);

      // Get canvas context
      const ctx = canvasRef.current.getContext("2d");
      requestAnimationFrame(()=>{drawMesh(face, ctx, params);
        
        
        //console.log(drawMesh(face,ctx,params))
        if (drawMesh(face,ctx,params)=="gauche"){
          gauche++
        }
        else if (drawMesh(face,ctx,params)=="droite"){
          droite++
        }
        else if (drawMesh(face,ctx,params)=="haut"){
          haut++
        }
        else if (drawMesh(face,ctx,params)=="bas"){
          bas++
        }
        else if(drawMesh(face,ctx,params)=="écran"){
          ecran++
        }
      });
    }
  };

  useEffect(()=>{runFacemesh()}, []);



  return (
    <div className="App">
      <div id="entete">
        Bonjour 
      </div>

  <div id="main">
  <div id="menu" style={{
   marginBottom: 10
 }}>
 <Webcam
          ref={webcamRef}
          style={{
            //position: "absolute",
            marginLeft: 100,
            marginTop: 10,
            /*left: 0,
            right: 0,
            textAlign: "center",*/
            zindex: 9,
            width: 320,
            height: 240,
          }}
        />

   <canvas
          ref={canvasRef}
          style={{
           /* width: 0,
            height: 0,*/
            position: "absolute",
            marginLeft: 100,
            marginTop: 10,
            /*left: 0,
            right: 0,
            textAlign: "center",*/
            zindex: 9,
            width: 320,
            height: 240,
          }}
        />
    <Alert  id="alert"></Alert> 
 </div>

 <div id="contenu" style={{
   textAlign: "center",
 }}>
  Contenu de l'examen
 </div>
</div>

<div id="footer">
 Pied de Page
</div>
      
      
        
      
    
    </div>
  );
}

export default App;
