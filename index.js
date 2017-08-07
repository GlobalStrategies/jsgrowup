const jsgrowup = require('./jsgrowup');
const D = require('decimal.js');

const input = process.argv[2];

const rounded = (Math.round(D(input) / D(0.5))) * D(0.5);

console.log(`${D(input)} -> ${rounded.toString()}`);
