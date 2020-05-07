const fs = require('fs');
const path = require('path');

const parse = require('csv-parse');

const CsvParser = require('../lib/CsvParser');
const version = "v1";

class JhuParser {
  constructor(rootDirectory, outputDirectory, reportFlag) {
    this.rootDirectory = rootDirectory;
    this.outputDirectory = outputDirectory;
    this.reportFlag = reportFlag;

    let csvFolder = 'csse_covid_19_daily_reports';
    if (this.reportFlag === 'US') {
      csvFolder = 'csse_covid_19_daily_reports_us';
    }

    this.rootDirectory = path.resolve(this.rootDirectory, csvFolder);

    this.jsonData = [];
  }

  async process() {
    await this.parseDir();
    await this.writeFile();
  }

  async parseDir() {
    let fileNames = await fs.promises.readdir(this.rootDirectory);
    const jsonOutputs = {};

    fileNames = fileNames.filter(fileName => fileName.indexOf('.csv') > -1);

    for (const fileName of fileNames) {
      const filePath = path.resolve(this.rootDirectory, fileName);

      try {
        const csvParser = new CsvParser('FILE', filePath, this.reportFlag);

        await csvParser.process();
        jsonOutputs[csvParser.processedData.date] = csvParser.processedData.regionalData;
      } catch (err) {
        console.log(err);
      }
    }

    this.jsonData = jsonOutputs;
  }

  async writeFile() {
    if (!this.jsonData || !(Object.keys(this.jsonData).length)) {
      throw new Error('Unable to process');
    }

    const fileData = {
      version: '0.1',
      description: 'COVID-19 report from CSSEGISandData',
    };

    try {
      this.outputDirectory = path.resolve(this.outputDirectory, version);

      // if (this.reportFlag === 'US') {
      //   this.outputDirectory = path.resolve(this.outputDirectory, 'usa');
      // } else {
      //   this.outputDirectory = path.resolve(this.outputDirectory, 'country');
      // }

      if (!fs.existsSync(this.outputDirectory)) {
        fs.mkdirSync(this.outputDirectory);
      }

      // const fileName =
      if (this.reportFlag === 'US') {
        fileData.data = this.jsonData;
        const jsonDataString = JSON.stringify(fileData);

        await fs.promises.writeFile(path.resolve(this.outputDirectory, 'timeseries-usa.json'), jsonDataString);
      } else {
        const allKeys = Object.keys(this.jsonData);
        const recentKey = allKeys[allKeys.length - 1];
        const allCountryKeys = Object.keys(this.jsonData[recentKey]);

        // this.jsonData[recentKey];

        const countryStats = {};

        // for (let key in allCountryKeys) {
        //   countryStats[key] = {};
        // }

        for (let dateKey in this.jsonData) {
          const dateSpecificData = this.jsonData[dateKey];

          for (let countryKey in dateSpecificData) {
            countryStats[countryKey] = countryStats[countryKey] || {};

            let countrySpecificStat = countryStats[countryKey];
            countrySpecificStat[dateKey] = dateSpecificData[countryKey];
          }
        }

        /// Writing all countries history
        await fs.promises.writeFile(path.resolve(this.outputDirectory, 'timeseries.json'), JSON.stringify({
          ...fileData,
          data: countryStats,
        }));

        for (let countryKey in countryStats) {
          const countryData = {
            ...fileData,
            data: countryStats[countryKey],
          };

          const jsonDataString = JSON.stringify(countryData);

          try {
            const countryCode = countryKey.toLowerCase().replace(/ /g, '-').replace(/\*/g, '');
            await fs.promises.writeFile(path.resolve(this.outputDirectory, `timeseries-${countryCode}.json`), jsonDataString);
          } catch (err) {
            console.log(err);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = JhuParser;
