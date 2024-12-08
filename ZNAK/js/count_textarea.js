const textarea = document.getElementById('outputField');
const lineCount = document.getElementById('lineCount');

// Функция для обновления счетчика строк
function updateLineCount() {
  const lines = textarea.value.split('\n').length;
  lineCount.textContent = lines;
}

// Инициализация счетчика строк при загрузке страницы
updateLineCount();

// Наблюдатель за изменениями в textarea
const observer = new MutationObserver(updateLineCount);

// Настройка наблюдателя для отслеживания изменений в содержимом textarea
observer.observe(textarea, {
  characterData: true,
  subtree: true,
  childList: true
});

// Дополнительное обновление счетчика при вводе пользователем
textarea.addEventListener('input', updateLineCount);