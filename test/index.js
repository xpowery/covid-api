const path = require('path');
const JhuParser = require('../src/jhu/JhuParser');

const processUsStats = true;
let usaData = null;

console.time('PROCESS DONE IN: ');

async function processUsData() {
  const jhuParser = new JhuParser(path.resolve(__dirname, './data/csse_covid_19_data')
    , path.resolve(__dirname, './main/docs')
    , 'US');

  await jhuParser.process();
  usaData = jhuParser.processedData;
}

async function processGlobalData() {
  const jhuParser = new JhuParser(path.resolve(__dirname, './data/csse_covid_19_data')
    , path.resolve(__dirname, './main/docs')
    , 'ALL');

  jhuParser.usaData = usaData;

  await jhuParser.process();
}

async function process() {
  await processUsData();
  await processGlobalData();
}

process();

console.timeEnd('PROCESS DONE IN: ');
