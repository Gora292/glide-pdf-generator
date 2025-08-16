// function.js

/**
 * Charge une image depuis une URL, la redimensionne, la compresse et la retourne en Base64.
 * @param {string} url L'URL de l'image.
 * @returns {Promise<string|null>}
 */
function compressAndResizeImage(url, maxWidth = 150, quality = 0.7) {
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
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => resolve(null);
  });
}

async function generatePdf(logoUrl, docTitle, bodyHtml) {
  // On charge jsPDF et son plugin HTML
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- EN-TÊTE ---
  // 1. Ajout du logo (compressé) à DROITE
  if (logoUrl && logoUrl.value) {
    const logoBase64 = await compressAndResizeImage(logoUrl.value);
    if (logoBase64) {
      const logoWidth = 40;
      const logoHeight = 15;
      const logoX = pageWidth - logoWidth - 15;
      doc.addImage(logoBase64, 'JPEG', logoX, 15, logoWidth, logoHeight);
    }
  }

  // 2. Ajout du titre
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(docTitle.value || "FACTURE", 15, 25);

  // --- CORPS DU DOCUMENT (HTML) ---
  // On utilise la méthode .html() de jsPDF pour interpréter le contenu HTML
  // On doit créer un élément temporaire pour que html2canvas puisse le lire
  const htmlContainer = document.createElement('div');
  htmlContainer.style.width = '180mm'; // Largeur A4 moins les marges
  htmlContainer.style.padding = '10px';
  htmlContainer.innerHTML = bodyHtml.value ?? "Aucun contenu fourni.";

  // La magie opère ici : jsPDF utilise html2canvas pour "capturer" le HTML
  // et le dessiner sur le document PDF.
  await doc.html(htmlContainer, {
    x: 10,
    y: 50, // On laisse de l'espace pour l'en-tête
    callback: function (doc) {
      // Le PDF est prêt, mais la fonction doit retourner la data string.
      // Nous allons donc la retourner en dehors du callback.
    }
  });

  // Retourne le PDF sous forme de chaîne de caractères
  return doc.output('datauristring');
}


// Fonction utilitaire pour charger un script externe
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      return resolve(); // Le script est déjà chargé
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

window.function = generatePdf;
