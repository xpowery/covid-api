const fs = require('fs');
const path = require('path');

const parse = require('csv-parse');

const CsvParser = require('../lib/CsvParser');

class JhuParser {
  constructor(rootDirectory, outputDirectory) {
    this.rootDirectory = rootDirectory;
    this.outputDirectory = outputDirectory;

    this.jsonData = [];
  }

  async process() {
    await this.parseDir();
    await this.writeFile();
  }

  async parseDir() {
    const fileNames = await fs.promises.readdir(this.rootDirectory);
    const jsonOutputs = [];

    for (const fileName of fileNames) {
      const filePath = path.resolve(this.rootDirectory, fileName);

      const csvParser = new CsvParser('FILE', filePath);

      await csvParser.process();
      jsonOutputs.push(csvParser.processedData);
    }

    this.jsonData = jsonOutputs;
  }

  async writeFile() {
    if (!this.jsonData || !this.jsonData.length) {
      throw new Error('Unable to process');
    }

    const jsonData = JSON.stringify({
      version: '0.1',
      description: 'COVID-19 report from CSSEGISandData',
      data: this.jsonData,
    });

    try {
      if (!fs.existsSync(this.outputDirectory)) {
        fs.mkdirSync(this.outputDirectory);
      }

      await fs.promises.writeFile(path.resolve(this.outputDirectory, 'timeseries.json'), jsonData);
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = JhuParser;
