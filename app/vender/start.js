 //Проверка приборов
        function checkUserAgent() {
            const userAgent = navigator.userAgent.toLowerCase();
            const isAndroid = userAgent.includes('android');
            const isLampaClient = userAgent.includes('lampa_client');

            if (isAndroid && isLampaClient) {

                putScript('app.min.js?v=' + Math.random());

            } else {
                // Создаем черный фон с текстом "ведутся работы"
                document.body.style.backgroundColor = 'black';
                document.body.style.color = 'white';
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
                document.body.style.margin = '0';
                document.body.style.fontFamily = 'Arial, sans-serif';
                document.body.style.fontSize = '24px';
                document.body.innerHTML = '<div>ведутся работы</div>';
            }
        }

        // Вызываем функцию проверки при загрузке страницы
        checkUserAgent();