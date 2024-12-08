/*
 Очистка поля
*/
        function clearTextarea(id) {
            document.getElementById(id).value = '';
            updateLineCount();//count_textarea.js обновляем счетчик
        }