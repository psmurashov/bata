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
            channelNameToCountMap[item.name.toLowerCase()] = item.count.toLowerCase();
            channelNameToCountMap[item.count] = item.icon;

            // Добавляем дополнительные ключи для частичных названий
            const parts = item.name.split(' ');
            for (let i = 1; i <= parts.length; i++) {
                const partialName = parts.slice(0, i).join(' ');
                if (!channelNameToCountMap[partialName]) {
                    channelNameToCountMap[partialName] = item.count.toLowerCase();
                }
            }

            // Добавляем все возможные комбинации частей названия
            for (let i = 1; i <= parts.length; i++) {
                for (let j = i; j <= parts.length; j++) {
                    const partialName = parts.slice(i - 1, j).join(' ');
                    if (!channelNameToCountMap[partialName]) {
                        channelNameToCountMap[partialName] = item.count.toLowerCase();
                    }
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

            // Добавляем все возможные комбинации частей названия
            for (let i = 1; i <= parts.length; i++) {
                for (let j = i; j <= parts.length; j++) {
                    const partialName = parts.slice(i - 1, j).join(' ');
                    if (!channelNameToCountMap[partialName]) {
                        channelNameToCountMap[partialName] = item.count;
                    }
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке chanal_name.json:', error);
    }
}

// Функция для поиска канала по названию
function findChannel(name) {
    // Проверяем точное совпадение
    if (channelNameToCountMap[name]) {
        return channelNameToCountMap[name];
    }

    // Проверяем частичное совпадение
    const parts = name.split(' ');
    for (let i = 1; i <= parts.length; i++) {
        const partialName = parts.slice(0, i).join(' ');
        if (channelNameToCountMap[partialName]) {
            return channelNameToCountMap[partialName];
        }
    }

    return null; // Если не найдено ни точного, ни частичного совпадения
}
*/
// Пример использования
/*
(async () => {
    await loadChannelNameMap(); // Ждем завершения загрузки JSON
    console.log(channelNameToCountMap['Россия 1']); // Должно вывести "7904"
    console.log(channelNameToCountMap['Россия 1 FHD']); // Должно вывести "7904"
    console.log(channelNameToCountMap['Россия 1 HD']); // Должно вывести "7904"
    console.log(channelNameToCountMap['Россия 1 HDX']); // Должно вывести "7904" (если нет точного совпадения)
})();
*/