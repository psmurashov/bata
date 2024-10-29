async function iptv_search_name(channelName) {
    try {
        // Загружаем JSON файл
        const response = await fetch('chanal_name.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const channels = await response.json();

        // Ищем канал по имени
        const channel = channels.find(channel => channel.name === channelName);

        if (channel) {
            return channel.count;
        } else {
            throw new Error('Channel not found');
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
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