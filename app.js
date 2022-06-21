const script = require('./public/js/unscrabble-web')
const express = require('express');
const { response } = require('express');
const port = process.env.PORT || 8080;

const app = express();

app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'pug');

app.get('/', (req, res) => {
    res.render('index');
    res.end();
});

app.post('/results', async (req, res) => {
    try {
        let results = await script.main([...Object.values(req.body)]);
        if (results instanceof Error) {
            res.render('error', { message: results.message, statusCode: results.code })
            res.end();
        } else {
            req.body['results'] = results;
            res.render('results', req.body);
            res.end();
        }
    } catch (err) {
        res.render('error', { message: err.message, statusCode: err.code })
        res.end();
    }
});

app.listen(port, () => {
    console.log( `App running on port:${port}.`);
});
