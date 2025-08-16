// function.js - Version finale avec pdf-lib

// La fonction pour charger les images reste la même
async function fetchAndCompressImage(url, maxWidth = 150, quality = 0.7) {
    if (!url) return null;
    return new Promise(async (resolve) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();

            const imageBitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const ratio = imageBitmap.width / imageBitmap.height;
            const newWidth = Math.min(imageBitmap.width, maxWidth);
            const newHeight = newWidth / ratio;

            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

            // Retourne les bytes de l'image JPEG
            canvas.toBlob(resolve, 'image/jpeg', quality);
        } catch (error) {
            console.error("Erreur de chargement de l'image:", error);
            resolve(null);
        }
    });
}


// Fonction de chargement de script
function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (self[url]) { // Vérifie si le script est déjà chargé
            return resolve();
        }
        importScripts(url);
        self[url] = true;
        resolve();
    });
}

// === FONCTION PRINCIPALE avec pdf-lib ===
async function generatePdf(logoUrl, docTitle, bodyText) {
    try {
        // 1. Chargement de la librairie pdf-lib
        await loadScript("https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js");
        const { PDFDocument, rgb, StandardFonts } = PDFLib;

        // 2. Création d'un document PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let y = height - 50;

        // 3. Traitement du logo
        if (logoUrl && logoUrl.value) {
            const imageBlob = await fetchAndCompressImage(logoUrl.value);
            if (imageBlob) {
                const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
                const pdfImage = await pdfDoc.embedJpg(imageBytes);
                const imageDims = pdfImage.scale(0.25); // Réduit la taille de l'image de 75%
                page.drawImage(pdfImage, {
                    x: width - imageDims.width - 50,
                    y: height - imageDims.height - 40,
                    width: imageDims.width,
                    height: imageDims.height,
                });
            }
        }
        
        // 4. Ajout du titre
        page.drawText(docTitle.value || 'Titre par défaut', {
            x: 50,
            y: y,
            font: boldFont,
            size: 24,
            color: rgb(0, 0, 0),
        });
        y -= 50; // Déplace le curseur vers le bas

        // 5. Ajout du corps du texte
        const text = bodyText.value || 'Aucun contenu fourni.';
        page.drawText(text, {
            x: 50,
            y: y,
            font: font,
            size: 12,
            lineHeight: 18,
            maxWidth: width - 100, // Marges de 50px de chaque côté
            color: rgb(0.1, 0.1, 0.1),
        });

        // 6. Finalisation du PDF et conversion
        const pdfBytes = await pdfDoc.save();
        
        // Conversion des bytes en chaîne Base64 que Glide peut lire
        let binary = '';
        const len = pdfBytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(pdfBytes[i]);
        }
        const base64String = self.btoa(binary);

        return 'data:application/pdf;base64,' + base64String;

    } catch (error) {
        console.error("Erreur lors de la génération du PDF:", error);
        return `ERREUR : ${error.message}`;
    }
}

// L'assignation de la fonction change légèrement dans ce contexte
self.function = generatePdf;
