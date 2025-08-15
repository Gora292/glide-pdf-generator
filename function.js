// function.js
async function generatePdf(logoBase64, docTitle, bodyText) {
  // On s'assure que les librairies sont chargées
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;

  // On vérifie qu'on a bien les données nécessaires
  if (!docTitle || !docTitle.value) return "Titre manquant";

  const doc = new jsPDF();

  // 1. Ajout du logo (s'il est fourni)
  if (logoBase64 && logoBase64.value) {
    doc.addImage(logoBase64.value, 'PNG', 15, 15, 40, 15); // x, y, largeur, hauteur
  }

  // 2. Ajout du titre
  doc.setFontSize(22);
  doc.text(docTitle.value, 20, 50);

  // 3. Ajout du texte du corps
  doc.setFontSize(12);
  const splitBody = doc.splitTextToSize(bodyText.value ?? "", 170); // 170mm de largeur max
  doc.text(splitBody, 20, 65);

  // 4. On retourne le PDF sous forme de chaîne de caractères que Glide peut lire
  return doc.output('datauristring');
}

// Fonction utilitaire pour charger un script externe
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
