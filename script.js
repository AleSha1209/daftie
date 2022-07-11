'use strict';

const axios = require('axios');
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const TelegramBot = require('node-telegram-bot-api');
let bot = new TelegramBot('5401004376:AAE8I7UU--tCEqodpi61FdA6ZnMV0vSg2kQ', {polling: true});

bot.on('message', (msg) => {
    let a = 'Привет, Диана =)';
    let b = 'С этой минуты ссылки на новые объекты по твоему запросу будут своевременно приходить в этот чат.';
    let c = 'С актуальными объектами можешь ознакомиться по ссылке https://daft.ie/property-for-rent/cork?from=0&pageSize=20&sort=publishDateDesc&rentalPrice_to=1000&leaseLength_from=6';
    
    if(msg.text == '/start') {
        bot.sendMessage(msg.chat.id, a)
        .then(() => {
            bot.sendMessage(msg.chat.id, b);
        }).then(() => {
            bot.sendMessage(msg.chat.id, c);
        }); 
    } 
});

const baseLink = 'https://www.daft.ie'; 

let links = {};
let linksList = {};
const filePath = 'links.json';
let newLinks = {};

function getJSONFile(path) {
    fs.readFile(
        path,
        {encoding:'utf8'},
        function(err, data) {
            if(err)
                console.log(err);
            else {
                if(data != '') {
                    linksList = JSON.parse(data);
                    console.log(Object.keys(linksList).length);
                }
                getLinks(1);
            }      
        }
    );
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getLinks(page) {

    console.log('Запрос на получение ссылок отправлен');
    console.log(`Страница - ${page}`);

    let link = `${baseLink}/property-for-rent/cork?from=${(page - 1) * 20}&pageSize=20&sort=publishDateDesc&rentalPrice_to=1000&leaseLength_from=6`;

    axios.get(link, {timeout: 5000})
        .then(response => {

            console.log('Данные получены');
            let dom = new JSDOM(response.data);

            const blockElements = dom.window.document.querySelectorAll('.SearchPage__Result-gg133s-2');

            blockElements.forEach(item => {
                const resultId = item.getAttribute('data-testid');
                const a = item.querySelector('a').getAttribute('href');

                if(!links[resultId]) 
                    links[resultId] = baseLink + a;

            });

            if(blockElements.length == 20) getLinks(++page);
            //if(page < pagesNumber) getLinks(++page);
            else {
                for (let key in links) {
                    if(!linksList[key]){
                        linksList[key] = links[key];
                        newLinks[key] = links[key];
                    }   
                }
                fs.writeFileSync(filePath, JSON.stringify(linksList), {flag: 'w+'}, (err) => {
                   if (err) throw err;
                });
                console.log(`Всего объектов - ${Object.keys(links).length}`);
                for(let key in newLinks) {
                    bot.sendMessage('743648517', `Новый объект - ${newLinks[key]}`);
                    bot.sendMessage('293091374', `Новое объявление - ${newLinks[key]}`);
                }
                newLinks = {};
            
                setTimeout(() => {
                    getJSONFile(filePath);
                }, 300000);
            }
        }).catch((e) => {
            console.log('Ошибка. Ожидание - 5 секунд');
            setTimeout(() => {
                getJSONFile(filePath);
            }, 5000);
        });
}

getJSONFile(filePath);

