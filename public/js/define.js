const getWords = () => {
    let main = document.querySelector('main');
    return main.dataset.array?.split(',');
}

const getDefinition = word => {
    const dictUrl = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/';
    const dictKey = 'e1b58875-396f-4962-9666-1dc93ca771f8';

    return new Promise(resolve => {
        fetch(`${dictUrl}${word}?key=${dictKey}`)
        .then(response => response.json())
        .then(data => {
            let defObj = { word, label: data[0].fl, def: data[0].shortdef };
            resolve(defObj);
        }).catch(error => {
            console.error(error.message);
            reject(error);
        });
    });
}

const defineAll = async () => {
    const wordArr = getWords();
    try {
        let results = await Promise.all(
            wordArr.map(word => getDefinition(word))
        );
        results = results.filter(result => result.def?.length > 0);
        results.forEach(createHtml());
        // return results;
    } catch (error) {
        console.error(error);
        // return new Error(error.message, 500);
    }
}

const showHtml = elements => {
    elements[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
    elements?.forEach(elem => {
        elem.removeAttribute('data-hidden');
        elem.classList.add('fade-in');
    });    
}

const hideHtml = elements => {
    elements.forEach(elem => {
        elem.setAttribute('data-hidden', "");
    });
}

const createHtml = defObj => {
    defObj = defObj || { 'label': 'No definition retrieved' }
    let p = document.createElement('p');
    p.textContent = defObj.label;
    p.setAttribute('data-class', 'label');
    
    let ul = document.createElement('ul');
    ul.className = 'flex-col';
    // hideDefinition(ul);
    defObj.def?.forEach(def => {
        let li = document.createElement('li');
        li.textContent = def;
        ul.append(li);
    });

    let elements = [p, ul];
    hideHtml(elements);

    let entry = document.getElementById(defObj.word)
    entry.append(...elements);

    return elements;
}

document.addEventListener('DOMContentLoaded', () => {
    const wordArr = getWords();
    wordArr.forEach(word => {
        let elem = document.getElementById(word);
        elem.addEventListener('click', async e => {
            let result = await getDefinition(word);
            let entry = createHtml(result);
            showHtml(entry);
            elem.querySelector(
                '[data-class="word"]'
                ).setAttribute('data-class', 'defined');
        }, {once: true});
    });
});