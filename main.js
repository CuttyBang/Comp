import './style.scss'

import { context, OUTPUT } from './components/Context.js'
import {configureControl} from './components/Helpers.js'
import {createCompressor} from './components/Compressor.js'
import {createSource} from './components/Source.js'
import {initDisplay} from './components/Display.js'
import {createMeter} from './components/Meter.js'
import {humanVoice} from './components/audio/voice.js'
import {cold_sweat} from './components/audio/cold_sweat.js'
import {cold_sweat2} from './components/audio/cold_sweat2.js'
const tuna = new Tuna(context);

let canvasWidth  = 400;
let canvasHeight = 265;
let audioData = null;
let isPlaying = false;
let sampleSize = 256;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback, element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

const makeupControl = document.getElementById('makeup_control');
const thresholdControl = document.getElementById('threshold_control');
const ratioControl = document.getElementById('ratio_control');
const kneeControl = document.getElementById('knee_control');
const attackControl = document.getElementById('attack_control');
const releaseControl = document.getElementById('release_control');
const wetdryControl = document.getElementById('wetdry_control');
const volumeControl = document.getElementById('volume_control');
const autoMakeupControl = document.getElementById('autoMakeup_control');
const indicator = document.getElementById('indicator');
const inMeter = document.getElementById('inMeter');
const outMeter = document.getElementById('outMeter');
const wetCtx = document.getElementById('wetCanvas').getContext('2d');
const dryCtx = document.getElementById('dryCanvas').getContext('2d');

const waveform = context.createAnalyser();
waveform.fftSize = 2048;
waveform.smoothingTimeConstant = 0.5;
waveform.minDecibels = -100;
waveform.maxDecibels = -20;
const scriptProcessor = context.createScriptProcessor(sampleSize, 1, 1);
const ampArray = new Uint8Array(waveform.fftSize);


scriptProcessor.onaudioprocess = function () {
  waveform.getByteFrequencyData(ampArray);
  if (isPlaying == true) {
    requestAnimFrame(drawWetTimeDomain);
  }
}

function drawWetTimeDomain() {
  clearCanvas(wetCtx);
  for (let i = 0; i < ampArray.length; i++) {
    let value = ampArray[i] / 256;
    let y = canvasHeight - (canvasHeight * value) + 5 ;
    wetCtx.globalAlpha = 0.1;
    wetCtx.strokeStyle = '#ffffff';
    wetCtx.lineWidth = 1;
    wetCtx.beginPath();
    wetCtx.moveTo(i, canvasHeight);
    wetCtx.lineTo(i, y);
    wetCtx.stroke();
    wetCtx.fillStyle = '#ffffff';
    wetCtx.fillRect(i, y, 3, 3);
    wetCtx.fillStyle = '#ffffff';
    wetCtx.fillRect(i, y, 3, 3);
  }
}

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

function crossfade(a, b, value) {
  let gain1 = Math.cos(value * 0.5*Math.PI);
  let gain2 = Math.cos((1.0-value) * 0.5*Math.PI);
  a.gain.setValueAtTime(gain1, context.currentTime);
  b.gain.setValueAtTime(gain2, context.currentTime);
}

const dryComp = new tuna.Compressor({
  threshold: -0,    //-100 to 0
  makeupGain: 0,     //0 and up (in decibels)
  attack: 0.0,         //0 to 1000
  release: 0.0,      //0 to 3000
  ratio: 1,          //1 to 20
  knee: 0,           //0 to 40
  automakeup: false, //true/false
  bypass: 0
});

const wetComp = new tuna.Compressor({
  threshold: -10,    //-100 to 0
  makeupGain: 1,     //0 and up (in decibels)
  attack: 0.5,         //0 to 1000
  release: 1,      //0 to 3000
  ratio: 12,          //1 to 20
  knee: 10,           //0 to 40
  automakeup: false, //true/false
  bypass: 0
});

