const path = require('path');
const JhuParser = require('./jhu/JhuParser');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../test/');
const DATA_REPO = 'data';
const MAIN_REPO = 'main';
const CSV_ROOT_DIR_NAME = 'csse_covid_19_data';

let usaData = null;

const dataRoot = path.join(
  WORKSPACE,
  DATA_REPO,
  CSV_ROOT_DIR_NAME,
);

const outputPath = path.join(
  WORKSPACE,
  MAIN_REPO,
  'docs',
);

async function executeUsFolder() {
  console.time('PROCESS DONE IN: ');

  try {
    const jhuParser = new JhuParser(dataRoot, outputPath, "US");
    await jhuParser.process();

    usaData = jhuParser.processedData;
  } catch (err) {
    console.log(err);
  }

  console.timeEnd('PROCESS DONE IN: ');
}

async function executeCountriesFolder() {
  console.time('PROCESS DONE IN: ');

  try {
    const jhuParser = new JhuParser(dataRoot, outputPath, "ALL");

    jhuParser.usaData = usaData;
    await jhuParser.process();
  } catch (err) {
    console.log(err);
  }

  console.timeEnd('PROCESS DONE IN: ');
}

async function execute() {
  await executeUsFolder();
  await executeCountriesFolder();
}

execute();
