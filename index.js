const jsgrowup = require('./jsgrowup');

jsgrowup.buildTablesObject().then((data) => {
  const adjustHeightData = false;
  const adjustWeightScores = false;
  const calc = new jsgrowup.Calculator(adjustHeightData, adjustWeightScores, data);

  const indicator = jsgrowup.WEIGHT_FOR_AGE;
  const measurement = 10.4;
  const ageInMonths = 22.45;
  const gender = 'F';
  const height = 84.8;
  const american = false;
  console.log('zscore: ' + 
    `${calc.zscoreForMeasurement(indicator, measurement, ageInMonths, gender, height, american)}`);
});

