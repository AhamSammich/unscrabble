const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
require('dotenv').config();

// School Dictionary API
// const apiUrl = 'https://www.dictionaryapi.com/api/v3/references/sd4/json/'
// const apiKey = process.env.SCHOOL_DICT_API_KEY;

// Collegiate Dictionary API
const apiUrl = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/'
const apiKey = process.env.COLLEGIATE_DICT_API_KEY;

const createDict = async () => {
    return new Promise((resolve, reject) => {

        try {
            const filePath = path.resolve(__dirname, '..', 'files', 'dictionary.txt');

            let file = fs.readFileSync(filePath, 'utf8');
            file = file.replace(/\r/g, "");
            file = file?.split('\n');
            // console.dir(file.map(elem => elem.length).reduce((a, b) => { return Math.max(a, b) }))
            resolve(file);

        } catch (err) {
            reject(err);
        }
    });
}

const getDefinition = (word) => {
    return new Promise((resolve, reject) => {
        try {
            const request = https.get(
                `${apiUrl}${word}?key=${apiKey}`,
            response => {
                if (response.statusCode != 200) {
                    const message = `There was an error getting the definition for ${word} (${
                        response.statusCode}: ${http.STATUS_CODES[response.statusCode]})`;
                    const statusCodeError = new Error(message);
                    throw statusCodeError;
                }
                
                let body = "";
                response.setEncoding('utf8');
                response.on('data', (data) => {
                    body += data;
                });
                response.on('end', () => {
                    try {
                        let data = JSON.parse(body);
                        let defObj = { word, label: null, def: null};

                        // Check for any available definition
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].shortdef == false) continue;
                            defObj.label = data[i].fl;
                            defObj.def = data[i].shortdef;
                            break;
                        }
                        resolve(defObj);
                    } catch (error) {
                        let err = new Error(`There was an error getting the definition for ${
                            word} (${error.message})`);
                        reject(err);
                    }
                });
            });
            request.on('error', error => console.error(error.code));
        } catch (error) {
            let err = new Error(`There was an error getting the definition for ${
                word} (${error.message})`);
            reject(err);
        }
        
    });
}

const getRandomWord = () => this.wordList[Math.floor(Math.random()*this.length)]?.toUpperCase();

module.exports.get = createDict;
module.exports.define = getDefinition;
module.exports.random = getRandomWord;