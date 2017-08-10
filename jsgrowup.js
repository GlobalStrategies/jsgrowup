const D = require('decimal.js');
const R = require('ramda');
const fs = require('fs-extra');

const WEIGHT_FOR_LENGTH = 'wfl';
const WEIGHT_FOR_HEIGHT = 'wfh';
const LENGTH_HEIGHT_FOR_AGE = 'lhfa';
const HEAD_CIRC_FOR_AGE = 'hcfa';
const WEIGHT_FOR_AGE = 'wfa';
const BODY_MASS_INDEX_FOR_AGE = 'bmifa';

const AGE_0_2 = '0_2';
const AGE_2_5 = '2_5';
const AGE_0_5 = '0_5';
const AGE_0_13 = '0_13';
const AGE_2_20 = '2_20';

const SEX_BOYS = 'boys';
const SEX_GIRLS = 'girls';

class Observation {
    constructor(indicator, measurement, ageInMonths, sex, height, american) {
        this.indicator = indicator;
        this.measurement = measurement;
        this.position = null;
        this.ageInMonths = ageInMonths;
        this.sex = sex.toUpperCase();
        this.height = height;
        this.american = american;

        this.tableIndicator = null;
        this.tableAge = null;
        this.tableSex = null;

        // TODO: missing height check
    }

    getZScores(calculator) {
        const tableName = this.tableNameForObservation();
        const table = calculator.whoTables[tableName];
        if ([WEIGHT_FOR_HEIGHT, WEIGHT_FOR_LENGTH].includes(this.indicator)) {
            if (!this.height) { throw new Error('NO HEIGHT'); }
            if (this.height < 45) { throw new Error('too short'); }
            if (this.height > 120) { throw new Error('too tall'); }
            /* find closest height from WHO table (which has data at a resolution
            of half a centimeter). */
            const closestHeight = (Math.round(this.height / 0.5)) * 0.5;
            const scores = table[closestHeight.toString()];
            return scores;
        }
        // all other indicators
        if (this.ageInWeeks <= 13) {
            const closestWeek = Math.floor(this.ageInWeeks);
            const scores = table[closestWeek.toString()];
            return scores;
        }
        // all other ages
        const closestMonth = Math.floor(this.ageInMonths);
        const scores = table[closestMonth.toString()];
        return scores;
    }

    ageInWeeks() {
        return ((this.ageInMonths * 30.4374) / 7);
    }

    tableNameForObservation() {
        /* Choose a WHO/CDC table to use, making adjustments
        based on age, length, or height. If, for example, the
        indicator is set to wfl while the child is too long for
        the recumbent tables, this method will make the lookup
        in the wfh table. */

        if (this.sex === 'M') { this.tableSex = SEX_BOYS; }
        if (this.sex === 'F') { this.tableSex = SEX_GIRLS; }

        if ([WEIGHT_FOR_HEIGHT, WEIGHT_FOR_LENGTH].includes(this.indicator)) {
            if (this.indicator === WEIGHT_FOR_LENGTH && this.height > 86) {
                console.log('too long for recumbent');
                this.tableIndicator = WEIGHT_FOR_HEIGHT;
                this.tableAge = AGE_2_5;
            } else if (this.indicator === WEIGHT_FOR_HEIGHT && this.height < 65) {
                console.log('too short for standing');
                this.tableIndicator = WEIGHT_FOR_LENGTH;
                this.tableAge = AGE_0_2;
            } else {
                this.tableIndicator = this.indicator;
                if (this.tableIndicator === WEIGHT_FOR_LENGTH) { this.tableAge = AGE_0_2; }
                if (this.tableIndicator === WEIGHT_FOR_HEIGHT) { this.tableAge = AGE_2_5; }
            }
        } else if ([WEIGHT_FOR_AGE, LENGTH_HEIGHT_FOR_AGE, HEAD_CIRC_FOR_AGE].includes(
                    this.indicator)) {
            /* weight for age has only one table per sex, as does head circumference for age
            and CDC goes unused before 24mos */
            this.tableIndicator = this.indicator;
            this.tableAge = AGE_0_5;
            if (this.ageInMonths <= 3) {
                if (this.ageInWeeks() <= 13) {
                    this.tableAge = AGE_0_13;
                }
            }
            if (this.american && this.ageInMonths >= 24) {
                if (this.indicator === HEAD_CIRC_FOR_AGE) {
                    throw new Error(`TOO OLD ${this.ageInMonths}`);
                }
                this.tableAge = AGE_2_20;
            }
        } else if (this.indicator === BODY_MASS_INDEX_FOR_AGE) {
            this.tableIndicator = this.indicator;
            if (this.ageInMonths <= 3 && this.ageInWeeks() <= 13) {
                this.tableAge = AGE_0_13;
            } else if (this.ageInMonths < 24) {
                this.tableAge = AGE_0_2;
            } else if (this.ageInMonths >= 24 && this.ageInMonths <= 60) {
                this.tableAge = AGE_2_5;
            } else if (this.ageInMonths > 60 && this.ageInMonths <= 240) {
                this.tableAge = AGE_2_20;
            } else if (this.ageInMonths > 240) {
                throw new Error(`TOO OLD ${this.ageInMonths}`);
            }
        }

        if (!this.tableIndicator || !this.tableSex || !this.tableAge) {
            throw new Error('DATA ERROR');
        } else {
            const tableName = `${this.tableIndicator}_${this.tableSex}_${this.tableAge}`;
            return tableName;
        }
    }
}

