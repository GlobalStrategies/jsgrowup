const g = require('./jsgrowup');
const D = require('decimal.js');
const R = require('ramda');

const fs = require('fs-extra');

g.buildTablesObject(true).then((data) => {
  const calc = new g.Calculator(false, false, data);
  const obs = new g.Observation(g.WEIGHT_FOR_AGE, null, 30.1, 'M', 80, true);
  console.log(obs.tableNameForObservation());
  console.log(obs.getZScores(calc));
});

