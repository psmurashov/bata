        document.getElementById('saveButtonExcel').addEventListener('click', function() {
            const outputField = document.getElementById('outputField');
            const text = outputField.value;

            // Создание рабочей книги и листа
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(text.split('\n').map(line => [line]));

            // Добавление листа в рабочую книгу
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

            // Сохранение рабочей книги в файл
            XLSX.writeFile(wb, 'result.xlsx');
        });