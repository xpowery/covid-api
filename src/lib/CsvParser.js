const fs = require('fs');
const path = require('path');

const axios = require('axios');
const parse = require('csv-parse/lib/sync');

class CsvParser {
  constructor(ipSrc, path, { skipFirstLine } = {}) {
    this.canProcess = false;
    this.inputSource = ipSrc;
    this.csvPath = path;

    this.csvData = null;
    this.jsonData = null;
    this.processedData = {};
    this.skipFirstLine = skipFirstLine || true;
  }

  async process() {
    try {
      await this.fetch();
      this.doParse();

      this.canProcess = true;
    } catch (err) {
      /// TODO: throw err here
      console.error(err);
      this.canProcess = false;
    }
  }

  async fetch() {
    if (!this.inputSource) {
      throw new Error('Invalid input source');
    }

    if (!this.csvPath) {
      throw new Error('Invalid input path');
    }

    if (this.inputSource === 'FILE') {
      this.csvData = await fs.promises.readFile(this.csvPath, 'utf8');
      return;
    }

    /// considering this.inputSource is API URL
    const response = await axios.get(this.csvPath);
    this.csvData = response.data;
  }

  doParse() {
    if (!this.csvData || this.csvData.length === 0) {
      throw new Error('Invalid csv Data');
    }

    this.jsonData = {};

    const records = parse(this.csvData, {
      trim: true,
      columns: true,
      skip_empty_lines: true,
    });

    let date = '';

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (record && typeof record === 'object'
        && record.Last_Update && record.Last_Update.length >= 10) {

        if (!date) {
          date = record.Last_Update.substr(0, 10);
        }

        const confirmed = record.Confirmed ? parseInt(record.Confirmed) : 0;
        const recovered = record.recovered ? parseInt(record.recovered) : 0;
        const deaths = record.deaths ? parseInt(record.deaths) : 0;

        this.jsonData[record.Province_State] = [confirmed, recovered, deaths];
      }
    }

    this.processFile(date);
  }

  processFile(date) {
    if (!this.jsonData || !(Object.keys(this.jsonData).length)) {
      throw new Error('Unable to process');
    }

    // const regions = [];
    // const hasVisited = {};

    // for (let i = 0; i < this.jsonData.length; i++) {
    //   if (!hasVisited[this.jsonData[i].state]) {
    //     regions.push(this.jsonData[i].state);
    //     hasVisited[this.jsonData[i].state] = true;
    //   }
    // }

    this.processedData = {
      date,
      regionalData: this.jsonData,
    };
  }
}

module.exports = CsvParser;
