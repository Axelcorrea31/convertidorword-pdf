const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFNet } = require('@pdftron/pdfnet-node');
const { exec } = require('child_process');
const archiver = require('archiver');


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
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename}.pdf`);

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
                    res.attachment(outputPath); // Esto fuerza la descarga del PDF generado
                    res.end(data);
                }
            });
        }).catch(err => {
            res.status(500).json({ error: err.message });
        });
    } else {
        res.status(500).send('File upload failed');
    }
});

app.post('/uploadPdfToWord', upload.single('file'), async (req, res) => {
    if (req.file) {
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.docx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toWord(pdfDoc, outputPath);

            });

            // Send the converted Word document to the client
            res.download(outputPath, (err) => {
                if (err) {
                    console.error('Error sending the file:', err);
                    res.status(500).send('Failed to download the file.');
                }
            });
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
        const inputPath = path.resolve(__dirname, `upload/${req.file.filename}`);
        const outputPath = path.resolve(__dirname, `upload/${req.file.filename.replace('.pdf', '.xlsx')}`);

        try {
            PDFNet.addResourceSearchPath("C:/Users/hp/Downloads/StructuredOutputWindows/Lib/Windows/");
            await PDFNet.initialize('demo:1720915327177:7f996ec203000000002c8073caa3bbe129d4ea16116d9048eb43e60f79');
            await PDFNet.runWithCleanup(async () => {
                const pdfDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
                await pdfDoc.initSecurityHandler();
                const result = await PDFNet.Convert.toExcel(pdfDoc, outputPath);

            });

            // Send the converted Word document to the client
            res.download(outputPath, (err) => {
                if (err) {
                    console.error('Error sending the file:', err);
                    res.status(500).send('Failed to download the file.');
                }
            });
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

            // Send the converted Word document to the client
            res.download(outputPath, (err) => {
                if (err) {
                    console.error('Error sending the file:', err);
                    res.status(500).send('Failed to download the file.');
                }
            });
        } catch (err) {
            console.error('Error during PDF to Excel conversion:', err);
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
                res.download(zipPath, (err) => {
                    if (err) {
                        console.error('Error sending the ZIP file:', err);
                        res.status(500).send('Failed to download the ZIP file.');
                    }
                });
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
