const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFNet } = require('@pdftron/pdfnet-node');
const { exec } = require('child_process');
const archiver = require('archiver');


const fileStorage = {};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/')
    },
    filename: function (req, file, cb) {
        // Usamos la fecha y hora actual para generar un nombre único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); // conservamos la extensión original del archivo
        cb(null, uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');

const app = express();
// Middleware para imprimir y capturar el primer segmento de la URL
// Middleware para establecer basePath




app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));

});
app.get('/en', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/en', 'index.html'));
});
app.get('/Hi', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Hi', 'index.html'));
});




// Ruta para servir la página de conversión de Excel a PDF
app.get('/Excelapdf', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ExcelaPdf.html'));
});
app.get('/PoweaPdf', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'PoweraPdf.html'));
});
app.get('/JpgaPdf', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'JpgaPdf.html'));
});

app.post('/upload', upload.array('files', 30), (req, res) => {
    if (req.files && req.files.length > 0) {
        const fileNames = req.files.map(file => file.filename);
        const uniqueId = Date.now();
        const combinedFilename = `${uniqueId}-combined.pdf`;
        const redirectUrl = `/pantallacarga.html?files=${encodeURIComponent(fileNames.join(','))}&combinedFile=${encodeURIComponent(combinedFilename)}`;

        res.redirect(redirectUrl);

        const inputPaths = req.files.map(file => path.resolve(__dirname, `upload/${file.filename}`));
        const outputPath = path.resolve(__dirname, `upload/${combinedFilename}`);

        const combineImagesToPDF = async () => {
            const pdfdoc = await PDFNet.PDFDoc.create();
            await pdfdoc.initSecurityHandler();

            for (const inputPath of inputPaths) {
                await PDFNet.Convert.toPdf(pdfdoc, inputPath);
            }

            await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
            return outputPath;
        };

        PDFNet.runWithCleanup(combineImagesToPDF).then(outputPath => {
            fileStorage[combinedFilename] = outputPath;
        }).catch(err => {
            console.error(err);
        });
    } else {
        res.status(500).send('File upload failed');
    }
});

app.post('/Enupload', upload.array('files', 30), (req, res) => {
    if (req.files && req.files.length > 0) {
        const fileNames = req.files.map(file => file.filename);
        const uniqueId = Date.now();
        const combinedFilename = `${uniqueId}-combined.pdf`;
        const redirectUrl = `/en/pantallacargaen.html?files=${encodeURIComponent(fileNames.join(','))}&combinedFile=${encodeURIComponent(combinedFilename)}`;
        res.redirect(redirectUrl);

        const inputPaths = req.files.map(file => path.resolve(__dirname, `upload/${file.filename}`));
        const outputPath = path.resolve(__dirname, `upload/${combinedFilename}`);

        const combineImagesToPDF = async () => {
            const pdfdoc = await PDFNet.PDFDoc.create();
            await pdfdoc.initSecurityHandler();

            for (const inputPath of inputPaths) {
                await PDFNet.Convert.toPdf(pdfdoc, inputPath);
            }

            await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
            return outputPath;
        };

        PDFNet.runWithCleanup(combineImagesToPDF).then(outputPath => {
            fileStorage[combinedFilename] = outputPath;
        }).catch(err => {
            console.error(err);
        });
    } else {
        res.status(500).send('File upload failed');
    }
});
app.post('/Hiupload', upload.array('files', 30), (req, res) => {
    if (req.files && req.files.length > 0) {
        const fileNames = req.files.map(file => file.filename);
        const uniqueId = Date.now();
        const combinedFilename = `${uniqueId}-combined.pdf`;
        const redirectUrl = `/Hi/pantallacargaHi.html?files=${encodeURIComponent(fileNames.join(','))}&combinedFile=${encodeURIComponent(combinedFilename)}`;
        res.redirect(redirectUrl);

        const inputPaths = req.files.map(file => path.resolve(__dirname, `upload/${file.filename}`));
        const outputPath = path.resolve(__dirname, `upload/${combinedFilename}`);

        const combineImagesToPDF = async () => {
            const pdfdoc = await PDFNet.PDFDoc.create();
            await pdfdoc.initSecurityHandler();

            for (const inputPath of inputPaths) {
                await PDFNet.Convert.toPdf(pdfdoc, inputPath);
            }

            await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
            return outputPath;
        };

        PDFNet.runWithCleanup(combineImagesToPDF).then(outputPath => {
            fileStorage[combinedFilename] = outputPath;
        }).catch(err => {
            console.error(err);
        });
    } else {
        res.status(500).send('File upload failed');
    }
});
app.post('/descarga', upload.single('file'), (req, res) => {
    if (req.file) {
        // Almacena el archivo y luego redirige al cliente para procesar la conversión
        res.redirect(`/pantallacarga.html?file=${encodeURIComponent(req.file.filename)}`);
    } else {
        res.status(500).send('File upload failed');
    }
});
app.get('/check-status', (req, res) => {
    const filename = req.query.file;
    if (!filename) {
        return res.status(400).send('Filename is required');
    }
    if (fileStorage[filename] && fs.existsSync(fileStorage[filename])) {
        res.json({ status: 'ready' });
    } else {
        res.json({ status: 'processing' });
    }
});

