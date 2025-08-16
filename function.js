// function.js
async function compressAndResizeImage(url, maxWidth = 150, quality = 0.7) {
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
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logoUrl && logoUrl.value) {
    const logoBase64 = await compressAndResizeImage(logoUrl.value);
    if (logoBase64) {
      const logoWidth = 40;
      const logoHeight = 15;
      const logoX = pageWidth - logoWidth - 15;
      doc.addImage(logoBase64, 'JPEG', logoX, 15, logoWidth, logoHeight);
    }
  }

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(docTitle.value || "FACTURE", 15, 25);

  const htmlContainer = document.createElement('div');
  htmlContainer.style.width = '180mm';
  htmlContainer.style.padding = '10px';
  htmlContainer.innerHTML = bodyHtml.value ?? "Aucun contenu fourni.";

  await doc.html(htmlContainer, {
    x: 10,
    y: 50,
    callback: function (doc) {}
  });

  return doc.output('datauristring');
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

window.function = generatePdf;
