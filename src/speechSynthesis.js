export const Synthesis = (myText) => {
  
    let speech = new SpeechSynthesisUtterance();

    speech.text= myText;

    speechSynthesis.speak(speech);
}