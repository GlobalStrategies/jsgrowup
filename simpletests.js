// SIMPLE TESTING (no framework, just console output)

const g = require('./index');
const csv = require('csvtojson');

const LONG_OUTPUT = true;
let tables = null;

class WhoResult {
    constructor(indicator, rowObject) {
        this.indicator = indicator;
        Object.keys(rowObject).forEach((key) => {
            this[key.toLowerCase()] = rowObject[key];
        });
        this.age = this.agemons;
        if (parseInt(this.gender, 10) === 1) {
            this.gender = 'M';
        } else if (parseInt(this.gender, 10) === 2) {
            this.gender = 'F';
        } else {
            this.gender = null;
        }
    }

    result() {
        if (this.indicator === g.LENGTH_HEIGHT_FOR_AGE) {
            return this._zlen;
        }
        if (this.indicator === g.WEIGHT_FOR_LENGTH) {
            return this._zwfl;
        }
        if (this.indicator === g.WEIGHT_FOR_AGE) {
            return this._zwei;
        }
        if (this.indicator === g.BODY_MASS_INDEX_FOR_AGE) {
            return this._zbmi;
        }
    }

    measurement() {
        if (this.indicator === g.LENGTH_HEIGHT_FOR_AGE) {
            return this.height;
        }
        if ([g.WEIGHT_FOR_HEIGHT, g.WEIGHT_FOR_LENGTH].includes(this.indicator)) {
            return this.weight;
        }
        if (this.indicator === g.WEIGHT_FOR_AGE) {
            return this.weight;
        }
        if (this.indicator === g.BODY_MASS_INDEX_FOR_AGE) {
            return this._cbmi;
        }
    }

    height() {
        if ([g.LENGTH_HEIGHT_FOR_AGE, g.WEIGHT_FOR_HEIGHT,
        g.WEIGHT_FOR_LENGTH, g.WEIGHT_FOR_AGE].includes(this.indicator)) {
            return this.height;
        }
    }
}

function compareResult(who) {
    let caseText = `${who.id}: ${who.indicator.toUpperCase()} ` +
        `(${Math.round(who.measurement() * 10) / 10}) ${who.gender} ` +
        `age=${who.age} height=${Math.round(who.height * 10) / 10} | `;
    const calc = new g.Calculator(false, false, tables);
    if (who.measurement() && parseFloat(who.age, 10) !== 0) {
        const ourResult = calc.zscoreForMeasurement(who.indicator, who.measurement(),
            who.age, who.gender, who.height);
        caseText += `THEM: ${who.result()} | `;
        if (who.result() && who.result() !== '' && who.result() !== ' ') {
            caseText += `US: ${ourResult} | `;
            const diff = who.result() - ourResult;
            caseText += `DIFF: ${Math.round(Math.abs(diff) * 10) / 10}`;
            const threshold = 1;
            const passed = (Math.abs(diff) < threshold);
            if (LONG_OUTPUT) {
                console.log(`${passed ? 'P' : 'F'} ${caseText}`);
            } else if (passed) {
                process.stdout.write('.');
            } else {
                process.stdout.write('F');
            }
        }
    }
}

g.buildTablesObject(true).then((data) => {
    tables = data;
    csv()
        .fromFile('./testdata/survey_z_rc.csv')
        .on('json', (rowObj) => {
            [g.LENGTH_HEIGHT_FOR_AGE, g.WEIGHT_FOR_LENGTH,
            g.WEIGHT_FOR_AGE, g.BODY_MASS_INDEX_FOR_AGE].forEach((ind) => {
                const who = new WhoResult(ind, rowObj);
                // exclude two cases
                if (who.id === '287' || who.id === '381') { return; }
                if ((ind === g.LENGTH_HEIGHT_FOR_AGE || ind === g.WEIGHT_FOR_LENGTH ||
                    ind === g.WEIGHT_FOR_HEIGHT) && (who.height === null || who.height === '' ||
                        who.height === ' ' || typeof who.height === 'undefined')) {
                    return;
                }
                compareResult(who);
            });
        });
});
