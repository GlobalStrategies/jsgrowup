const g = require('./jsgrowup');
const D = require('decimal.js');
const R = require('ramda');

const fs = require('fs-extra');

g.buildTablesObject().then((data) => {
  const calc = new g.Calculator(false, false, data);
  console.log(calc.zscoreForMeasurement(g.WEIGHT_FOR_LENGTH, 15, 15, 'm', 50));
});

