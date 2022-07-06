const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// School Dictionary API
// const apiUrl = 'https://www.dictionaryapi.com/api/v3/references/sd4/json/'
// const apiKey = '4d9687f8-d7f5-46cb-aba3-95806f893300'

// Collegiate Dictionary API
const apiUrl = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/'
const apiKey = 'e1b58875-396f-4962-9666-1dc93ca771f8'

const createDict = async () => {
    return new Promise((resolve, reject) => {

        try {
            const filePath = path.resolve(__dirname, '..', 'files', 'corncob_caps.txt');

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
                        let defArray = JSON.parse(body);
                        let defObj = { word, label: defArray[0].fl, def: defArray[0].shortdef };
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