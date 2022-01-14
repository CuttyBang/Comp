import { context } from './Context.js'

function e4(x, k) {
    return 1.0 - Math.exp(-k * x);
}

function dBToLinear(db) {
    return Math.pow(10.0, 0.05 * db);
}

function shape(x) {
  const threshold = -27;
  const headroom = 21;
  const linearThreshold = dBToLinear(threshold);
  const linearHeadroom = dBToLinear(headroom);

  const maximum = 1.05 * linearHeadroom * linearThreshold;
  const kk = (maximum - linearThreshold);

  const sign = x < 0 ? -1 : +1;
  const absx = Math.abs(x);

  let shapedInput = absx < linearThreshold ? absx : linearThreshold + kk * e4(absx - linearThreshold, 1.0 / kk);
  shapedInput *= sign;

  return shapedInput;
}

function mirrorCurve() {
  let n_samples = 65536,
      ws_table = new Float32Array(n_samples)
      n2 = n / 2;
  for (let i = 0; i < n2; ++i) {
    x = i / n2;
    x = shape(x);
    ws_table[n2 + i] = x;
    ws_table[n2 - i - 1] = x;
  }
  return ws_table;
}

function colortouchCurve() {
  let n_samples = 65536,
      ws_table = new Float32Array(n_samples),
      n2 = n_samples / 2;

  for (let i = 0; i < n2; ++i) {
      x = i / n2;
      x = shape(x);
      ws_table[n2 + i] = x;
      ws_table[n2 - i - 1] = -x;
  }
  return ws_table;
}

function tubeCurve() {
  let n_samples = 8192,
      ws_table = new Float32Array(n_samples),
      i, x;
  for (i = 0; i < n_samples; i++) {
      x = i * 2 / n_samples - 1;
      if (x < -0.08905) {
          ws_table[i] = (-3 / 4) * (1 - (Math.pow((1 - (Math.abs(x) - 0.032857)), 12)) + (1 / 3) * (Math.abs(x) - 0.032847)) + 0.01;
      } else if (x >= -0.08905 && x < 0.320018) {
          ws_table[i] = (-6.153 * (x * x)) + 3.9375 * x;
      } else {
          ws_table[i] = 0.630035;
      }
  }
  return ws_table;
};

let setDrive = function(drive) {
    if (drive < 0.01) drive = 0.01;
    this.input.gain.value = drive;
    var postDrive = Math.pow(1 / drive, 0.6);
    this.output.gain.value = postDrive;
}

const createDrive = () => {
  const saturation = context.createWaveShaper();
  const inputGain = context.createGain();
  const driveGain = context.createGain();
  const outputGain = context.createGain();
  const drive = driveGain.gain;
  const input = inputGain.gain;
  const output = outputGain.gain;

  saturation.curve = tubeCurve();
  input.value = 1;
  dive.value = 0.5;
  output.value = 0.2;

  inputGain.connect(driveGain);
  driveGain.connect(saturation);
  saturation.connect(outputGain);

  return {saturation, input, drive, output}
};

export { createDrive, colortouchCurve, tubeCurve };