const sourceGain = context.createGain();
sourceGain.gain.value = 0.8;
const dryGain = context.createGain();
dryGain.gain.value = 1;
const wetGain = context.createGain();
wetGain.gain.value = 1;
const wetGain2 = context.createGain();
wetGain2.gain.value = 1;
const sendGain = context.createGain();
sendGain.gain.value = 1;
const dryCompGain = context.createGain();
dryCompGain.gain.value = 0.5;
const wetCompGain = context.createGain();
wetCompGain.gain.value = 1;
const outputGain = context.createGain();
outputGain.gain.value = 0.9;

wetComp.threshold.setValueAtTime(thresholdControl.value, context.currentTime)
wetComp.ratio.setValueAtTime(ratioControl.value, context.currentTime);
wetComp.knee.setValueAtTime(kneeControl.value, context.currentTime);
wetComp.attack.setValueAtTime(attackControl.value, context.currentTime);
wetComp.release.setValueAtTime(releaseControl.value, context.currentTime);
wetComp.makeupGain.setValueAtTime(makeupControl.value/10, context.currentTime);
outputGain.gain.setValueAtTime(volumeControl.value, context.currentTime);

initDisplay();
createMeter(dryComp, inMeter);
createMeter(wetComp, outMeter);

sourceGain.connect(dryGain);
sourceGain.connect(wetGain);
sourceGain.connect(sendGain);

wetGain.connect(wetComp);
wetComp.connect(wetCompGain);
wetCompGain.connect(outputGain);

dryGain.connect(dryComp);
dryComp.connect(dryCompGain)
dryCompGain.connect(outputGain);


wetComp.connect(waveform);
waveform.connect(scriptProcessor);
scriptProcessor.connect(outputGain);
outputGain.connect(OUTPUT);


sourceGain.connect(dryGain);
sourceGain.connect(wetGain);

outputGain.connect(OUTPUT);


thresholdControl.addEventListener('input', () => {
  wetComp.threshold.setValueAtTime(thresholdControl.value, context.currentTime);
})

ratioControl.addEventListener('input', () => {
  wetComp.ratio.setValueAtTime(ratioControl.value, context.currentTime);
})

kneeControl.addEventListener('input', () => {
  wetComp.knee.setValueAtTime(kneeControl.value, context.currentTime);
})

attackControl.addEventListener('input', () => {
  wetComp.attack.setValueAtTime(attackControl.value, context.currentTime);
})

releaseControl.addEventListener('input', () => {
  wetComp.release.setValueAtTime(releaseControl.value, context.currentTime);
})

makeupControl.addEventListener('input', () => {
  wetComp.makeupGain.setValueAtTime(makeupControl.value/10, context.currentTime);
})

wetdryControl.addEventListener('input', () => {
  crossfade(dryGain, wetGain, wetdryControl.value)
})

volumeControl.addEventListener('input', () => {
  outputGain.gain.setValueAtTime(volumeControl.value, context.currentTime);
})

autoMakeupControl.addEventListener("change", function() {
    let currentVal = makeupControl.value;
    let thresh = thresholdControl.value;
    if(autoMakeupControl.value == 1){
    indicator.value = autoMakeupControl.value;

    makeupControl.value = 0.1;
    wetComp.makeupGain.value = 0.1;
    makeupControl.style.opacity = 0.7;
    wetComp.threshold.value = -0;
    thresholdControl.value = 0;
    wetComp.threshold.setValueAtTime(thresholdControl.value, context.currentTime);
    wetComp.automakeup = true;
    makeupControl.max = makeupControl.value;
    makeupControl.min = makeupControl.value;
  }else {

    makeupControl.value = 0;
    indicator.value = autoMakeupControl.value;
    makeupControl.max = 20;
    makeupControl.min = 0.1;
    makeupControl.style.opacity = 1;

    makeupControl.value = currentVal;
    thresholdControl.value = thresh;
    wetComp.makeupGain.value = currentVal;
    wetComp.automakeup = false;
  }
})


function init() {
  const source = createSource(humanVoice);
  source.connect(sourceGain);
  source.start();
  isPlaying = true;

  const stopButton = document.getElementById('stopButton');
  stopButton.onclick = function() {
    source.stop();
    isPlaying = false;
  };
};

if (isPlaying) {
  startButton.disabled = true;
} else {
  startButton.disabled = false;
};

startButton.addEventListener('click', () => {
  if (isPlaying) { return } else { init() };
});
