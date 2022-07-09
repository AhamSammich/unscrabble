const script = require('./public/js/unscrabble-web');
const dict = require('./public/js/dictionary');
const express = require('express');
const port = process.env.PORT || 8080;

const app = express();

app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'pug');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/results', async (req, res) => {
    try {
        let results = await script.main([...Object.values(req.body)]);
        if (results instanceof Error) {
            res.render('error', { message: results.message, statusCode: results.code })
        } else {
            req.body['results'] = results;
            res.render('results', req.body);
        }
    } catch (err) {
        res.render('error', { message: err.message, statusCode: err.code })
    }
});

// API route
app.get('/api/v1/anagrams/:letters([A-Za-z]{3,})', async (req, res) => {
    try {
        let letters = req.params.letters;
        let max = letters.length;
        let min = 3;
        let results = await script.handleApiRequest([letters, max, min]);
        if (results instanceof Error) {
            res.render('error', { message: results.message, statusCode: results.code })
        } else {
            res.json(results);
        }
    } catch (err) {
        res.send(err.message);
    } 
});

app.get('/api/v1/define/:word', async (req, res) => {
    try {
        let def = await dict.define(req.params.word);
        res.json(def);
    } catch (err) {
        res.send({ Error : err.message });
    }
});

app.listen(port, () => {
    console.log( `App running at http://localhost:${port}.`);
});
