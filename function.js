// function.js - Version avec gestion d'erreurs

async function compressAndResizeImage(url, maxWidth = 150, quality = 0.7) {
    if (!url) return null;
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const ratio = img.width / img.height;
            const newWidth = Math.min(img.width, maxWidth);
            const newHeight = newWidth / ratio;
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        // Si l'image ne se charge pas (erreur CORS, lien cassé...), on continue sans logo
        img.onerror = () => {
            console.error("Erreur de chargement de l'image : " + url);
            resolve(null);
        };
    });
}

// Fonction de chargement de script améliorée
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

// === FONCTION PRINCIPALE ===
async function generatePdf(logoUrl, docTitle, bodyHtml) {
    try {
        // 1. Chargement des librairies
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 2. Traitement du logo
        if (logoUrl && logoUrl.value) {
            const logoBase64 = await compressAndResizeImage(logoUrl.value);
            if (logoBase64) {
                const logoWidth = 40;
                const logoHeight = 15;
                const logoX = pageWidth - logoWidth - 15;
                doc.addImage(logoBase64, 'JPEG', logoX, 15, logoWidth, logoHeight);
            }
        }

        // 3. Ajout du titre
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text(docTitle.value || "Titre par défaut", 15, 25);

        // 4. Conversion du HTML en PDF
        const htmlContainer = document.createElement('div');
        htmlContainer.style.width = '180mm'; // Largeur A4 moins les marges
        htmlContainer.innerHTML = bodyHtml.value || "<p>Aucun contenu HTML fourni.</p>";
        
        // C'est l'étape la plus susceptible d'échouer.
        await doc.html(htmlContainer, {
            x: 10,
            y: 50, // Espace pour l'en-tête
            // Laisser jsPDF gérer la suite
        });

        // 5. Retourner le PDF généré
        return doc.output('datauristring');

    } catch (error) {
        // Si une erreur se produit à n'importe quelle étape, on la retourne comme résultat.
        console.error("Erreur lors de la génération du PDF:", error);
        return `ERREUR : ${error.message}`;
    }
}

window.function = generatePdf;
