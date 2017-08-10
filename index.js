const g = require('./jsgrowup');
const D = require('decimal.js');
const R = require('ramda');

const fs = require('fs-extra');

g.buildWhoTablesObject().then((data) => {
  const calc = new g.Calculator(false, false, data);
  const obs = new g.Observation(g.WEIGHT_FOR_HEIGHT, null, 1, 'F', 80.4, true);
  console.log(obs.tableNameForObservation());
  console.log(obs.getZScores(calc));
});

