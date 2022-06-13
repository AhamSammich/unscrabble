const uut = require('./unscrabble-cli');
const mockArgv = require('mock-argv');


const testDict = [
    'BATTLE', 'TABLET', 'BALLET', 'TABLE', 'BEETLES', 'BAT',
    'EMBATTLED', 'AT'
];

const testLetters = 'abeltt';

describe('InputHandler with CLI', () => {
    const pathToNode = 'C:\\Program Files\\nodejs\\node.exe';
    const pathToScript = __dirname + '\\unscrabble.js';

    test('pulls arguments from the CLI', () => {
        mockArgv([testLetters, '5'], () => {
            process.argv = [
                pathToNode,
                pathToScript,
                testLetters,
                '5',
            ];
        })
        let inp = new uut.InputHandler();
        expect(inp.flag).toBeNull();
        expect(inp.inputVal[0]).toBe(testLetters)
    })    
    test('pulls optional flag from CLI', () => {
        mockArgv(['--def', 'battle'], () => {
            process.argv = [
                pathToNode,
                pathToScript,
                '--def',
                testLetters,
            ];
        })
        let inp = new uut.InputHandler();
        expect(inp.flag).toEqual('--def');
        expect(inp.inputVal[0]).toBe(testLetters)
    })

})

describe('InputHandler', () => {
    const handle = new uut.InputHandler([testLetters]);
    
    test('passes valid arguments', () => {
        const validInp2 = ['itsGood', 3];
        const validInp3 = ['itsGood'];
        const invalidInp1 = ['1ts_Good69', 0, 12];
        const invalidInp2 = ['it$ G0od!'];
        expect(handle.validateInput(validInp2)).toBe(true);
        expect(handle.validateInput(validInp3)).toBe(true);
        expect(handle.validateInput(invalidInp1)).toBe(false);
        expect(handle.validateInput(invalidInp2)).toBe(false);
    });
    
    test('validates argument types [str, num?, num?]', () => {
        const validInp1 = ['itsGood', 10, 3];
        const invalidInp3 = ['itsGood', 'NaN', 3];
        expect(handle.validateInput(validInp1)).toBe(true);
        expect(handle.validateInput(invalidInp3)).toBe(false);
    });
});

describe('Dictionary', () => {
    test('builds an array of strings', () => {
        let testObj = new uut.Solver();
        let dict = testObj.dict;
        expect(dict.wordList instanceof Array).toBe(true);
        expect(typeof dict.getRandomWord()).toBe('string');
    });

    test.skip('connects to the API', async () => {
        dict = await uut.Dictionary.getDefinition('battle');
        expect.assertions(1);
        return expect(dict['word']).toEqual('battle');
    })
})

describe('Solver', () => {
    test('filters for max and min lengths', () => {
        let testObj = new uut.Solver(3, testDict);

        let filtered = testObj.filterDict(testLetters.length, true);
        expect(filtered.length).toBe(3);

        filtered = testObj.filterDict(testLetters.length, false);
        expect(filtered.length).toBe(7);
    })
    
    test('finds anagrams of given word/letters', () => {
        let testObj = new uut.Solver(2, testDict);
        let dict = testObj.filterDict(testLetters.length, false);
        let result = testObj.getAnagrams(testLetters, dict);
        expect(result.length).toBe(5);
        
        testObj.minLen = 3;
        dict = testObj.filterDict(testLetters.length, false);
        result = testObj.getAnagrams(testLetters, dict);
        expect(result.length).toBe(4);
        
        dict = testObj.filterDict(testLetters.length, true);
        result = testObj.getAnagrams(testLetters, dict);
        expect(result.length).toBe(2);
    })

})

    