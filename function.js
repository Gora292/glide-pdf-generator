// function.js - Version de test minimaliste

// Fonction pour charger dynamiquement un script externe
function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Impossible de charger le script : ${url}`));
        document.head.appendChild(script);
    });
}

// === FONCTION DE TEST PRINCIPALE ===
async function generatePdf(logoUrl, docTitle, bodyText) {
    try {
        // 1. Chargement de la librairie pdf-lib
        await loadScript("https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js");
        const { PDFDocument, rgb, StandardFonts } = PDFLib;

        // 2. Création d'un document PDF simple
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // 3. Ajout d'une seule ligne de texte pour le test
        page.drawText('Ce PDF a ete genere avec succes !', {
            x: 50,
            y: height / 2, // Au milieu de la page
            font: font,
            size: 24,
            color: rgb(0, 0.53, 0.71),
        });

        // 4. Finalisation et conversion
        const pdfBytes = await pdfDoc.save();
        const base64String = btoa(String.fromCharCode.apply(null, pdfBytes));

        return 'data:application/pdf;base64,' + base64String;

    } catch (error) {
        console.error("Erreur PENDANT LE TEST:", error);
        return `ERREUR DE TEST : ${error.message}`;
    }
}

window.function = generatePdf;
