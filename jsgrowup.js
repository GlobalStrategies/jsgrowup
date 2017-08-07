const D = require('decimal.js');

class Observation {
    constructor(indicator, measurement, ageInMonths, sex, height, american) {
        this.indicator = indicator;
        this.measurement = measurement;
        this.position = null;
        this.age = D(ageInMonths);
        this.sex = sex.toUppercase();
        this.height = height;
        this.american = american;

        this.tableIndicator = null;
        this.tableAge = null;
        this.tableSex = null;

        // TODO: missing height check
    }

    ageInWeeks() {
        return ((this.age * D(30.4374)) / D(7));
    }

    roundedHeight() {
        // round height to closest half centimeter
        const rounded = (Math.round(D(this.height) / D(0.5))) * D(0.5);
        return rounded.toString();
    }


}

class Calculator {
    constructor(adjustHeightData = false, adjustWeightScores = false, includeCDC = false) {
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

        this.includeCDC = includeCDC;

        /*
        # load WHO Growth Standards
        # http://www.who.int/childgrowth/standards/en/
        # WHO tab-separated txt files have been converted to json,
        # and the separate lhfa tables (0-2 and 2-5) have been combined
        */
        const whoTables = [
            'wfl_boys_0_2_zscores.json',  'wfl_girls_0_2_zscores.json',
            'wfh_boys_2_5_zscores.json',  'wfh_girls_2_5_zscores.json',
            'lhfa_boys_0_5_zscores.json', 'lhfa_girls_0_5_zscores.json',
            'hcfa_boys_0_5_zscores.json', 'hcfa_girls_0_5_zscores.json',
            'wfa_boys_0_5_zscores.json',  'wfa_girls_0_5_zscores.json',
            'wfa_boys_0_13_zscores.json',  'wfa_girls_0_13_zscores.json',
            'lhfa_boys_0_13_zscores.json', 'lhfa_girls_0_13_zscores.json',
            'hcfa_boys_0_13_zscores.json', 'hcfa_girls_0_13_zscores.json',
            'bmifa_boys_0_13_zscores.json', 'bmifa_girls_0_13_zscores.json',
            'bmifa_boys_0_2_zscores.json',  'bmifa_girls_0_2_zscores.json',
            'bmifa_boys_2_5_zscores.json',  'bmifa_girls_2_5_zscores.json'];
        
        /*
        # load CDC growth standards
        # http://www.cdc.gov/growthcharts/
        # CDC csv files have been converted to JSON, and the third standard
        # deviation has been fudged for the purpose of this tool.
        */

        const cdcTables = [
            'lhfa_boys_2_20_zscores.cdc.json',
            'lhfa_girls_2_20_zscores.cdc.json',
            'wfa_boys_2_20_zscores.cdc.json',
            'wfa_girls_2_20_zscores.cdc.json',
            'bmifa_boys_2_20_zscores.cdc.json',
            'bmifa_girls_2_20_zscores.cdc.json'];
    }
}
