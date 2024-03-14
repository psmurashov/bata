// Функция для создания файла m3u
function createM3UFile(data, filename) {
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

// Пример данных для файла m3u
const m3uData = [
  '#EXTM3U\n',
  '#EXTINF:-1 tvg-logo="https://raw.githubusercontent.com/psmurashov/plugin/main/img/sci-fi.png" group-title="Кино и сериалы",.sci-fi\n',
  'http://185.37.150.40:8092/Axn_skyfi/tracks-v1a1/mono.m3u8\n',

  '#EXTINF:-1 tvg-logo="https://raw.githubusercontent.com/psmurashov/plugin/main/img/viju_pem.png" group-title="Кино и сериалы",VIJU+ PREMIERE HD\n',
  'http://188.113.190.15/201/tracks-v1a1/index.m3u8\n',
];

// Имя файла для скачивания
const filename = 'mur.m3u';

// Создание файла m3u и предоставление ссылки для скачивания
createM3UFile(m3uData, filename);