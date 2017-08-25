const vows = require('vows');
const assert = require('assert');
const csv = require('csvtojson');

const grow = require('./jsgrowup');

grow.buildTablesObject(true).then((data) => {
    const batch = {};
    csv()
        .fromFile('./testdata/survey_z_rc.csv')
        .on('json', (rowObj) => {
            function matchesWho(who) {
                const context = {
                    topic: () => {
                        const calc = new grow.Calculator(false, false, data);
                        return calc.zscoreForMeasurement(who.indicator, who.measurement(),
                            who.age, who.gender, who.height);
                    },
                    'within 1.1 SD of WHO': (topic) => {
                        const difference = Math.abs(who.result() - topic);
                        assert.epsilon(1.1, difference, 0);
                    }
                };
                return context;
            }

            [grow.LENGTH_HEIGHT_FOR_AGE, grow.WEIGHT_FOR_LENGTH,
            grow.WEIGHT_FOR_AGE, grow.BODY_MASS_INDEX_FOR_AGE].forEach((ind) => {
                const who = new WhoResult(ind, rowObj);
                // exclude cases with known data problems
                if (who.id === '287') { return; }

                // exclude cases with known discrepancies (still less than 1.6 SD)
                if ((who.id === '136' && ind === grow.LENGTH_HEIGHT_FOR_AGE) ||
                    (who.id === '234' && ind === grow.WEIGHT_FOR_LENGTH) ||
                    (who.id === '234' && ind === grow.BODY_MASS_INDEX_FOR_AGE) || 
                    (who.id === '397' && ind === grow.LENGTH_HEIGHT_FOR_AGE)) { return; } 
                
                // exclude cases with bad data
                if ((ind === grow.LENGTH_HEIGHT_FOR_AGE || ind === grow.WEIGHT_FOR_LENGTH ||
                    ind === grow.WEIGHT_FOR_HEIGHT) && (who.height === null || who.height === '' ||
                        who.height === ' ' || typeof who.height === 'undefined')) {
                    return;
                }
                if (parseInt(who.age, 10) === 0) { return; }
                if ((ind === grow.BODY_MASS_INDEX_FOR_AGE || ind === grow.WEIGHT_FOR_AGE ||
                    ind === grow.WEIGHT_FOR_LENGTH) && who.measurement() === '') { return; }

                    const caseText = `${who.id}: ${who.indicator.toUpperCase()} ` +
                    `(${Math.round(who.measurement() * 10) / 10}) ${who.gender} ` +
                    `age=${who.age} height=${Math.round(who.height * 10) / 10}`;
                batch[caseText] = matchesWho(who);
            });
        })
        .on('end', () => {
            vows.describe('WHO tests').addBatch(batch).run();
        });
});


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
        if (this.indicator === grow.LENGTH_HEIGHT_FOR_AGE) {
            return this._zlen;
        }
        if (this.indicator === grow.WEIGHT_FOR_LENGTH) {
            return this._zwfl;
        }
        if (this.indicator === grow.WEIGHT_FOR_AGE) {
            return this._zwei;
        }
        if (this.indicator === grow.BODY_MASS_INDEX_FOR_AGE) {
            return this._zbmi;
        }
    }

    measurement() {
        if (this.indicator === grow.LENGTH_HEIGHT_FOR_AGE) {
            return this.height;
        }
        if ([grow.WEIGHT_FOR_HEIGHT, grow.WEIGHT_FOR_LENGTH].includes(this.indicator)) {
            return this.weight;
        }
        if (this.indicator === grow.WEIGHT_FOR_AGE) {
            return this.weight;
        }
        if (this.indicator === grow.BODY_MASS_INDEX_FOR_AGE) {
            return this._cbmi;
        }
    }

    height() {
        if ([grow.LENGTH_HEIGHT_FOR_AGE, grow.WEIGHT_FOR_HEIGHT,
        grow.WEIGHT_FOR_LENGTH, grow.WEIGHT_FOR_AGE].includes(this.indicator)) {
            return this.height;
        }
    }
}

