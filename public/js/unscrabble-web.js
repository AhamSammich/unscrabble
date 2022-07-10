const dictionary = require('./dictionary');

class InputHandler {
    constructor(inputArr) {
        this.inputVal = inputArr;
    }

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
    
    get validated() {
        let inputIsValid = this.validateInput();
        if (inputIsValid) return this.inputVal;
        return new TypeError('Invalid input received.', 400);
    }
}

class Dictionary {
    static #dictFile = dictionary.get();

    constructor(dictSrc, minWordLength=3) {
        if (dictSrc) {
            this.words = dictSrc;
        } else {
            this.words = Dictionary.#dictFile;
        }
        this.minLen = minWordLength;
    }

    static setList = async () => this.#dictFile = await dictionary.get();

    get wordList() {return this.words.filter(word => word.length >= this.minLen)}
    
    get length() {return this.wordList.length}
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
        return anagrams.sort((a, b) => b.length - a.length);
    }
}

// Calculate Scrabble points
const calcWordValue = word => {
    let pointValues = {
        "A": 1, "B": 3, "C": 3, "D": 2, "E": 1, "F": 4, "G": 2,
        "H": 4, "I": 1, "J": 8, "K": 5, "L": 1, "M": 3, "N": 1,
        "O": 1, "P": 3, "Q": 10, "R": 1, "S": 1, "T": 1, "U": 1,
        "V": 4, "W": 4, "X": 8, "Y": 4, "Z": 10
    }
    return [...word].map(ltr => pointValues[ltr]).reduce((a, b) => a + b, 0)
}

const main = async (input) => {
    await Dictionary.setList();
    let inp = new InputHandler(input);
    if (inp == null) return new Error('No input received.', 400);

    let words = new Solver();
    let anagrams = words.getSolution(inp.validated, false);
    return anagrams
}

const handleApiRequest = async (input) => {
    let data = {};
    let anagrams = await main(input);
    let results = {};

    anagrams.forEach(word => {
        results[word] = calcWordValue(word);
    });
    data['letters'] = input[0];
    data['maxLength'] = Math.max(...Object.keys(results).map(word => word.length));
    data['maxPoints'] = Math.max(...Object.values(results));
    data['bestWords'] = Object.keys(results).filter(
        word => results[word] == data.maxPoints
    );
    data['longestWords'] = Object.keys(results).filter(
        word => word.length == data.maxLength
    );
    data['words'] = results;
    return data;
}

module.exports = { InputHandler, Solver, main, handleApiRequest };