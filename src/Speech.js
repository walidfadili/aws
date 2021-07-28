window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new window.SpeechRecognition();
recognition.interimResults = true;

recognition.addEventListener('result', (e)=> {
    console.log("detected");
})
recognition.continuous = true;
recognition.addEventListener('end',()=>{
    recognition.start();
})
recognition.start();