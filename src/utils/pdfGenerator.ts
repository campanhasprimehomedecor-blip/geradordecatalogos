import { jsPDF } from "jspdf";
import { Product, CatalogConfig } from "../types";

/**
 * Helper function to safely fetch and convert any image URL to a Base64 data URL.
 * Handles CORS and normal fallback gracefully.
 */
const getBase64ImageFromUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  
  // If it's already a base64 data URL, return it directly
  if (url.startsWith("data:")) return url;

  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`CORS fetch failed for image: ${url}. Attempting canvas load.`, error);
    
    // Fallback: load image normally and render to canvas
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
            return;
          }
        } catch (e) {
          console.error("Canvas conversion failed:", e);
        }
        resolve(null);
      };
      img.onerror = () => {
        console.error("Failed to load image for PDF:", url);
        resolve(null);
      };
      img.src = url;
    });
  }
};

/**
 * Generates a polished PDF catalog with interactive links and custom theme colors.
 */
export const generateCatalogPDF = async (
  config: CatalogConfig,
  products: Product[],
  onProgress?: (status: string) => void
): Promise<Blob> => {
  onProgress?.("Preparando imagens do catálogo...");
  
  // 1. Fetch all images in parallel to speed up PDF generation
  const logoPromise = getBase64ImageFromUrl(config.logoUrl || "");
  const bannerPromise = getBase64ImageFromUrl(config.bannerUrl || "");
  const productImagesPromises = products.map((p) =>
    p.imageUrl ? getBase64ImageFromUrl(p.imageUrl) : Promise.resolve(null)
  );

  const [logoBase64, bannerBase64, ...productImagesBase64] = await Promise.all([
    logoPromise,
    bannerPromise,
    ...productImagesPromises,
  ]);

  onProgress?.("Formatando páginas e cores...");

  // Create a new A4 document in portrait mode (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = 297;
  const pageWidth = 210;
  const margin = 15;
  const printableWidth = pageWidth - 2 * margin; // 180mm

  // Helper to draw Footer on each page
  const drawFooter = (pageNumber: number, totalPagesPlaceholder: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    
    // Draw divider line above footer
    doc.setDrawColor(243, 244, 246); // gray-100
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Left side: Brand Name
    doc.text(config.footerText || "Prime Home Decor — Catálogo de Copa do Mundo", margin, pageHeight - 10);
    
    // Right side: Page Number
    const pageStr = `Página ${pageNumber} de ${totalPagesPlaceholder}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - margin - pageStrWidth, pageHeight - 10);
  };

  // ---------------- PAGE 1 ----------------
  let currentY = margin;

  // Background overall page color (if user set light background, apply it)
  const bgHex = config.backgroundColor || "#ffffff";
  doc.setFillColor(bgHex);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // A. Header (Logo / Brand Name)
  const headerBg = config.headerBgColor || bgHex;
  if (headerBg !== bgHex) {
    doc.setFillColor(headerBg);
    doc.rect(0, 0, pageWidth, 40, "F");
  }

  if (logoBase64) {
    // Add logo
    try {
      // Scale logo to fit ~30mm width, keeping aspect ratio or safe bounds
      doc.addImage(logoBase64, "PNG", pageWidth / 2 - 20, margin - 5, 40, 15, undefined, "FAST");
    } catch (e) {
      console.error("Could not render logo in PDF", e);
    }
  } else {
    // Brand Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(config.textColor || "#0E2C29");
    const titleText = "Prime Home Decor";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, margin + 5);
  }
  currentY += 18;

  // Draw header divider
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // B. Banner Image (if available)
  if (bannerBase64) {
    try {
      // Banner width: printable width (180mm), height: 45mm
      const bannerHeight = 45;
      doc.addImage(bannerBase64, "JPEG", margin, currentY, printableWidth, bannerHeight, undefined, "FAST");
      currentY += bannerHeight + 8;
    } catch (e) {
      console.error("Could not render banner in PDF", e);
      currentY += 5;
    }
  } else {
    currentY += 5;
  }

  // C. Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(config.textColor || "#0E2C29");
  
  const catalogTitle = config.title || "Promoção Especial de Copa do Mundo";
  const titleLines = doc.splitTextToSize(catalogTitle, printableWidth);
  doc.text(titleLines, pageWidth / 2, currentY, { align: "center" });
  currentY += titleLines.length * 7 + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(config.subtitleColor || "#4B5563");
  const catalogSub = config.subtitle || "Aproveite nossa curadoria premium com descontos exclusivos.";
  const subLines = doc.splitTextToSize(catalogSub, printableWidth - 20);
  doc.text(subLines, pageWidth / 2, currentY, { align: "center" });
  currentY += subLines.length * 4.5 + 8;

  // D. Coupon Box
  const couponBg = config.couponBgColor || "#F5F5F5";
  const couponBorder = config.couponBorderColor || "#D1A72F";
  const couponText = config.couponTextColor || "#0E2C29";
  
  const couponWidth = 140;
  const couponHeight = 24;
  const couponX = (pageWidth - couponWidth) / 2;

  // Draw background
  doc.setFillColor(couponBg);
  doc.rect(couponX, currentY, couponWidth, couponHeight, "F");

  // Draw dashed border
  doc.setDrawColor(couponBorder);
  doc.setLineWidth(1.2);
  doc.setLineDashPattern([3, 2], 0);
  doc.rect(couponX, currentY, couponWidth, couponHeight, "S");
  doc.setLineDashPattern([], 0); // Reset dash

  // Coupon text details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(config.subtitleColor || "#4B5563");
  doc.text("CUPOM DE DESCONTO EXCLUSIVO", pageWidth / 2, currentY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(couponText);
  doc.text(config.couponCode || "COPA6", pageWidth / 2, currentY + 12.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(config.subtitleColor || "#4B5563");
  const couponDesc = config.couponText || "Use o cupom no carrinho de compras e aproveite os descontos selecionados.";
  const couponDescLines = doc.splitTextToSize(couponDesc, couponWidth - 10);
  doc.text(couponDescLines.slice(0, 2), pageWidth / 2, currentY + 18, { align: "center" });
  currentY += couponHeight + 10;

  // E. Section Header "Produtos em Destaque"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(config.textColor || "#0E2C29");
  doc.text("Produtos em Destaque", margin, currentY);
  currentY += 6;

  // Draw subtle subtitle line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(config.subtitleColor || "#4B5563");
  doc.text("Clique em 'Comprar agora' no produto para abrir a página oficial.", margin, currentY);
  currentY += 8;

  // 2. PRODUCT CARDS GRID
  // We lay out cards in a 2-column grid.
  // Card dimensions:
  const cardWidth = 82;
  const cardHeight = 115;
  const colSpacing = 16;
  const rowSpacing = 8;
  const colX = [margin, margin + cardWidth + colSpacing]; // [15, 113]

  let pageNumber = 1;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const colIndex = i % 2;
    const rowIndex = Math.floor(i / 2);

    // Let's check if the row fits on the current page.
    // If we are starting a new row (colIndex === 0) and we exceed printable height:
    if (colIndex === 0 && currentY + cardHeight > pageHeight - 20) {
      // Draw footer for the completed page
      drawFooter(pageNumber, "##TOTAL_PAGES##");
      
      // Create new page
      doc.addPage();
      pageNumber++;
      
      // Draw overall page background
      doc.setFillColor(bgHex);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Reset Y cursor for new page
      currentY = margin + 5;
    }

    const x = colX[colIndex];
    const y = currentY;

    // Draw Card Background
    doc.setFillColor(config.cardBgColor || "#ffffff");
    doc.setDrawColor(243, 244, 246); // very light gray borders
    doc.setLineWidth(0.3);
    doc.rect(x, y, cardWidth, cardHeight, "FD");

    // Draw Product Image
    const imgX = x + 3;
    const imgY = y + 3;
    const imgW = cardWidth - 6;
    const imgH = cardWidth - 6; // square images

    const pImgBase64 = productImagesBase64[i];
    if (pImgBase64) {
      try {
        doc.addImage(pImgBase64, "JPEG", imgX, imgY, imgW, imgH, undefined, "FAST");
      } catch (e) {
        console.error("Could not render product image in PDF", e);
        // Draw elegant image placeholder
        doc.setFillColor(243, 244, 246);
        doc.rect(imgX, imgY, imgW, imgH, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("Sem imagem", imgX + imgW / 2, imgY + imgH / 2, { align: "center" });
      }
    } else {
      // Draw elegant image placeholder
      doc.setFillColor(243, 244, 246);
      doc.rect(imgX, imgY, imgW, imgH, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Sem imagem", imgX + imgW / 2, imgY + imgH / 2, { align: "center" });
    }

    // Draw Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(config.cardTextColor || "#1F2937");
    const nameLines = doc.splitTextToSize(p.name || "Sem Nome", cardWidth - 8);
    // Draw up to 3 lines of text
    doc.text(nameLines.slice(0, 3), x + 4, y + cardWidth + 2);

    // Draw Price
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(config.buttonBgColor || "#0E2C29");
    doc.text(p.price || "R$ 0,00", x + 4, y + cardWidth + 12);

    // Draw Installment Price (if present)
    if (p.installmentPrice) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(p.installmentPrice, x + 4, y + cardWidth + 15.5);
    }

    // Draw CTA Button
    const btnY = y + cardWidth + 19.5;
    const btnH = 8;
    const btnW = cardWidth - 8;
    const btnX = x + 4;

    doc.setFillColor(config.buttonBgColor || "#0E2C29");
    doc.rect(btnX, btnY, btnW, btnH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(config.buttonTextColor || "#ffffff");
    const btnText = "Comprar agora";
    const btnTextW = doc.getTextWidth(btnText);
    doc.text(btnText, btnX + (btnW - btnTextW) / 2, btnY + 5.2);

    // Add Interactive Clickable Link to the entire card
    if (p.linkUrl && p.linkUrl !== "#") {
      doc.link(x, y, cardWidth, cardHeight, { url: p.linkUrl });
    }

    // Advance cursor Y after the second column in the row
    if (colIndex === 1) {
      currentY += cardHeight + rowSpacing;
    } else if (i === products.length - 1) {
      // If this is the absolute last item and it's in the first column, advance Y too
      currentY += cardHeight + rowSpacing;
    }
  }

  // Draw footer for the last page
  drawFooter(pageNumber, "##TOTAL_PAGES##");

  // Replace total pages placeholder in the document output
  const totalPagesStr = String(pageNumber);
  for (let pNum = 1; pNum <= pageNumber; pNum++) {
    doc.setPage(pNum);
    // This is a neat trick: jsPDF replaces text, but since we are working on raw PDF output or we can just draw pageNumber
    // Actually, because jsPDF is client-side, we can just replace the binary string or use a neat page numbering mechanism.
    // In our case, drawing footer with actual page count works since we can write text over or let's just use simple numbering "Página X" if we don't know total beforehand, or we can pre-calculate it!
    // Since we know pageNumber exactly now (it's the final pageNumber value), we can loop back and replace ##TOTAL_PAGES##!
    // Or we can just print "Página pNum de pageNumber" directly by targeting pages.
    // Yes! In jsPDF you can call setPage(pageNumber) to switch back to any page, and write text!
    // Let's do that! That's incredibly elegant and works natively.
    // We can write page total directly! Let's clear the placeholder area or just write it on each page.
    // To make it super simple and clean, let's just write "Página P de N" at the very end by selecting pages!
    // Yes, let's write it now:
  }

  // Let's apply actual total pages
  for (let j = 1; j <= pageNumber; j++) {
    doc.setPage(j);
    // Draw the actual footer numbers cleanly
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    
    // Draw blank white rectangle to hide "Página X de ##TOTAL_PAGES##"
    // width ~ 40mm, height ~ 6mm
    doc.setFillColor(bgHex);
    doc.rect(pageWidth - margin - 40, pageHeight - 13, 40, 5, "F");
    
    const pageStr = `Página ${j} de ${pageNumber}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - margin - pageStrWidth, pageHeight - 10);
  }

  onProgress?.("Pronto!");

  return doc.output("blob");
};
