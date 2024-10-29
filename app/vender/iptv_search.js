async function iptv_search_name(channelName) {
    const url = 'https://psmurashov.github.io/bata/app/vender/chanal_name.json';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке данных: ' + response.statusText);
        }

        const channels = await response.json();

        for (const channel of channels) {
            if (channel.name === channelName) {
                return channel.count;
            }
        }

        return null; // Если канал не найден
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        return null;
    }
}
