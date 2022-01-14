import { context } from './Context.js'

const createMeter = (supplier, control) => {
  const fftSize = 2048;
  const analyser = context.createAnalyser();
  analyser.fftSize = fftSize;
  const sampleBuffer = new Float32Array(analyser.fftSize);
  const input = context.createGain();
  const output = context.createGain();
  let peakInstantaneousPowerDecibels = null,
      peakInstantaneousPower = null,
      peakPowerDb = null,
      avgPowerDecibels = null,
      averagePower = null,
      sumOfSquares = null;

  supplier.connect(input);
  input.connect(analyser);

  function loop() {
    // Vary power of input to analyser. Linear in amplitude, so
    // nonlinear in dB power.
    // input.gain.value = 0.9 * (1 + Math.sin(Date.now() / 4e2));

    analyser.getFloatTimeDomainData(sampleBuffer);

    // Compute average power over the interval.
    sumOfSquares = 0;
    for (let i = 0; i < sampleBuffer.length; i++) {
      sumOfSquares += sampleBuffer[i] ** 2;
    }
    avgPowerDecibels = 10 * Math.log10(sumOfSquares / sampleBuffer.length);

    // Compute peak instantaneous power over the interval.
    peakInstantaneousPower = 0;
    for (let i = 0; i < sampleBuffer.length; i++) {
      const power = sampleBuffer[i] ** 2;
      peakInstantaneousPower = Math.max(power, peakInstantaneousPower);

    }

  peakPowerDb = 10 * Math.log10(peakInstantaneousPower);;
  control.value = peakPowerDb;

    // Display value.
    // displayNumber('avg', avgPowerDecibels);
    // displayNumber('inst', peakInstantaneousPowerDecibels);
    requestAnimationFrame(loop);

  }

  loop();

  return { analyser, peakPowerDb, loop }
}

export {createMeter}
