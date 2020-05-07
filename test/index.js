const path = require('path');
const JhuParser = require('../src/jhu/JhuParser');

const processUsStats = true;

console.time('PROCESS DONE IN: ');

const jhuParser = new JhuParser(path.resolve(__dirname, './data/csse_covid_19_data')
  , path.resolve(__dirname, './main/docs')
  , processUsStats ? 'US' : 'ALL');

jhuParser.process();

console.timeEnd('PROCESS DONE IN: ');
