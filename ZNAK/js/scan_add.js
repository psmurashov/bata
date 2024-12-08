        async function checkDataMatrix(dataCodes) {
            const resultsList = document.getElementById('resultsList');
            resultsList.innerHTML = ''; // Очистка предыдущих результатов

            for (let index = 0; index < dataCodes.length; index++) {
                const code = dataCodes[index];
                const baseUrl = "https://mobile.api.crpt.ru/mobile/check";
                const encodedCode = encodeURIComponent(code);
                const url = `${baseUrl}?code=${encodedCode}&codeType=datamatrix`;

                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Ошибка при запросе');
                    }
                    const data = await response.json();
                    const infoMsg = [data.code || 'Неизвестный код'];

                    if (data.codeFounded) {
                        const status = data.tiresData?.status || 'Неизвестный статус';
                        const statusMessages = {
                            'INTRODUCED': 'В обороте ✅',
                            'RETIRED': 'Выбыл из оборота ❌',
                            'EMITTED': 'Эмитирован, выпущен ✔️',
                            'APPLIED': 'Эмитирован, получен 🔗',
                            'WRITTEN_OFF': 'КИ списан 🟥',
                            'DISAGGREGATION': 'Расформирован (только для упаковок) 📦🟥'
                        };
                        infoMsg.push(statusMessages[status] || `Неизвестный статус кода ⚠️ [${status}]`);
                        const productName = data.productName || 'Неизвестный продукт';
                        infoMsg.push(`<b>[${productName}]</b>`);
                    } else {
                        infoMsg.push('Код не найден ❗');
                    }

                    const resultItem = document.createElement('li');
                    resultItem.innerHTML = `${infoMsg.join('<br>')}`;
                    resultsList.appendChild(resultItem);
                } catch (error) {
                    const resultItem = document.createElement('li');
                    resultItem.innerHTML = `${index + 1}/${dataCodes.length}<br>Ошибка при запросе: ${error.message}`;
                    resultsList.appendChild(resultItem);
                }
            }
        }

        document.getElementById('inputField').addEventListener('input', async function() {
            const inputValue = this.value;

            //Оставляем первые 31 симовл
            let _31_inputValue = inputValue.substring(0, 31);

            const dataCodes = _31_inputValue.split('\n');
            await checkDataMatrix(dataCodes);

            const outputField = document.getElementById('outputField');
            // Добавляем новый текст к текущему содержимому textarea
            outputField.value += dataCodes.join('\n') + '\n';

            // Очистка поля ввода
            this.value = '';
        });