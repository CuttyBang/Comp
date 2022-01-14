
function configureSlider(name, value, min, max, handler) {
   let divName = name + "_control";
   let control = document.getElementById(divName);
   control.min = min;
   control.max = max;
   control.value = value;
   control.oninput = function(e) { handler(0, this); };
   handler(0, {value: value});
}

//window.onload = init;
let canvasWidth = 0;
let canvasHeight = 0;
const backgroundColor = "#90b3b5"
const curveColor = "#5e7f82";
const gridColor = "#607475";
const meanOutputColor = "rgba(#111111, 0.32)";

const thresholdColor = "#739293";


let sampleRate = 44100.0;
let nyquist = 0.5 * sampleRate;

let threshold = -24;
let knee = 15;
let ratio = 12;
let makeupGain = 0;

let m_ratio;
let m_slope;
let m_linearThreshold;
let m_thresholdDb;
let m_kneeDb;
let m_kneeThreshold;
let m_kneeThresholdDb;
let m_ykneeThresholdDb;

let kneeThreshold = 1;
let kneeThresholdDb;

let maxOutputDb = 6;
let minOutputDb = -78; //Made 6db highter in order to center the dynamic range //12, 24, 36, 48, 60, 72, 84, 96, etc

function xpixelToDb(x) {
  let k = x / canvas.height;
  let db = minOutputDb + k * (maxOutputDb - minOutputDb);
  return db;
}

function dBToXPixel(db) {
  let k = (db - minOutputDb) / (maxOutputDb - minOutputDb);
  let x = k * canvas.height;
  return x;
}

function ypixelToDb(y) {
  let k = y / canvas.height;
  let db = maxOutputDb - k * (maxOutputDb - minOutputDb);
  return db;
}

function dBToYPixel(db) {
  let k = (maxOutputDb - db) / (maxOutputDb - minOutputDb);
  let y = k * canvas.height;
  return y;
}

function decibelsToLinear(db) {
  return Math.pow(10.0, 0.05 * db);
}

function linearToDecibels(x) {
  return 20.0 * Math.log(x) / Math.LN10;
}

function slopeAt(x, k) {
  if (x < m_linearThreshold)
    return 1;
  let x2 = x * 1.001;
  let xDb = linearToDecibels(x);
  let x2Db = linearToDecibels(x2);
  let yDb = linearToDecibels(saturateBasic(x, k));
  let y2Db = linearToDecibels(saturateBasic(x2, k));
  let m = (y2Db - yDb) / (x2Db - xDb);

  return m;
}

function kAtSlope(slope) {
  let xDb = m_thresholdDb + m_kneeDb;
  let x = decibelsToLinear(xDb);
  let minK = 0.1;
  let maxK = 10000;
  let k = 5;

  // Approximate.
  for (let i = 0; i < 15; ++i) {
    let  m = slopeAt(x, k);
    if (m < slope) {
      // k is too high.
      maxK = k;
      k = Math.sqrt(minK * maxK);
    } else {
      // k is not high enough.
      minK = k;
      k = Math.sqrt(minK * maxK);
    }
  }
  return k;
}

// Exponential saturation curve.
function saturateBasic(x, k) {
  if (x < m_linearThreshold)
      return x;
  return m_linearThreshold + (1 - Math.exp(-k * (x - m_linearThreshold))) / k;
}

function saturate(x, k) {
  let y;
  if (x < m_kneeThreshold) {
    y = saturateBasic(x, k);
  } else {
    let xDb = linearToDecibels(x);
    let yDb = m_ykneeThresholdDb + m_slope * (xDb - m_kneeThresholdDb);

    y = decibelsToLinear(yDb);
  }
  return y;
}

function clearCanvas(cWidth, cHeight) {
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
}

const canvas = document.getElementById('compCanvas');
const canvasContext = canvas.getContext('2d');
canvasWidth = parseFloat(window.getComputedStyle(canvas, null).width);
canvasHeight = parseFloat(window.getComputedStyle(canvas, null).height);
const cWidth = canvasContext.width;
const cHeight = canvasContext.height;




