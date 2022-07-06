const getWords = () => {
    let main = document.querySelector('main');
    return main.dataset.array?.split(',');
}

const getEmpty = () => {
    let emptyElems = [...document.querySelectorAll('[data-class="word"]')];
    return emptyElems.map(elem => elem.parentElement);
}

const getLoader = () => {
    let loadElem = document.createElement('div');
    loadElem.classList.add('loader');
    return loadElem;
}

const getDefinition = (word, secondCheck=false) => {
    // if (secondCheck) console.log('Second API checked');
    const dictUrl = secondCheck ? 
    'https://www.dictionaryapi.com/api/v3/references/sd4/json/' :
    'https://www.dictionaryapi.com/api/v3/references/collegiate/json/';

    const dictKey = secondCheck ?
    '4d9687f8-d7f5-46cb-aba3-95806f893300' :
    'e1b58875-396f-4962-9666-1dc93ca771f8';

    return new Promise(resolve => {
        fetch(`${dictUrl}${word}?key=${dictKey}`)
        .then(response => response.json())
        .then(data => {
            let defObj = { word, label: null, def: null};

            // Check for any available definition
            for (let i = 0; i < data.length; i++) {
                if (data[i].shortdef == false) continue;
                defObj.label = data[i].fl;
                defObj.def = data[i].shortdef;
                break;
            }
            resolve(defObj);
        }).catch(error => {
            console.error(error.message);
            reject(error);
        });
    });
}

const defineAll = async () => {
    const empty = getEmpty();
    try {
        await Promise.all(
            empty.map(loadEntry)
        );
    } catch (error) {
        console.error(error);
    }
}

const showHtml = elements => {
    elements?.forEach(elem => {
        elem.removeAttribute('data-hidden');
        elem.classList.add('fade-in');
    });    
}

const hideHtml = elements => {
    elements?.forEach(elem => {
        elem.setAttribute('data-hidden', "");
    });
}

const createHtml = defObj => {
    let p = document.createElement('p');
    p.textContent = defObj.label || 'Definition not found.';
    p.setAttribute('data-class', 'label');
    
    let ul = document.createElement('ul');
    ul.className = 'flex-col';
    defObj.def?.forEach(def => {
        let li = document.createElement('li');
        li.textContent = def;
        ul.append(li);
    });

    let elements = [p, ul];
    hideHtml(elements);

    let entry = document.getElementById(defObj.word)
    entry?.append(...elements);

    return elements;
}

const loadEntry = async elem => {
    let loader = getLoader();
    let word = elem.querySelector('[data-class="word"]');
    word.setAttribute('data-class', 'loading');
    elem.append(loader);

    let result = await getDefinition(elem.id);
    // Check a second dictionary API if first yields no definition
    if (result.label == null) result = await getDefinition(elem.id, true);
    
    let entryHtml = createHtml(result);
    loader.remove();
    showHtml(entryHtml);
    word.setAttribute('data-class', 'defined');
}

document.addEventListener('DOMContentLoaded', () => {
    const wordArr = getWords();
    wordArr.forEach(word => {
        let elem = document.getElementById(word);
        elem?.addEventListener('pointerup', async e => {
            if (e.target.dataset.class === 'defined') return;
            elem.scrollIntoView({ behavior: "smooth", block: "center" });
            loadEntry(elem);
        }, {once: true});
    });

    const defineBtn = document.getElementById('define-all');
    defineBtn.addEventListener('pointerup', async e => {
        let main = defineBtn.parentElement;
        let loader = getLoader();
        defineBtn.remove();
        main.append(loader);
        // hideHtml([defineBtn]);
        await defineAll();
        loader.remove();
    });
});