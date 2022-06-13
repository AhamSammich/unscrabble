const fs = require('fs');
const https = require('https');
const http = require('http');

class InputHandler {
    constructor(inputArr) {
        this.flag = null;
        this.inputVal = inputArr ?? this.parseCLI();
    }

    parseCLI = () => {
        let args = process.argv.slice(2);
        this.flag = args[0].startsWith('-') ? args.splice(0,1)[0] : null;
        return args;
    }

    // Validate input
    validateInput = (inp=this.inputVal) => {
        let firstArgRegex = /.*[^A-Za-z].*/;
        if (firstArgRegex.test(inp[0])) return false;
        if (inp?.[1]) {
            if (isNaN(parseInt(inp[1])) === true) return false;
        }
        if (inp?.[2]) {
            if (isNaN(parseInt(inp[2])) === true) return false;
        }
        return true;
    }
    
    // Clean up invalid input
    get validated() {
        let inputIsValid = this.validateInput();
        console.log(`Input passed: ${this.inputVal}`);
        if (inputIsValid) return this.inputVal;
        return null;
    }


}

class Dictionary {
    static #dictFile = 'dictionary.txt';
    static #apiUrl = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/'
    static #apiKey = 'e1b58875-396f-4962-9666-1dc93ca771f8'

    constructor(dictSrc, minWordLength=2) {
        if (dictSrc) {
            this.words = dictSrc;
        } else {
            this.words = Dictionary.#createFromFile();
        }
        this.minLen = minWordLength;
    }
    
    static #createFromFile = fileName => {
        let file = fs.readFileSync((fileName || this.#dictFile), 'utf8');
        let dictionary = file.split('\n');
        return dictionary;
    }

    get wordList() {
        return this.words.filter(word => word.length >= this.minLen)
    }
    
    get length() {return this.wordList.length}

    getRandomWord = () => this.wordList[Math.floor(Math.random()*this.length)]?.toUpperCase();

    static getDefinition = (word) => {
        return new Promise((resolve, reject) => {
            try {
                const request = https.get(
                    `${Dictionary.#apiUrl}${word}?key=${Dictionary.#apiKey}`,
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
                            resolve({ word, def: defArray[0].shortdef });
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
            
        })
    }
}


class Solver {
    constructor(min=3, dictSrc) {
        this.dict = new Dictionary(dictSrc, min);
        this.maxLen = null;
        this.minLen = min;
    }

    static #setIsValid = (letterSet, wordSet) => {
        let checkSet = new Set(letterSet)
        for (let letter of wordSet) {
            if (checkSet.size == 0) return false;
            if (checkSet.has(letter)) {
                checkSet.delete(letter);
            } else return false;
        }
        return true;
    }

    static #getCounter = (str) => {
        const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
        let counterObj = {};
        str = str.toUpperCase();
        let strSet = new Set(str);
        strSet.forEach(elem => counterObj[elem] = countOccurrences(Array.from(str), elem));
        return counterObj;
    }

    static #wordIsValid = (strA, strB) => {

        let letterCounter = this.#getCounter(strA);
        let wordCounter = this.#getCounter(strB);
   
        for (let [k, v] of Object.entries(wordCounter)) {
            if (v > letterCounter[k]) {
                return false;
            }
        }
        return true
    }


    getSolution = (inputArr, matchLen=true) => {
        if (inputArr == null) return;

        let [letters, max, min] = [...inputArr];
        this.maxLen = max || letters.length;
        if (min) this.minLen = min;

        if (!letters) {
            console.log("No letters given.");
            return;
        }
        
        let dict = this.filterDict(letters.length, matchLen);
        return this.getAnagrams(letters, dict);
    }

    filterDict = (inputLen, matchLen) => {
        let dict = this.dict.wordList;
        if (matchLen) {
            return dict.filter(word => word.length == inputLen);
        }
        let withinMax = word => this.maxLen ? word.length <= this.maxLen : true;
        return dict.filter(word => word.length >= this.minLen && withinMax(word));

    }

    getAnagrams = (letters="", dictionary) => {
        let anagrams = [];
        let letterSet = new Set(letters.toUpperCase());
        
        dictionary.forEach(word => {
            let wordSet = new Set(word);
            let validSet = Solver.#setIsValid(letterSet, wordSet);
            if (validSet) {
                let validWord = Solver.#wordIsValid(letters, word);
                if (validWord) anagrams.push(word);
            }
        });
        return anagrams;
    }
}

const main = async (input) => {
    let inp = new InputHandler(input);
    if (inp == null) return;

    let words = new Solver(5);
    let anagrams = words.getSolution(inp.validated, true);
    console.log(anagrams);
    if (inp.flag == '--def') {
        for (let word of anagrams) {
            try {
                let result = await Dictionary.getDefinition(word);
                console.log(`${result.word}:\n\t${result.def?.join('\n\t')}`);
            } catch (error) {
                console.error(error);
            }
        }
    }
}

if (process.argv[2]) main();

module.exports = { InputHandler, Dictionary, Solver, main };