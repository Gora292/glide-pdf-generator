// function.js - Générateur de Facture Professionnelle

function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Script load error for ${url}`));
        document.head.appendChild(script);
    });
}

async function fetchImageBytes(url) {
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return new Uint8Array(await response.arrayBuffer());
    } catch (e) {
        console.error("Image fetch error:", e);
        return null;
    }
}

async function generatePdf(logoUrl, companyInfo, customerInfo, invoiceNumber, invoiceDate, itemsJson, notes) {
    try {
        await loadScript("https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js");
        const { PDFDocument, rgb, StandardFonts } = PDFLib;

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // --- DESSIN DU PDF ---
        let y = height - 50;

        // 1. Logo
        const imageBytes = await fetchImageBytes(logoUrl.value);
        if (imageBytes) {
            const isJpg = logoUrl.value.toLowerCase().match(/\.jpe?g$/);
            const pdfImage = isJpg ? await pdfDoc.embedJpg(imageBytes) : await pdfDoc.embedPng(imageBytes);
            const imgDims = pdfImage.scale(0.35);
            page.drawImage(pdfImage, {
                x: width - imgDims.width - 50,
                y: height - imgDims.height - 40,
                width: imgDims.width,
                height: imgDims.height,
            });
        }
        
        // 2. Titre "FACTURE"
        page.drawText('FACTURE', { x: 50, y: y, font: boldFont, size: 32 });
        y -= 50;

        // 3. Infos Entreprise et Client
        page.drawText(companyInfo.value || '', { x: 50, y: y, font: font, size: 10, lineHeight: 14 });
        page.drawText(customerInfo.value || '', { x: 350, y: y, font: boldFont, size: 10, lineHeight: 14 });
        y -= 60;

        // 4. Numéro et Date
        page.drawText(`Facture #: ${invoiceNumber.value || ''}`, { x: 50, y: y, font: font, size: 12 });
        page.drawText(`Date: ${invoiceDate.value || ''}`, { x: width - 200, y: y, font: font, size: 12, });
        y -= 40;

        // 5. Tableau des produits
        const tableTop = y;
        const xDesc = 50;
        const xQty = 350;
        const xRate = 420;
        const xAmount = 500;
        let subtotal = 0;

        // En-têtes du tableau
        page.drawText('Description', { x: xDesc, y: y, font: boldFont, size: 10 });
        page.drawText('Qté', { x: xQty, y: y, font: boldFont, size: 10 });
        page.drawText('Prix Unit.', { x: xRate, y: y, font: boldFont, size: 10 });
        page.drawText('Montant', { x: xAmount, y: y, font: boldFont, size: 10 });
        y -= 20;

        const items = JSON.parse(itemsJson.value || '[]');
        items.forEach(item => {
            const amount = item.qty * item.rate;
            subtotal += amount;
            page.drawText(item.desc, { x: xDesc, y: y, font: font, size: 10 });
            page.drawText(String(item.qty), { x: xQty, y: y, font: font, size: 10 });
            page.drawText(`${item.rate.toFixed(2)} €`, { x: xRate, y: y, font: font, size: 10 });
            page.drawText(`${amount.toFixed(2)} €`, { x: xAmount, y: y, font: font, size: 10 });
            y -= 20;
        });

        // Ligne de séparation
        page.drawLine({ start: { x: 50, y: y + 10 }, end: { x: width - 50, y: y + 10 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        y -= 10;
        
        // 6. Total
        page.drawText(`Total:`, { x: xRate, y: y, font: boldFont, size: 12 });
        page.drawText(`${subtotal.toFixed(2)} €`, { x: xAmount, y: y, font: boldFont, size: 12 });
        y -= 50;
        
        // 7. Notes
        page.drawText(notes.value || '', { x: 50, y: y, font: font, size: 10, lineHeight: 14 });

        // --- FINALISATION ---
        const pdfBytes = await pdfDoc.save();
        return 'data:application/pdf;base64,' + btoa(String.fromCharCode.apply(null, pdfBytes));

    } catch (e) {
        console.error("PDF Generation Error:", e);
        return `ERREUR : ${e.message}`;
    }
}

window.function = generatePdf;
