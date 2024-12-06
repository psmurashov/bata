        function generateDataMatrix(code) {
            return new Promise((resolve, reject) => {
                // Create a canvas element
                const canvas = document.createElement('canvas');

                // Generate the barcode
                bwipjs.toCanvas(canvas, {
                    bcid: 'datamatrix',       // Barcode type
                    text: code,               // Text to encode
                    scale: 5,                 // 3x scaling factor
                    height: 15,               // Bar height, in millimeters
                    includetext: true,         // Show human-readable text when readable
                    textxalign: 'center',      // Always good to set this
                }, function (err) {
                    if (err) {
                        reject('Error: ' + err);
                    } else {
                        resolve(canvas);
                    }
                });
            });
        }