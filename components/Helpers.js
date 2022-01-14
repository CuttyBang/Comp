function configureControl(name, value, min, max, handler) {
  let param = name + '_control';
  let controller = document.getElementById(param);

  controller.setAttribute("min", min);
  controller.setAttribute("max", max);
  controller.setAttribute("value", value);
  controller.oninput = function() {
    handler(0, this.value);
  };
  handler(0, {value: value});
}

// configureControl("threshold", threshold, -36.0, 0, thresholdHandler);
// configureControl("knee", knee, 0.0, 40.0, kneeHandler);
// configureControl("ratio", ratio, 1, 20, ratioHandler);
// configureControl("makeupGain", makeupGain, 0, 20, makeupGainHandler);


export { configureControl };
