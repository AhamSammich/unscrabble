const script = require('../static/files/unscrabble-web')
const express = require('express');
const port = process.env.PORT || 8080;

const app = express();

app.use(express.static('static'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'pug');

app.get('/', (req, res) => {
    res.render('index');
    res.end();
});

app.post('/search', async (req, res) => {
    let results = await script.main([...Object.values(req.body)]);
    req.body['results'] = results;
    res.render('words', req.body);
    res.end();
})

app.listen(port, () => {
    console.log( `App running on port:${port}.`);
});
