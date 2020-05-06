const path = require('path');
const JhuParser = require('./jhu/JhuParser');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../test/');
const DATA_REPO = 'data';
const MAIN_REPO = 'main';
const CSV_DIR_NAME = 'csse_covid_19_data/csse_covid_19_daily_reports_us';

const dataRoot = path.join(
  WORKSPACE,
  DATA_REPO,
  CSV_DIR_NAME,
);

const outputPath = path.join(
  WORKSPACE,
  MAIN_REPO,
  'docs',
);

async function execute() {
  console.time('PROCESS DONE IN: ');

  try {
    const jhuParser = new JhuParser(dataRoot, outputPath);
    await jhuParser.process();
  } catch (err) {
    console.log(err);
  }

  console.timeEnd('PROCESS DONE IN: ');
}

execute();