function buildWhoTablesObject() {
    /*
    # WHO Growth Standards
    # http://www.who.int/childgrowth/standards/en/
    # WHO tab-separated txt files have been converted to json,
    # and the separate lhfa tables (0-2 and 2-5) have been combined
    */
    const whoTableNames = [
        'wfl_boys_0_2', 'wfl_girls_0_2',
        'wfh_boys_2_5', 'wfh_girls_2_5',
        'lhfa_boys_0_5', 'lhfa_girls_0_5',
        'hcfa_boys_0_5', 'hcfa_girls_0_5',
        'wfa_boys_0_5', 'wfa_girls_0_5',
        'wfa_boys_0_13', 'wfa_girls_0_13',
        'lhfa_boys_0_13', 'lhfa_girls_0_13',
        'hcfa_boys_0_13', 'hcfa_girls_0_13',
        'bmifa_boys_0_13', 'bmifa_girls_0_13',
        'bmifa_boys_0_2', 'bmifa_girls_0_2',
        'bmifa_boys_2_5', 'bmifa_girls_2_5'];

    const getWhoFilePath = tableName => `./tables/${tableName}_zscores.json`;
    const loadWhoFiles = R.pipe(getWhoFilePath, R.pipeP(fs.readFile, JSON.parse));

    const allowedIndexKeys = ['Length', 'Height', 'Month', 'Week'];
    const operativeIndexKey = R.pipe(R.keysIn, R.intersection(allowedIndexKeys), R.head);
    const reIndex = R.indexBy(R.chain(R.prop, operativeIndexKey));
    // find first allowed index key within object keys — this is the operative index key
    // index by the values of the operative index key

    // reindex all
    return Promise.all(R.map(loadWhoFiles, whoTableNames))
            .then(R.map(reIndex))
            .then(R.zipObj(whoTableNames))
            .then((data) => data);
}

function buildCdcTablesObject() {
    /*
    # CDC growth standards
    # http://www.cdc.gov/growthcharts/
    # CDC csv files have been converted to JSON, and the third standard
    # deviation has been fudged for the purpose of this tool.
    */

    const cdcTableNames = [
        'lhfa_boys_2_20',
        'lhfa_girls_2_20',
        'wfa_boys_2_20',
        'wfa_girls_2_20',
        'bmifa_boys_2_20',
        'bmifa_girls_2_20'];

    const getCdcFilePath = tableName => `./tables/${tableName}_zscores.cdc.json`;
    const loadCdcFiles = R.pipe(getCdcFilePath, R.pipeP(fs.readFile, JSON.parse));

}

class Calculator {
    constructor(adjustHeightData = false, adjustWeightScores = false, whoTables = null, cdcTables = null) {
        /*
        # Height adjustments are part of the WHO specification
        # (to correct for recumbent vs standing measurements),
        # but none of the existing software seems to implement this.
        # default is false so values are closer to those produced
        # by igrowup software
        */
        this.adjustHeightData = adjustHeightData;
        
        /*
        # WHO specs include adjustments to z-scores of weight-based
        # indicators that are greater than +/- 3 SDs. These adjustments
        # correct for right skewness and avoid making assumptions about
        # the distribution of data beyond the limits of the observed values.
        # However, when calculating z-scores in a live data collection
        # situation, z-scores greater than +/- 3 SDs are likely to indicate
        # data entry or anthropometric measurement errors and should not
        # be adjusted. Instead, these large z-scores should be used to
        # identify poor data quality and/or entry errors.
        # These z-score adjustments are appropriate only when there
        # is confidence in data quality.
        */
        this.adjustWeightScores = adjustWeightScores;

        this.whoTables = whoTables;
        this.cdcTables = cdcTables;
    }
}

module.exports = {
    WEIGHT_FOR_LENGTH,
    WEIGHT_FOR_HEIGHT,
    LENGTH_HEIGHT_FOR_AGE,
    HEAD_CIRC_FOR_AGE,
    WEIGHT_FOR_AGE,
    BODY_MASS_INDEX_FOR_AGE,
    AGE_0_2,
    AGE_2_5,
    AGE_0_5,
    AGE_0_13,
    AGE_2_20,
    SEX_BOYS,
    SEX_GIRLS,
    buildWhoTablesObject,
    buildCdcTablesObject,
    Calculator,
    Observation
};
