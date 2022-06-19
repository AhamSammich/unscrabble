class InputHandler {
    constructor(inputArr) {
        this.flag = null;
        this.inputVal = inputArr ? this.parseArr(inputArr) : this.parseCLI();
    }

    parseArr = (inputArr) => {
        let args = inputArr;
        this.flag = args[0].startsWith('-') ? args.splice(0,1)[0] : null;
        return args;
    }

    parseCLI = () => {
        let args = process.argv.slice(2);
        this.flag = args[0].startsWith('-') ? args.splice(0,1)[0] : null;
        return args;
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
        return null;
    }
}

class Dictionary {
    static #dictFile;
    // School Dictionary API
    // static #apiUrl = 'https://www.dictionaryapi.com/api/v3/references/sd4/json/'
    // static #apiKey = '4d9687f8-d7f5-46cb-aba3-95806f893300'
    
    // Collegiate Dictionary API
    static #apiUrl = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/'
    static #apiKey = 'e1b58875-396f-4962-9666-1dc93ca771f8'

    constructor(dictSrc, minWordLength=3) {
        if (dictSrc) {
            this.words = dictSrc;
        } else {
            this.words = Dictionary.#dictFile;
        }
        this.minLen = minWordLength;
    }

    static #getFile = (fileName) => {
        return new Promise(resolve => {
            fetch(fileName)
            .then(response => resolve(response.text()));
        });
    }

    static createList = async (fileName) => {
        let file = await this.#getFile(fileName);
        let dictionary = file?.split('\r\n');
        this.#dictFile = dictionary;
    }
    

    get wordList() {
        return this.words.filter(word => word.length >= this.minLen);
    }
    
    get length() {return this.wordList.length}

    getRandomWord = () => this.wordList[Math.floor(Math.random()*this.length)]?.toUpperCase();

    static getDefinition = (word) => {
        return new Promise(resolve => {
            fetch(`${this.#apiUrl}${word}?key=${this.#apiKey}`)
            .then(response => response.json())
            .then(data => {
                let defObj = { word, pos: data[0].fl, def: data[0].shortdef };
                resolve(defObj);
            });
        });
     }
}


class Solver {
    constructor(min=3, dictSrc) {
        this.dict = new Dictionary(dictSrc, min);
        this.maxLen = null;
        this.minLen = min;
        this.matchLen = false;
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


    getSolution = (inputArr) => {
        if (inputArr == null) return;

        let [letters, max, min] = [...inputArr];
        this.maxLen = max || letters.length;
        if (min) this.minLen = min;

        if (!letters) {
            console.log("No letters given.");
            return;
        }
        
        let dict = this.filterDict(letters.length);
        return this.getAnagrams(letters, dict);
    }

    filterDict = (inputLen) => {
        let dict = this.dict.wordList;
        if (this.matchLen) {
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
    await Dictionary.createList('./files/dictionary.txt');
    let inp = new InputHandler(input);
    if (inp == null) return;

    let words = new Solver();
    let anagrams = words.getSolution(inp.validated);
    if (inp.flag == '--def') {
        try {
            let results = await Promise.all(
                anagrams.map(word => Dictionary.getDefinition(word))
            );
            for (let result of results) {
                if (!result.def?.[0]) {
                    result.def = ['DEFINITION NOT RETRIEVED'];
                    continue;
                }
                createHtml(result);
            }
        } catch (error) {
            console.error(error);
        }
    }
}

const clearHtml = () => {
    document.querySelector('main').innerHTML = "";
    document.querySelector('header').innerHTML = "";
}

const getTiles = (letters) => {
    let tiles = [];
    for (let char of letters) {
        let tile = document.createElement('div');
        tile.className = 'tile';
        tile.style = (
            `height: 4.5rem; width: 3rem; background-image: url(
                '../images/resized-tile-pngs/${
            char.toLowerCase()}.png'); background-size: cover;`
        );
        tiles.push(tile);
    }
    return tiles;
}

const createHeader = (letters="") => {
    let hdr = document.querySelector('header');
    let tiles = getTiles(letters);
    hdr.append(...tiles);
}

const createHtml = (defObj) => {
    let h = document.createElement('h2');
    h.textContent = defObj.word;

    let p = document.createElement('p');
    p.style = 'font-style: italic;'
    p.textContent = defObj.pos;

    let ul = document.createElement('ul');
    ul.className = 'flex-col';
    defObj.def?.forEach(def => {
        let li = document.createElement('li');
        li.textContent = def;
        ul.append(li);
    })
    
    let wordDiv = document.createElement('div');
    wordDiv.className = 'flex-col flex-center';
    wordDiv.append(...[h, p, ul]);

    let mainElem = document.querySelector('main');
    mainElem.append(wordDiv);
}

const parseData = form => {
    let data = new FormData(form);
    
    data['letters'] = form.querySelector('#letters').value;
    let minMax = [form.querySelector('#min'), form.querySelector('#max')];
    let length = data.letters.length;
    
    if (minMax[0].value > length) minMax[0].value = length;
    data['max'] = minMax[1].value;
    data['min'] = minMax[0].value;

    return data;
}


const htmlForm = document.querySelector('form');
htmlForm.addEventListener('submit', e => {
    e.preventDefault();
    let formData = parseData(htmlForm);
    clearHtml();
    createHeader(formData.letters);
    main(['--def', ...Array.from(formData.values())]);
})

createHeader('unscrabble');
