import { context } from './Context.js'

const autoMakeup = (comp) => {
    var magicCoefficient = 3, // raise me if the output is too hot
        c = comp;
    return -(c.threshold.value - c.threshold.value / c.ratio.value) / magicCoefficient;
}

const createCompressor = () => {
  const dynamics = context.createDynamicsCompressor();
  const input = context.createGain();
  const output = context.createGain();
  const makeupGain = context.createGain();

  input.gain.value = 1;
  makeupGain.gain.value = 0.5;
  output.gain.value = 1;

  // attack: 0-1 .003
  // knee: 0-40 30
  // ratio: 1-20 12
  // release: 0-1 0.250
  // thresh: -100 - 0 -24
  dynamics.attack.value = 0.1;
  dynamics.knee.value = 10;
  dynamics.ratio.value = 12;
  dynamics.release.value = 0.250
  dynamics.threshold.value = -24;
  let attack = dynamics.attack.value;
  let knee = dynamics.knee.value;
  let ratio = dynamics.ratio.value;
  let release = dynamics.release.value;
  let threshold = dynamics.threshold.value;
  let makeup = makeupGain.gain;


  input.connect(dynamics);
  dynamics.connect(makeupGain);
  makeupGain.connect(output);

  return {input, output, makeup, attack, knee, ratio, release, threshold};
};

export {createCompressor}