function drawCurve() {

  // Update curve state.
  let dbThreshold = threshold;
  let dbKnee = knee;
  let linearThreshold = decibelsToLinear(dbThreshold);
  let linearKnee = decibelsToLinear(dbKnee);

  m_linearThreshold = linearThreshold;
  m_thresholdDb = dbThreshold;
  m_kneeDb = dbKnee;
  // Makeup gain.
  let maximum = 1.05 * linearKnee * linearThreshold;
  // Compute knee threshold.
  m_ratio = ratio;
  m_slope = 1 / m_ratio;

  let k = kAtSlope(1 / m_ratio);

  // console.log("k = " + k);
  m_kneeThresholdDb = dbThreshold + knee;
  m_kneeThreshold = decibelsToLinear(m_kneeThresholdDb);
  m_ykneeThresholdDb = linearToDecibels(saturateBasic(m_kneeThreshold, k));

  // draw center
  const width = canvas.width;
  const height = canvas.height;

  canvasContext.fillStyle = backgroundColor;
  canvasContext.fillRect(0, 0, width, height);

  // Draw linear response.
  canvasContext.strokeStyle = gridColor;
  canvasContext.lineWidth = 1;
  canvasContext.beginPath();
  canvasContext.moveTo(dBToXPixel(minOutputDb), dBToYPixel(minOutputDb));
  canvasContext.lineTo(dBToXPixel(maxOutputDb), dBToYPixel(maxOutputDb));
  canvasContext.stroke();

  // Draw 0dBFS output levels from 0dBFS down to -36dBFS
  for (let dbFS = 0; dbFS >= -72; dbFS -= 12) {
    canvasContext.beginPath();
    let y = dBToYPixel(dbFS);
    canvasContext.moveTo(0, y );
    canvasContext.lineTo(width, y);
    canvasContext.stroke();
    canvasContext.textAlign = "right";
    canvasContext.strokeText(dbFS.toFixed(0), width - 5, y + 15);
    // canvasContext.strokeText(dbFS.toFixed(0), width - 5, y/2.475 + 15);
  }

  // Draw 0dBFS input line
  canvasContext.beginPath();
  canvasContext.moveTo(dBToXPixel(0), 0);
  canvasContext.lineTo(dBToXPixel(0), height);
  // canvasContext.stroke();

  // Draw threshold input line
  canvasContext.strokeStyle = thresholdColor;
  canvasContext.lineWidth = 0.75;
  canvasContext.beginPath();
  canvasContext.moveTo(dBToXPixel(dbThreshold), 0);
  canvasContext.lineTo(dBToXPixel(dbThreshold), height);
  canvasContext.stroke();

  // canvasContext.strokeStyle = meanOutputColor;
  // canvasContext.setLineDash([15, 5]);
  // canvasContext.beginPath();
  // canvasContext.moveTo(0, height - dBToXPixel(dbThreshold));
  // canvasContext.lineTo(width, height - dBToXPixel(dbThreshold));
  // canvasContext.stroke();

  // Draw knee input line
  canvasContext.strokeStyle = thresholdColor;
  canvasContext.setLineDash([]);
  canvasContext.beginPath();
  canvasContext.moveTo(dBToXPixel(m_kneeThresholdDb), 0);
  canvasContext.lineTo(dBToXPixel(m_kneeThresholdDb), height);
  canvasContext.stroke();

  //draw curve
  canvasContext.strokeStyle = curveColor;
  canvasContext.lineWidth = 6;
  canvasContext.beginPath();
  canvasContext.moveTo(0, canvas.height);
  let pixelsPerDb = (0.5 * height) / 40.0;
  let noctaves = 8;
  for (let x = 0; x < width; ++x) {
    let inputDb = xpixelToDb(x);
    let inputLinear = decibelsToLinear(inputDb);
    let outputLinear = saturate(inputLinear, k);
    let outputDb = linearToDecibels(outputLinear);
    // Add makeup gain.
    outputDb += makeupGain;
    let y = dBToYPixel(outputDb);
    canvasContext.lineTo(x, y);
  }
  canvasContext.stroke();
}

function thresholdHandler(event, ui) {
  threshold = parseFloat(ui.value);
  // dynamics.threshold.value = ui.value;
  // clearCanvas(cWidth, cHeight);
  drawCurve();
}

function kneeHandler(event, ui) {
  knee = parseFloat(ui.value);
  // dynamics.knee.value = ui.value;
  // clearCanvas(cWidth, cHeight);
  drawCurve();

}

function ratioHandler(event, ui) {
  ratio = parseFloat(ui.value);
  // dynamics.ratio.value = ui.value;
  // clearCanvas(cWidth, cHeight);
  drawCurve();

}


function makeupGainHandler(event, ui) {
  makeupGain = parseFloat(ui.value);
  // clearCanvas(cWidth, cHeight);
  drawCurve();
}

//

function initDisplay() {
  configureSlider("threshold", threshold, -72.0, 0, thresholdHandler);
  configureSlider("knee", knee, 0.0, 40, kneeHandler);
  configureSlider("ratio", ratio, 1, 20, ratioHandler);
  configureSlider("makeup", makeupGain, 0.1, 20, makeupGainHandler);

  drawCurve();

}

export {initDisplay}
