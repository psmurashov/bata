/*Drag and Drop*/

        const dataCodes = document.getElementById('dataCodes');

        dataCodes.addEventListener('dragover', (e) => {
            e.preventDefault();
            dataCodes.style.borderColor = '#000';
        });

        dataCodes.addEventListener('dragleave', () => {
            dataCodes.style.borderColor = '#ccc';
        });

        dataCodes.addEventListener('drop', (e) => {
            e.preventDefault();
            dataCodes.style.borderColor = '#ccc';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                const reader = new FileReader();

                reader.onload = (event) => {
                    const content = event.target.result;
                    dataCodes.value = content;
                };

                if (file.type === 'text/plain') {
                    reader.readAsText(file);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                           file.type === 'application/vnd.ms-excel') {
                    reader.readAsArrayBuffer(file);
                    reader.onload = (event) => {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const sheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                        const text = json.map(row => row.join('\t')).join('\n');
                        dataCodes.value = text;
                    };
                } else {
                    alert('Неподдерживаемый тип файла');
                }
            }
        });
