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
function loadChannelNameMap() {
    return fetch('chanal_name.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось загрузить chanal_name.json');
            }
            return response.json();
        })
        .then(data => {
            data.forEach(item => {
                channelNameToCountMap[item.name] = item.count;
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке chanal_name.json:', error);
        });
}




// Вызов загрузки при инициализации
//loadChannelNameMap();




/*
async function iptv_search_name(channelName) {
    try {
        // Загружаем JSON файл
        const response = await fetch('chanal_name.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Разрешаем промис и получаем данные
        const channels = await response.json();

        // Проверяем, что channels является массивом
        if (!Array.isArray(channels)) {
            throw new Error('Channels data is not an array');
        }

        for (const channel of channels) {
            if (channel.name === channelName) {
                return channel.count;
            }
        }

        return null; // Если канал не найден
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
*/
//NEW
/*
function fun_iptv_search(channelName_) {
  iptv_search_name(channelName_).then(count => {
    if (count !== null) {
      return count;
    }
  });
};
*/


///iptv_search_name(channelName_).then((count) => { count });