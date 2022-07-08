'use strict';

const axios = require('axios');
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const TelegramBot = require('node-telegram-bot-api');
let bot = new TelegramBot('5595431440:AAEQEtkXiTZG63njbn7sG90WnTEeGUTzrak', {polling: false});

const pagesNumber = 4; //
const baseLink = 'https://www.daft.ie/'; 
//let linksLength = 20;
var parsingTimeout = 0; // Стартовое значение задержки следующего запроса (увеличивается с каждым запросом, чтобы не отправлять их слишком часто)

let links = {};
let linksList = {};
const filePath = 'links.json';
let newLinks = {};

function getJSONFile(path) {
    fs.readFile(path,
        {encoding:'utf8'},
        function(err, data) {
            if(err)
                console.log(err);
            else {
                linksList = JSON.parse(data);
                getLinks(1);
            }
                
        });
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getLinks(page) {

    console.log('Запрос на получение ссылок отправлен');

    console.log(`Страница - ${page}`);

    let link = `${baseLink}/property-for-rent/cork?from=${(page - 1) * 20}&pageSize=20&sort=publishDateDesc`;

    axios.get(link)
        .then(response => {
            console.log('Данные получены');
            let currentPage = response.data;
            const dom = new JSDOM(currentPage);
            const blockElements = dom.window.document.querySelectorAll('.SearchPage__Result-gg133s-2');

            blockElements.forEach(item => {
                const resultId = item.getAttribute('data-testid');
                const a = item.querySelector('a').getAttribute('href');

                if(!links[resultId]) 
                    links[resultId] = baseLink + a;

            });

            if(page < pagesNumber) getLinks(++page);
            else {
                console.log(links);
                for (let key in links) {
                    
                    if(!linksList[key]){
                        linksList[key] = links[key];
                        newLinks[key] = links[key];
                    }
                        
                }
                fs.writeFileSync(filePath, JSON.stringify(linksList), (err) => {
                    if (err) throw err;
                 });
                console.log(`Всего объектов - ${Object.keys(links).length}`);
                for(let key in newLinks) {
                    bot.sendMessage('293091374', `Новое объявление - ${newLinks[key]}`);
                }
                newLinks = {};
                
                parsingTimeout = getRandomArbitrary(1, 3) * 10000;
                setTimeout(() => {
                    getJSONFile(filePath);
                }, parsingTimeout);
            }
        });
}

getJSONFile(filePath);

