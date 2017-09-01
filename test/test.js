const assert = require('chai').assert;
const fs = require('fs');
const Converter = require('csvtojson').Converter;

const grow = require('../index');

grow.buildTablesObject(true).then((data) => {
    const whoCases = [];
    const getWhoCases = () => new Promise((resolve) => {
        const converter = new Converter({});
        const convertToJson = (file) => {
            return new Promise((res, rej) => {
                converter.on('end_parsed', (jsonData) => {
                    if (!jsonData) {
                        rej('CSV to JSON conversion failed!');
                    }
                    res(jsonData);
                });
                fs.createReadStream(file).pipe(converter);
            });
        };

        convertToJson('./testdata/survey_z_rc.csv')
            .then(rows => {
                rows.forEach((rowObj) => {
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

                        whoCases.push(who);
                    });
                });
                return resolve(whoCases);
            })
            // handle a rejected promise
            .catch(console.warn);
    });
    getWhoCases().then((cases) => {
        describe('Test WHO cases', function () {
            cases.forEach((test) => {
                const caseText = `${test.id}: ${test.indicator.toUpperCase()} ` +
                    `(${Math.round(test.measurement() * 10) / 10}) ${test.gender} ` +
                    `age=${test.age} height=${Math.round(test.height * 10) / 10}`;
                it(`${caseText} within 1.1 SD of WHO`, () => {
                    const calc = new grow.Calculator(false, false, data);
                    const ours = calc.zscoreForMeasurement(test.indicator, test.measurement(),
                        test.age, test.gender, test.height);
                    const difference = Math.abs(test.result() - ours);
                    assert.isAtMost(difference, 1.1);
                });
            });
        });
        run();
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