app.get('/download-file', (req, res) => {
    const filename = req.query.file;
    const outputPath = fileStorage[filename];
    if (outputPath && fs.existsSync(outputPath)) {
        res.download(outputPath);
    } else {
        res.status(404).send('File not found');
    }
});



app.post('/uploadPdfToWord', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/pantallacarga.html?file=${encodeURIComponent(req.file.filename)}`);

        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.docx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toWord(pdfDoc, outputPath);
                fileStorage[req.file.filename] = outputPath;


            });
            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior

        } catch (err) {
            console.error('Error during PDF to Word conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});
app.post('/uploadPdfToExcel', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/pantallacarga.html?file=${encodeURIComponent(req.file.filename)}`);

        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.xlsx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                await PDFNet.Convert.toExcel(pdfDoc, outputPath);
            });

            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior
        } catch (err) {
            console.error('Error during PDF to Excel conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});


app.post('/uploadPdfToPowerPoint', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/pantallacarga.html?file=${encodeURIComponent(req.file.filename)}`);
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.pptx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toPowerPoint(pdfDoc, outputPath);

            });

            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior
        } catch (err) {
            console.error('Error during PDF to Excel conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});
app.post('/uploadPdfToJpg', upload.single('file'), async (req, res) => {
    if (req.file) {
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputFolder = path.resolve(__dirname, `upload/${req.file.filename}_jpgs`);
        fs.mkdirSync(outputFolder, { recursive: true });

        try {
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();

                const pdfDraw = await PDFNet.PDFDraw.create(100); // 100 is the DPI (dots per inch)
                const pageCount = await pdfDoc.getPageCount();

                for (let i = 1; i <= pageCount; ++i) {
                    const page = await pdfDoc.getPage(i);
                    const outputPath = path.join(outputFolder, `page_${i}.jpg`);
                    await pdfDraw.export(page, outputPath, 'JPEG');
                }
            });

            // Creating a zip file
            const zipPath = path.resolve(__dirname, `upload/${req.file.filename}.zip`);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);
            archive.directory(outputFolder, false);
            await archive.finalize();

            output.on('close', () => {
                // Almacena la ruta del archivo en fileStorage
                fileStorage[req.file.filename] = zipPath;

                // Redirección con la ruta del archivo como parámetro
                res.redirect(`/pantallacarga.html?file=${encodeURIComponent(req.file.filename)}`);
            });

        } catch (err) {
            console.error('Error during PDF to JPG conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});

// Ruta para convertir con PDFTron
app.get('/Word-a-Pdf', (req, res) => {
    const filename = decodeURIComponent(req.query.filename);
    const inputPath = path.resolve(__dirname, `upload/${filename}`);
    const outputPath = path.resolve(__dirname, `upload/${filename}.pdf`);

    fs.access(inputPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        const convertToPDF = async () => {
            const pdfdoc = await PDFNet.PDFDoc.create();
            await pdfdoc.initSecurityHandler();
            await PDFNet.Convert.toPdf(pdfdoc, inputPath);
            await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
            return outputPath;
        };

        PDFNet.runWithCleanup(convertToPDF).then(outputPath => {
            fs.readFile(outputPath, (err, data) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.end(data);
                }
            });
        }).catch(err => {
            res.status(500).json({ error: err.message });
        });
    });
});

app.post('/EnuploadPdfToWord', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/en/pantallacargaen.html?file=${encodeURIComponent(req.file.filename)}`);

        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.docx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toWord(pdfDoc, outputPath);
                fileStorage[req.file.filename] = outputPath;


            });
            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior

        } catch (err) {
            console.error('Error during PDF to Word conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});
app.post('/EnuploadPdfToExcel', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/en/pantallacargaen.html?file=${encodeURIComponent(req.file.filename)}`);

        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.xlsx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                await PDFNet.Convert.toExcel(pdfDoc, outputPath);
            });

            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior
        } catch (err) {
            console.error('Error during PDF to Excel conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});


app.post('/EnuploadPdfToPowerPoint', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/en/pantallacargaen.html?file=${encodeURIComponent(req.file.filename)}`);
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.pptx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toPowerPoint(pdfDoc, outputPath);

            });

            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior
        } catch (err) {
            console.error('Error during PDF to Excel conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});
app.post('/EnuploadPdfToJpg', upload.single('file'), async (req, res) => {
    if (req.file) {
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputFolder = path.resolve(__dirname, `upload/${req.file.filename}_jpgs`);
        fs.mkdirSync(outputFolder, { recursive: true });

        try {
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();

                const pdfDraw = await PDFNet.PDFDraw.create(100); // 100 is the DPI (dots per inch)
                const pageCount = await pdfDoc.getPageCount();

                for (let i = 1; i <= pageCount; ++i) {
                    const page = await pdfDoc.getPage(i);
                    const outputPath = path.join(outputFolder, `page_${i}.jpg`);
                    await pdfDraw.export(page, outputPath, 'JPEG');
                }
            });

            // Creating a zip file
            const zipPath = path.resolve(__dirname, `upload/${req.file.filename}.zip`);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);
            archive.directory(outputFolder, false);
            await archive.finalize();

            output.on('close', () => {
                // Almacena la ruta del archivo en fileStorage
                fileStorage[req.file.filename] = zipPath;

                // Redirección con la ruta del archivo como parámetro
                res.redirect(`/en/pantallacargaen.html?file=${encodeURIComponent(req.file.filename)}`);
            });

        } catch (err) {
            console.error('Error during PDF to JPG conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});

app.post('/HiuploadPdfToWord', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/Hi/pantallacargaHi.html?file=${encodeURIComponent(req.file.filename)}`);

        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.docx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toWord(pdfDoc, outputPath);
                fileStorage[req.file.filename] = outputPath;


            });
            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior

        } catch (err) {
            console.error('Error during PDF to Word conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});
app.post('/HiuploadPdfToExcel', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/Hi/pantallacargaHi.html?file=${encodeURIComponent(req.file.filename)}`);

        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.xlsx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                await PDFNet.Convert.toExcel(pdfDoc, outputPath);
            });

            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior
        } catch (err) {
            console.error('Error during PDF to Excel conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});


app.post('/HiuploadPdfToPowerPoint', upload.single('file'), async (req, res) => {
    if (req.file) {
        res.redirect(`/Hi/pantallacargaHi.html?file=${encodeURIComponent(req.file.filename)}`);
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.pptx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toPowerPoint(pdfDoc, outputPath);

            });

            fileStorage[req.file.filename] = outputPath; // Guardar la ruta para acceso posterior
        } catch (err) {
            console.error('Error during PDF to Excel conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});
app.post('/HiuploadPdfToJpg', upload.single('file'), async (req, res) => {
    if (req.file) {
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputFolder = path.resolve(__dirname, `upload/${req.file.filename}_jpgs`);
        fs.mkdirSync(outputFolder, { recursive: true });

        try {
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();

                const pdfDraw = await PDFNet.PDFDraw.create(100); // 100 is the DPI (dots per inch)
                const pageCount = await pdfDoc.getPageCount();

                for (let i = 1; i <= pageCount; ++i) {
                    const page = await pdfDoc.getPage(i);
                    const outputPath = path.join(outputFolder, `page_${i}.jpg`);
                    await pdfDraw.export(page, outputPath, 'JPEG');
                }
            });

            // Creating a zip file
            const zipPath = path.resolve(__dirname, `upload/${req.file.filename}.zip`);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);
            archive.directory(outputFolder, false);
            await archive.finalize();

            output.on('close', () => {
                // Almacena la ruta del archivo en fileStorage
                fileStorage[req.file.filename] = zipPath;

                // Redirección con la ruta del archivo como parámetro
        res.redirect(`/Hi/pantallacargaHi.html?file=${encodeURIComponent(req.file.filename)}`);
            });

        } catch (err) {
            console.error('Error during PDF to JPG conversion:', err);
            res.status(500).send('Conversion failed with error: ' + err.message);
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});


app.listen(5000, () => {
    console.log('Listening on port 5000');
});
