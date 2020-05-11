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
        fileData.data = this.reprocessStructure(this.jsonData);
        const jsonDataString = JSON.stringify(fileData);

        await fs.promises.writeFile(path.resolve(this.outputDirectory, 'timeseries-usa.json'), jsonDataString);
      } else {
        const allKeys = Object.keys(this.jsonData);
        const recentKey = allKeys[allKeys.length - 1];
        const allCountryKeys = Object.keys(this.jsonData[recentKey]);

        // this.jsonData[recentKey];

        const countryStats = {};
        const countryStatsReprocessed = {};

        // for (let key in allCountryKeys) {
        //   countryStats[key] = {};
        // }

        for (let dateKey in this.jsonData) {
          const dateSpecificData = this.jsonData[dateKey];

          for (let countryKey in dateSpecificData) {
            const countryCode = countryKey.toLowerCase().replace(/ /g, '-').replace(/\*/g, '');

            countryStats[countryCode] = countryStats[countryCode] || {};

            let countrySpecificStat = countryStats[countryCode];
            countrySpecificStat[dateKey] = dateSpecificData[countryKey];
          }
        }


        ///Reprocess
        for (const country in countryStats) {
          countryStatsReprocessed[country] = this.reprocessStructure(countryStats[country]);
        }

        /// Writing all countries history
        await fs.promises.writeFile(path.resolve(this.outputDirectory, 'timeseries.json'), JSON.stringify({
          ...fileData,
          data: countryStatsReprocessed,
        }));

        for (let countryKey in countryStatsReprocessed) {
          const countryData = {
            ...fileData,
            data: countryStatsReprocessed[countryKey],
          };

          const jsonDataString = JSON.stringify(countryData);

          try {
            const countryCode = countryKey;// .toLowerCase().replace(/ /g, '-').replace(/\*/g, '');
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

  reprocessStructure(data) {
    const stateSpecificData = {};

    for (const date in data) {
      const dateSpecificData = data[date];

      for (const region in dateSpecificData) {
        const regionCode = region.toLowerCase().replace(/ /g, '-').replace(/\*/g, '');

        stateSpecificData[regionCode] = stateSpecificData[regionCode] || {};
        stateSpecificData[regionCode][date] = dateSpecificData[region];
      }
    }

    return stateSpecificData;
  }
}

module.exports = JhuParser;
