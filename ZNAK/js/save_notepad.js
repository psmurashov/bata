        document.getElementById('saveButtonNotepad').addEventListener('click', function() {
            const outputField = document.getElementById('outputField');
            const text = outputField.value;

            // Создание Blob объекта из текста
            const blob = new Blob([text], { type: 'text/plain' });

            // Создание ссылки для скачивания
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'result.txt';

            // Добавление ссылки в документ и имитация клика
            document.body.appendChild(link);
            link.click();

            // Удаление ссылки из документа
            document.body.removeChild(link);
        });