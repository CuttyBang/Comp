import { context, OUTPUT } from './Context.js'

let canvasWidth  = 400;
let canvasHeight = 265;
let audioData = null;
let isPlaying = false;
let sampleSize = 256;


const ctx = document.querySelector('#canvas2').getContext('2d');

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback, element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

const analyser = context.createAnalyser();
const scriptProcessor = context.createScriptProcessor(sampleSize, 1, 1);
const ampArray = new Uint8Array(analyser.frequencyBinCount);


scriptProcessor.onaudioprocess = function () {
    analyser.getByteTimeDomainData(ampArray);
    if (isPlaying == true) {
        requestAnimFrame(drawTimeDomain);
    }
}

function drawTimeDomain() {
    clearCanvas();
    for (let i = 0; i < ampArray.length; i++) {
        let value = ampArray[i] / 256;
        let y = canvasHeight - (canvasHeight * value) -1 ;
        // ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(i, canvasHeight);
        ctx.lineTo(i, y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i, y, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i, y, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i, y, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i, y, 3, 3);

    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

export {analyser, scriptProcessor}
