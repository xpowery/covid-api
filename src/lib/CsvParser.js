const fs = require('fs');
const path = require('path');

const axios = require('axios');
const parse = require('csv-parse/lib/sync');

class CsvParser {
  constructor(ipSrc, path, reportFlag, { skipFirstLine } = {}) {
    this.canProcess = false;
    this.inputSource = ipSrc;
    this.csvPath = path;
    this.reportFlag = reportFlag;

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
      this.csvData = await fs.promises.readFile(this.csvPath);
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

    if (this.reportFlag === 'US') {
      for (let i = 0; i < records.length; i++) {

        const record = records[i];

        if (!record) {
          continue;
        }

        const isUsaRecord = record['Country_Region']
          && (record['Country_Region'].toLowerCase() === 'us'
            || record['Country_Region'].toLowerCase() === 'usa');

        if (!isUsaRecord) {
          continue;
        }

        /// Ignoring record with 'Recovered' state name
        if (record.Province_State
          && record.Province_State.toLowerCase() === 'recovered') {
          continue;
        }

        if (record
          && typeof record === 'object'
          && record.Last_Update
          && record.Last_Update.length >= 10) {

          if (!date) {
            date = this.formatDate(record.Last_Update);
          }

          this.jsonData[record.Province_State] = this.processStats(record);
        }
      }
    } else {
      for (let i = 0; i < records.length; i++) {

        const record = records[i];

        if (record && typeof record === 'object') {

          record['Province_State'] = record['Province_State'] || record['Province/State'] || record['﻿Province/State'];
          record['Country_Region'] = record['Country_Region'] || record['Country/Region'];
          record['Last_Update'] = record['Last_Update'] || record['Last Update'];

          if (record.Last_Update && record.Last_Update.length >= 10) {

            if (!date) {
              date = this.formatDate(record.Last_Update);
            }

            const country = record['Country_Region'];
            const state = record['Province_State'] || 'ALL';

            this.jsonData[country] = this.jsonData[country] || {};

            const currentStats = this.processStats(record);

            if (!this.jsonData[country][state]) {
              this.jsonData[country][state] = currentStats;
            } else {
              const previousStats = this.jsonData[country][state];
              this.jsonData[country][state] = this.concatenateStats(currentStats, previousStats);
            }
          }
        }
      }
    }

    this.processFile(date);
  }

  processStats(record) {

    const confirmed = record.Confirmed ? parseInt(record.Confirmed) : 0;
    const recovered = record.Recovered ? parseInt(record.Recovered) : 0;
    const deaths = record.Deaths ? parseInt(record.Deaths) : 0;

    return [confirmed, recovered, deaths];
  }

  concatenateStats(current, previous) {
    return [
      current[0] + previous[0],
      current[1] + previous[1],
      current[2] + previous[2],
    ]
  }

  formatDate(date) {
    try {
      if (date.indexOf('/') >= 0) {
        date = date.split(' ')[0];

        const splittedDate = date.split('/').map(digit => {
          if (digit.length === 1) {
            return '0' + digit;
          }

          return digit;
        });

        /// Handling dates like `1/30/20 16:00	`
        if (splittedDate[2].length == 2) {
          splittedDate[2] = '20' + splittedDate[2];
        }

        return splittedDate[2] + '-' + splittedDate[0] + '-' + splittedDate[1];
      }

      return date.substr(0, 10);
    } catch (err) {
      console.log(err);
      return null;
    }
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
