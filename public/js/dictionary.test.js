const dict = require('./dictionary');
let testDict;

beforeAll(async () => {
    testDict = await dict.get();
});

test('is an array', () => {
    expect(Array.isArray(testDict)).toBe(true);
});

test('contains strings', () => {
    expect(typeof testDict[0]).toBe('string');
});