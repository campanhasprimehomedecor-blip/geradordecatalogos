import { Product, CatalogConfig } from "../types";

export function generateSingleFileHTML(config: CatalogConfig, products: Product[]): string {
  // Safe defaults
  const font = config.fontFamily || "Inter";
  const bg = config.backgroundColor || "#ffffff";
  const textColor = config.textColor || "#0E2C29";
  const subtitleColor = config.subtitleColor || "#4B5563";
  const alignClass = config.textAlignment === "left" ? "text-left" : config.textAlignment === "right" ? "text-right" : "text-center";
  const alignFlex = config.textAlignment === "left" ? "items-start text-left" : config.textAlignment === "right" ? "items-end text-right" : "items-center text-center";
  const alignMargin = config.textAlignment === "left" ? "mr-auto ml-0" : config.textAlignment === "right" ? "ml-auto mr-0" : "mx-auto";
  
  const headerBg = config.headerBgColor || bg;
  const couponBg = config.couponBgColor || "#F5F5F5";
  const couponText = config.couponTextColor || "#0E2C29";
  const couponBorder = config.couponBorderColor || "#D1A72F";
  
  const btnBg = config.buttonBgColor || "#0E2C29";
  const btnText = config.buttonTextColor || "#ffffff";
  
  const prodSecBg = config.productSectionBgColor || "#F7F7F5";
  const cardBg = config.cardBgColor || "#ffffff";
  const cardText = config.cardTextColor || "#1F2937";
  
  const footBg = config.footerBgColor || "#0E2C29";
  const footText = config.footerTextColor || "#9CA3AF";

  const productsHtml = products
    .map(
      (p) => `
      <!-- Card Produto: ${p.name} -->
      <div class="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full" style="background-color: ${cardBg};">
        <div class="relative aspect-square w-full overflow-hidden" style="background-color: ${prodSecBg};">
          <img 
            src="${p.imageUrl}" 
            alt="${p.name}" 
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div class="p-5 flex flex-col flex-grow justify-between">
          <div>
            <h3 class="font-semibold text-base md:text-lg leading-tight mb-2" style="color: ${cardText};">
              ${p.name}
            </h3>
            <div class="mb-4">
              <p class="font-bold text-xl" style="color: ${btnBg};">
                ${p.price}
              </p>
              ${p.installmentPrice ? `
              <p class="text-xs font-medium -mt-1 opacity-75" style="color: ${cardText};">
                ${p.installmentPrice}
              </p>` : ""}
            </div>
          </div>
          <a 
            href="${p.linkUrl}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="block w-full py-3 px-4 text-center font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-sm"
            style="background-color: ${btnBg}; color: ${btnText};"
          >
            Comprar agora
          </a>
        </div>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} | Prime Home Decor</title>
  
  <!-- Fontes do Google (Carrega dinamicamente a fonte preferida) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Cinzel:wght@400..900&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['${font}', 'sans-serif'],
          }
        }
      }
    }
  </script>
  
  <style>
    body {
      font-family: '${font}', 'Inter', sans-serif;
      background-color: ${bg};
    }
  </style>
</head>
<body class="selection:bg-yellow-500/30 selection:text-slate-900" style="background-color: ${bg}; font-family: '${font}', 'Inter', sans-serif;">

  <!-- 1. Topo com Logo -->
  <header class="w-full border-b border-gray-100 py-4 px-4 sticky top-0 z-50 shadow-sm" style="background-color: ${headerBg}; border-color: ${bg === '#ffffff' ? '#f3f4f6' : 'transparent'};">
    <div class="max-w-6xl mx-auto flex justify-center items-center">
      <img 
        src="${config.logoUrl}" 
        alt="Prime Home Decor" 
        class="h-10 md:h-12 object-contain"
      />
    </div>
  </header>

  <!-- 2. Banner Principal -->
  <section class="w-full" style="background-color: ${headerBg};">
    <div class="max-w-6xl mx-auto">
      <img 
        src="${config.bannerUrl}" 
        alt="Banner - ${config.title}" 
        class="w-full h-auto object-cover max-h-[460px] mx-auto block"
      />
    </div>
  </section>

  <!-- 3. Texto Curto e Cupom de Desconto -->
  <section class="py-12 px-4 max-w-3xl mx-auto flex flex-col ${alignFlex}">
    <span class="inline-block px-4 py-1.5 font-semibold text-xs uppercase tracking-widest rounded-full mb-4" style="background-color: ${couponBorder}22; color: ${couponBorder};">
      Seleção Especial
    </span>
    <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" style="color: ${textColor};">
      ${config.title}
    </h1>
    <p class="text-base md:text-lg leading-relaxed mb-8" style="color: ${subtitleColor};">
      ${config.subtitle}
    </p>

    <!-- Área de Cupom -->
    <div class="rounded-2xl p-6 md:p-8 border max-w-lg w-full shadow-sm ${alignMargin}" style="background-color: ${couponBg}; border-color: ${couponBorder}55;">
      <p class="text-sm uppercase tracking-wider font-semibold mb-2" style="color: ${subtitleColor}; opacity: 0.8;">
        Cupom de Desconto Especial
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div id="coupon-box" class="flex items-center justify-between gap-4 bg-white border-2 border-dashed px-5 py-3 rounded-xl font-mono text-xl md:text-2xl font-bold w-full sm:w-auto" style="border-color: ${couponBorder}; color: ${couponText};">
          <span>${config.couponCode}</span>
        </div>
        <button 
          onclick="copyCouponCode()" 
          id="copy-btn" 
          class="font-bold px-6 py-3.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
          style="background-color: ${couponBorder}; color: ${couponText === '#ffffff' ? '#000000' : '#ffffff'};"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Copiar Cupom</span>
        </button>
      </div>
      <p class="text-xs mt-4 font-medium" style="color: ${subtitleColor};">
        ${config.couponText || `Use o cupom <strong style="color: ${couponText}; font-weight: 700;">${config.couponCode}</strong> para obter descontos incríveis nos produtos selecionados.`}
      </p>
    </div>
  </section>

  <!-- 4. Grade de Produtos -->
  <main class="py-12 px-4" style="background-color: ${prodSecBg};">
    <div class="max-w-6xl mx-auto">
      <div class="mb-10 ${alignClass}">
        <h2 class="text-2xl font-bold tracking-tight" style="color: ${textColor};">
          Produtos em Destaque
        </h2>
        <p class="text-sm mt-1" style="color: ${subtitleColor};">
          Toque em "Comprar agora" para acessar a página oficial e finalizar seu pedido.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        ${productsHtml}
      </div>
    </div>
  </main>

  <!-- 5. Rodapé Simples -->
  <footer class="py-12 px-4 text-center border-t" style="background-color: ${footBg}; border-color: ${footBg === '#ffffff' ? '#f3f4f6' : 'transparent'};">
    <div class="max-w-6xl mx-auto flex flex-col items-center gap-4">
      <img 
        src="${config.logoUrl}" 
        alt="Logo" 
        class="h-8 object-contain brightness-0 invert opacity-90"
        style="filter: ${footBg === '#ffffff' || footBg === '#f9fafb' ? 'none' : 'brightness(0) invert(1)'};"
      />
      <p class="text-sm font-medium" style="color: ${footText};">
        ${config.footerText}
      </p>
      <div class="text-xs opacity-75 mt-2" style="color: ${footText};">
        &copy; ${new Date().getFullYear()} Prime Home Decor. Todos os direitos reservados.
      </div>
    </div>
  </footer>

  <!-- Script para Copiar Cupom -->
  <script>
    function copyCouponCode() {
      const couponText = "${config.couponCode}";
      navigator.clipboard.writeText(couponText).then(() => {
        const btn = document.getElementById('copy-btn');
        const originalContent = btn.innerHTML;
        
        btn.innerHTML = \`
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
          <span>Copiado!</span>
        \`;
        btn.style.backgroundColor = '#10b981';
        btn.style.color = '#ffffff';
        
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.style.backgroundColor = '${couponBorder}';
          btn.style.color = '${couponText === '#ffffff' ? '#000000' : '#ffffff'}';
        }, 2000);
      }).catch(err => {
        console.error('Erro ao copiar cupom: ', err);
      });
    }
  </script>

</body>
</html>`;
}
