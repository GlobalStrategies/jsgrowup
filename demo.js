const grow = require('./index');

grow.buildTablesObject().then((data) => {
  const adjustHeightData = false;
  const adjustWeightScores = false;
  const calc = new grow.Calculator(adjustHeightData, adjustWeightScores, data);

  const indicator = grow.WEIGHT_FOR_AGE;
  const measurement = 10.4;
  const ageInMonths = 22.45;
  const gender = 'F';
  const height = 84.8;
  const american = false;
  console.log(`given ${ageInMonths}-month-old ${gender}, ${height} cm tall, ` +
    `${measurement} measurement (linked to indicator, e.g. weight) | ${indicator} zscore = ` +
    `${calc.zscoreForMeasurement(indicator, measurement, ageInMonths, gender, height, american)}`);
});
