/*function iptv_search_name() {
  return 'iptv_search_name is loading...';
}
*/

const https = require('https');

function iptv_search_name(channelName, callback) {
    const url = 'https://psmurashov.github.io/bata/app/vender/chanal_name.json';

    https.get(url, (res) => {
        let data = '';

        // Слушаем событие 'data' для сбора данных
        res.on('data', (chunk) => {
            data += chunk;
        });

        // Слушаем событие 'end' для обработки данных
        res.on('end', () => {
            try {
                const channels = JSON.parse(data);

                for (const channel of channels) {
                    if (channel.name === channelName) {
                        callback(null, channel.count);
                        return;
                    }
                }

                callback(null, null); // Если канал не найден
            } catch (error) {
                callback(error, null);
            }
        });

    }).on('error', (error) => {
        callback(error, null);
    });
}



/*
const fs = require('fs');
const path = require('path');

function iptv_search_name(channelName) {
    const filePath = path.join(__dirname, 'chanal_name.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const channels = JSON.parse(data);

    for (const channel of channels) {
        if (channel.name === channelName) {
            return channel.count;
        }
    }

    return null; // Если канал не найден
}

// Пример использования функции

const channelName = "Prokop TV Масяня";
const count = iptv_search_name(channelName);
console.log(count); // Выведет 7904, если канал найден
***/