const path = require('path');
const JhuParser = require('../src/jhu/JhuParser');

console.time('PROCESS DONE IN: ');

const jhuParser = new JhuParser(path.resolve(__dirname, './data/csse_covid_19_data/csse_covid_19_daily_reports_us')
  , path.resolve(__dirname, './main/docs'));

jhuParser.process();

console.timeEnd('PROCESS DONE IN: ');
