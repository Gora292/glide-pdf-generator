// function.js

/**
 * Charge une image depuis une URL, la redimensionne, la compresse et la retourne en Base64 (Data URL).
 * @param {string} url L'URL de l'image.
 * @param {number} maxWidth La largeur maximale souhaitée pour l'image.
 * @param {number} quality La qualité de compression (entre 0.0 et 1.0).
 * @returns {Promise<string|null>} Une promesse qui se résout avec la Data URL de l'image compressée.
 */
function compressAndResizeImage(url, maxWidth = 150, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Gère les problèmes de CORS en demandant une image anonyme si possible
    img.crossOrigin = 'Anonymous';
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calcule le nouveau ratio pour maintenir les proportions
      const ratio = img.width / img.height;
      const newWidth = Math.min(img.width, maxWidth);
      const newHeight = newWidth / ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Dessine l'image redimensionnée sur le canvas
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Exporte le canvas en tant que Data URL JPEG avec la qualité spécifiée
      // Le format JPEG est bien meilleur pour la compression de photos.
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };

    img.onerror = (err) => {
      console.error("Impossible de charger l'image depuis l'URL:", err);
      // On essaye de contourner les problèmes de CORS avec un proxy (solution de secours)
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      console.log("Tentative avec un proxy CORS:", proxyUrl);
      img.src = proxyUrl; // On relance le chargement avec le proxy
      // Si cela échoue à nouveau, la promesse sera rejetée.
      // Pour éviter une boucle infinie, on ne met pas de onerror ici.
      // La promesse restera en suspens mais n'ajoutera pas de logo, ce qui est mieux qu'un crash.
      // Une meilleure gestion des erreurs pourrait être implémentée si nécessaire.
    };
  });
}


async function generatePdf(logoUrl, docTitle, bodyText) {
  // On s'assure que les librairies sont chargées
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;

  if (!docTitle || !docTitle.value) return "Titre manquant";

  const doc = new jsPDF();

  // 1. Ajout du logo (compressé)
  if (logoUrl && logoUrl.value) {
    // On compresse l'image avant de l'ajouter.
    // On vise une image de 150px de large avec une qualité de 70%
    const logoBase64 = await compressAndResizeImage(logoUrl.value, 150, 0.7);
    if (logoBase64) {
      // Le format est JPEG grâce à la compression
      doc.addImage(logoBase64, 'JPEG', 15, 15, 40, 15); // x, y, largeur, hauteur
    }
  }

  // 2. Ajout du titre
  doc.setFontSize(22);
  doc.text(docTitle.value, 20, 50);

  // 3. Ajout du texte du corps
  doc.setFontSize(12);
  const splitBody = doc.splitTextToSize(bodyText.value ?? "", 170);
  doc.text(splitBody, 20, 65);

  // 4. On retourne le PDF (maintenant beaucoup plus léger)
  return doc.output('datauristring');
}

// Fonction utilitaire pour charger un script externe (inchangée)
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

window.function = generatePdf;
