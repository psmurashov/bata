/**** 
*
* Ниже приведен пошаговый пример реализации:
* 1. Загрузка и создание карты из chanal_name.json
*
* Сначала загрузите JSON файл и создайте карту сопоставления имен каналов с их count. Это можно сделать при инициализации вашего приложения.
*
***/

// Инициализация карты при запуске приложения
let channelNameToCountMap = {};

// Функция для загрузки и обработки chanal_name.json
async function loadChannelNameMap() {
    try {
        const response = await fetch('channel_name.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить chanal_name.json');
        }
        const data = await response.json();
        data.forEach(item => {
            // Добавляем основной ключ
            channelNameToCountMap[item.name] = item.count;
            channelNameToCountMap[item.count] = item.icon;

            // Добавляем дополнительные ключи для частичных названий
            const parts = item.name.split(' ');
            for (let i = 1; i <= parts.length; i++) {
                const partialName = parts.slice(0, i).join(' ');
                if (!channelNameToCountMap[partialName]) {
                    channelNameToCountMap[partialName] = item.count;
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке chanal_name.json:', error);
    }
}



/*
let channelNameToCountMap = {};

// Функция для загрузки и обработки chanal_name.json
function loadChannelNameMap() {
    return fetch('channel_name.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось загрузить chanal_name.json');
            }
            return response.json();
        })
        .then(data => {
            data.forEach(item => {
                channelNameToCountMap[item.name] = item.count;
                channelNameToCountMap[item.count] = item.icon;
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке chanal_name.json:', error);
        });
}
*/
