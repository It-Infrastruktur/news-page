import {awsQueryLanguage, awsQuerySpecificHeadlines} from '../src/api/AwsBackendAPI.jsx';
import _ from 'lodash'
import {createArticles, selectChoices, createSourceButtons, createOverlayContent} from '../src/renderHTML/RenderHTMLContent.js';

const apiKey = "8566b11f65a14d54b8be47b1c01db39e";
const main = document.querySelector('main');
const defaultSource = "der-tagesspiegel";
const sourceSelector = document.querySelector('#sourceSelector');
const languages = {lang: [{id: "de", name: "Deutsch"}, {id: "en", name: "Englisch"}]};
const categories = {cat: [{id: "business", name: "Wirtschaft" }, {id: "entertainment", name: "Unterhaltung"}, {id:"general", name: "Allgemein"},
        {id: "health", name: "Gesundheit"}, {id: "science", name: "Wissenschaft"}, {id: "sports", name: "Sport"},
        {id:"technology", name:"Technologie"}, {id: undefined, name: "Keine Präferenz"}]};
const overlayContent = {languageOverlay:"In welcher Sprache möchtest du deine News?", categoryOverlay: "Welche Themenbereiche interessieren dich?"};

let initialSourcesLanguageJSON = "";
let initalHeadlinesJSON = "";
let urlNews = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
let currentLanguageChoice = "", currentCategoryChoice = "", activeSource = "";

window.addEventListener('load', ev => {
    init();
    if ('serviceWorker' in navigator) {
        try {
            navigator.serviceWorker.register('sw.js');
            console.log('Service Worker Registered')
        } catch (e) {
            console.error('Registration failed')
        }
    }
})

function init() {
    overlayLanguage();
};

function overlayLanguage() {
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
    overlay.innerHTML = createOverlayContent(overlayContent.languageOverlay);
    let overlayOptions = document.getElementById('overlay-options');
    overlayOptions.innerHTML = languages.lang.map( lang => selectChoices(lang)).join('\n');
    document.getElementById('button-accept').addEventListener( 'click', ev => {
        currentLanguageChoice = overlayOptions.options[overlayOptions.selectedIndex].value;
        overlayCategory(overlay)
    })
}


function overlayCategory(overlay) {
    overlay.innerHTML = createOverlayContent(overlayContent.categoryOverlay);
    let overlayOptions = document.getElementById('overlay-options');
    overlayOptions.innerHTML = categories.cat.map( categories => selectChoices(categories)).join('\n')
    document.getElementById('button-accept').addEventListener('click', ev => {
        currentCategoryChoice = overlayOptions.options[overlayOptions.selectedIndex].value;
        overlay.style.display = 'none';
        updateSources();
    })
}

async function updateNotifier() {
    let snackbar = document.getElementById('snackbar')
    let updatedHeadlinesJSON = await awsQuerySpecificHeadlines(activeSource, initalHeadlinesJSON);
    document.getElementById('reloadPage').addEventListener('click', ev => {
        ev.preventDefault();
        renderMain(updatedHeadlinesJSON)
    })
    if (_.isEqual(initalHeadlinesJSON, updatedHeadlinesJSON)) {
        console.log("snackbar hide");
        snackbar.clickName = 'hide';
    } else {
        console.log("snackbar show!")
        snackbar.className = 'show';
    }

};

//https://blog.aylien.com/getting-started-news-api-part-3-advanced-search/

async function updateSources() {
    const queryPackage = {"language": currentLanguageChoice, "category": currentCategoryChoice};
    initialSourcesLanguageJSON = await awsQueryLanguage(queryPackage);
    sourceSelector.innerHTML = initialSourcesLanguageJSON.sources.map(
        src => createSourceButtons(src)).join('\n')
    sourceSelector.innerHTML += `<br\><br\><br\><li type="button" class="list-group-item" id="resortChange"> Resort wechslen</li>`
    sourceSelector.addEventListener('click', evt => {
            if (evt.target.id !== 'resortChange') {
                activeSource = evt.target.id;
                changeActiveElement(evt);
                showSpecificHeadlines(activeSource);
            } else {
                let overlay = document.getElementById('overlay');
                overlay.style.display = 'block';
                overlayCategory(overlay);
            }
        }
    );
}

function changeActiveElement(evt){
    let elems = document.querySelectorAll(".active");
    [].forEach.call(elems, function(el) {
        el.classList.remove("active");
    });
    evt.target.className += ' active'
}

async function showSpecificHeadlines(source = defaultSource) {
    let id = source;
    if (typeof source.target !== "undefined") {
        id = source.target.id
    }
    initalHeadlinesJSON = await awsQuerySpecificHeadlines(activeSource);
    renderMain(initalHeadlinesJSON)
    //interval
    console.log("timeout")

   let interval =  setInterval(updateNotifier, 300000, initalHeadlinesJSON);
}

function renderMain(json) {
    document.getElementById('newsOf').innerText = "Nachrichten von " + '"'+ initalHeadlinesJSON.articles[0].source.name + '"'
    main.innerHTML = json.articles.map(article => createArticles(article)).join('\n');
}