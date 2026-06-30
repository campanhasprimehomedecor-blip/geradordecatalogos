import React, { useState } from "react";
import { 
  ShoppingBag, 
  Copy, 
  Download, 
  Settings, 
  Grid, 
  Code, 
  Smartphone, 
  Monitor, 
  Edit3, 
  ExternalLink, 
  Tag, 
  Check, 
  Image as ImageIcon,
  Link as LinkIcon,
  HelpCircle,
  Sparkles,
  Crop,
  Plus,
  Trash2,
  FileText
} from "lucide-react";
import { Product, CatalogConfig } from "./types";
import { generateSingleFileHTML } from "./utils/htmlGenerator";
import { ImageCropper } from "./components/ImageCropper";
import { generateCatalogPDF } from "./utils/pdfGenerator";

const INITIAL_CONFIG: CatalogConfig = {
  logoUrl: "https://i.imgur.com/m87tydP.png",
  bannerUrl: "https://i.imgur.com/AcOPGk8.png",
  couponCode: "COPA06OFF",
  title: "Promoção especial de Copa do Mundo",
  subtitle: "Use o cupom COPA06OFF e aproveite 6% de desconto nos produtos selecionados.",
  footerText: "Prime Home Decor — Catálogo especial de Copa do Mundo",
  backgroundColor: "#ffffff"
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Manta Premium Tricot Verde Esmeralda",
    price: "R$ 189,90",
    installmentPrice: "ou 10x de R$ 18,99",
    imageUrl: "https://picsum.photos/id/684/600/600",
    linkUrl: "https://www.primehomedecor.com.br/manta-verde-copa"
  },
  {
    id: "p2",
    name: "Kit 2 Almofadas Veludo Ouro Gold",
    price: "R$ 119,90",
    installmentPrice: "ou 10x de R$ 11,99",
    imageUrl: "https://picsum.photos/id/1069/600/600",
    linkUrl: "https://www.primehomedecor.com.br/kit-almofadas-gold"
  },
  {
    id: "p3",
    name: "Bandeja de Servir Retangular Dourada Luxo",
    price: "R$ 249,90",
    installmentPrice: "ou 10x de R$ 24,99",
    imageUrl: "https://picsum.photos/id/488/600/600",
    linkUrl: "https://www.primehomedecor.com.br/bandeja-dourada"
  },
  {
    id: "p4",
    name: "Conjunto de Taças de Vidro Verde (6 unidades)",
    price: "R$ 199,90",
    installmentPrice: "ou 10x de R$ 19,99",
    imageUrl: "https://picsum.photos/id/429/600/600",
    linkUrl: "https://www.primehomedecor.com.br/tacas-verdes"
  },
  {
    id: "p5",
    name: "Bowl de Cerâmica Rústico Copa Ouro",
    price: "R$ 59,90",
    installmentPrice: "ou 6x de R$ 9,98",
    imageUrl: "https://picsum.photos/id/326/600/600",
    linkUrl: "https://www.primehomedecor.com.br/bowl-ceramica"
  },
  {
    id: "p6",
    name: "Tapete Soft Cozy Off-White Prime",
    price: "R$ 349,90",
    installmentPrice: "ou 12x de R$ 29,15",
    imageUrl: "https://picsum.photos/id/20/600/600",
    linkUrl: "https://www.primehomedecor.com.br/tapete-offwhite"
  },
  {
    id: "p7",
    name: "Luminária de Mesa Industrial Cobre Gold",
    price: "R$ 159,90",
    installmentPrice: "ou 10x de R$ 15,99",
    imageUrl: "https://picsum.photos/id/345/600/600",
    linkUrl: "https://www.primehomedecor.com.br/luminaria-mesa"
  },
  {
    id: "p8",
    name: "Vaso Decorativo de Vidro Verde Imperial",
    price: "R$ 129,90",
    installmentPrice: "ou 10x de R$ 12,99",
    imageUrl: "https://picsum.photos/id/1062/600/600",
    linkUrl: "https://www.primehomedecor.com.br/vaso-verde"
  }
];

export default function App() {
  const [config, setConfig] = useState<CatalogConfig>(INITIAL_CONFIG);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activeTab, setActiveTab] = useState<"general" | "products" | "export">("products");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [expandedProduct, setExpandedProduct] = useState<string | null>("p1");
  const [copiedCode, setCopiedCode] = useState(false);
  const [croppingProduct, setCroppingProduct] = useState<Product | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");

  // Load from server on mount
  React.useEffect(() => {
    fetch("/api/catalog")
      .then(res => res.json())
      .then(data => {
        if (data.config && data.products) {
          setConfig(data.config);
          setProducts(data.products);
        }
      })
      .catch(err => console.error("Erro ao carregar dados do catálogo:", err));
    
    // Set share url
    setShareUrl(window.location.origin + "/catalog");
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ config, products })
      });
      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Erro ao salvar catálogo:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    setPdfProgress("Iniciando geração de PDF...");
    try {
      const blob = await generateCatalogPDF(config, products, (progress) => {
        setPdfProgress(progress);
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = (config.title || "catalogo")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, "_")
        .slice(0, 30);
      link.download = `${safeTitle || "catalogo"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress("");
    }
  };

  // General configuration update handler
  const handleConfigChange = (key: keyof CatalogConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Product property change handler
  const handleProductChange = (productId: string, key: keyof Product, value: string) => {
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, [key]: value } : p)
    );
  };

  // Add a new product
  const handleAddProduct = () => {
    const newId = `p-${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      name: "Novo Produto",
      price: "R$ 0,00",
      imageUrl: "https://picsum.photos/600/600",
      linkUrl: "#",
    };
    setProducts(prev => [...prev, newProduct]);
    setExpandedProduct(newId);
  };

  // Remove an existing product
  const handleRemoveProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    }
  };

  // Generate full standalone single file HTML code
  const generatedHtml = generateSingleFileHTML(config, products);

  // Copy HTML code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy Coupon Code for test
  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(config.couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  // Download compiled HTML file
  const handleDownloadFile = () => {
    const blob = new Blob([generatedHtml], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "catalogo_prime_home_decor.html");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="app-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Top Admin Header */}
      <header id="admin-header" className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0E2C29] rounded-xl border border-emerald-600/30">
            <ShoppingBag className="h-6 w-6 text-[#D1A72F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Prime Home Decor</h1>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Gerador de Catálogo
              </span>
            </div>
            <p className="text-xs text-slate-400">Edite as informações em tempo real e exporte um único arquivo HTML pronto para usar.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            id="btn-save-top"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition duration-200 active:scale-95 cursor-pointer shadow-lg ${
              saveSuccess 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10" 
                : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/10"
            }`}
          >
            {isSaving ? (
              <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full"></span>
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>{isSaving ? "Salvando..." : saveSuccess ? "Salvo com sucesso!" : "Salvar Catálogo"}</span>
          </button>
          <button
            id="btn-generate-pdf-top"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-750 text-white text-sm font-bold rounded-xl transition duration-200 active:scale-95 shadow-lg shadow-red-600/15 cursor-pointer disabled:bg-slate-800 disabled:text-slate-400"
          >
            {isGeneratingPDF ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                <span className="text-xs">{pdfProgress || "Gerando..."}</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Gerar PDF</span>
              </>
            )}
          </button>
          <button
            id="btn-copy-html-top"
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition duration-200 active:scale-95 cursor-pointer"
          >
            {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedCode ? "Copiado!" : "Copiar HTML"}</span>
          </button>
          <button
            id="btn-download-html-top"
            onClick={handleDownloadFile}
            className="flex items-center gap-2 px-4 py-2 bg-[#D1A72F] hover:bg-[#B89020] text-[#0E2C29] text-sm font-bold rounded-xl transition duration-200 active:scale-95 shadow-lg shadow-yellow-600/10 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Baixar index.html</span>
          </button>
        </div>
      </header>

      {/* Main Workspace split */}
      <div id="workspace-layout" className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Editor Console */}
        <aside id="editor-sidebar" className="w-full lg:w-[450px] bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto lg:h-[calc(100vh-80px)]">
          
          {/* Sidebar Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950 sticky top-0 z-10 shrink-0">
            <button
              id="tab-btn-products"
              onClick={() => setActiveTab("products")}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "products" 
                  ? "border-[#D1A72F] text-[#D1A72F] bg-slate-900/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20"
              }`}
            >
              <Grid className="h-4 w-4" />
              <span>Produtos ({products.length})</span>
            </button>
            <button
              id="tab-btn-general"
              onClick={() => setActiveTab("general")}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "general" 
                  ? "border-[#D1A72F] text-[#D1A72F] bg-slate-900/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Geral & Cupom</span>
            </button>
            <button
              id="tab-btn-export"
              onClick={() => setActiveTab("export")}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "export" 
                  ? "border-[#D1A72F] text-[#D1A72F] bg-slate-900/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20"
              }`}
            >
              <Code className="h-4 w-4" />
              <span>Visualizar Código</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-grow flex flex-col gap-6">
            
            {/* Tab: PRODUCTS */}
            {activeTab === "products" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Produtos do Catálogo</h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {products.length} {products.length === 1 ? "item selecionado" : "itens selecionados"}
                  </span>
                </div>

                <div className="space-y-3">
                  {products.length === 0 ? (
                    <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                      <ShoppingBag className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Nenhum produto cadastrado</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Adicione produtos para começar a personalizar o catálogo.</p>
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D1A72F] hover:bg-[#B89020] text-[#0E2C29] font-bold text-[11px] uppercase tracking-wider rounded-lg transition cursor-pointer active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar Produto</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {products.map((product, idx) => {
                    const isExpanded = expandedProduct === product.id;
                    return (
                      <div 
                        key={product.id} 
                        className={`border rounded-xl transition duration-200 overflow-hidden bg-slate-900/50 ${
                          isExpanded ? "border-[#D1A72F]/50 shadow-md shadow-[#D1A72F]/5" : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {/* Summary Header */}
                        <div className="w-full px-4 py-2.5 flex items-center justify-between gap-3">
                          <button
                            onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                            className="flex-grow flex items-center gap-3 overflow-hidden text-left focus:outline-none cursor-pointer"
                          >
                            <span className="flex-shrink-0 text-[10px] font-bold text-[#D1A72F] bg-[#D1A72F]/10 px-2 py-0.5 rounded-md">
                              Card {idx + 1}
                            </span>
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-8 w-8 rounded-lg object-cover bg-slate-800 border border-slate-700 flex-shrink-0"
                            />
                            <div className="truncate">
                              <h4 className="text-xs font-semibold text-slate-200 truncate">{product.name || "Sem Nome"}</h4>
                              <p className="text-[10px] text-emerald-400 font-bold">{product.price || "Sem Preço"}</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                              className="text-slate-400 text-[11px] font-semibold hover:text-[#D1A72F] px-2 py-1 hover:bg-slate-800 rounded-md transition cursor-pointer"
                            >
                              {isExpanded ? "Fechar" : "Editar"}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProduct(product.id);
                              }}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/15 p-1.5 rounded-lg transition cursor-pointer"
                              title="Remover produto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Form Fields */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 space-y-4 text-xs">
                            
                            {/* Nome do Produto */}
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Nome do Produto</label>
                              <div className="relative">
                                <Edit3 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  value={product.name}
                                  onChange={(e) => handleProductChange(product.id, "name", e.target.value)}
                                  placeholder="Ex: Almofada Velvet Gold"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-200 focus:outline-none focus:border-[#D1A72F]"
                                />
                              </div>
                            </div>

                            {/* Preço do Produto */}
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Preço (Texto livre)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">R$</span>
                                <input
                                  type="text"
                                  value={product.price}
                                  onChange={(e) => handleProductChange(product.id, "price", e.target.value)}
                                  placeholder="Ex: R$ 79,90"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-200 focus:outline-none focus:border-[#D1A72F]"
                                />
                              </div>
                            </div>

                            {/* Preço Parcelado do Produto */}
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Preço Parcelado / Texto de Apoio (Opcional)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">ou</span>
                                <input
                                  type="text"
                                  value={product.installmentPrice || ""}
                                  onChange={(e) => handleProductChange(product.id, "installmentPrice", e.target.value)}
                                  placeholder="Ex: 10x de R$ 7,99 ou Sob consulta"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-200 focus:outline-none focus:border-[#D1A72F]"
                                />
                              </div>
                            </div>

                            {/* Link do Produto (href) */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-slate-400 font-semibold">Link do Botão "Comprar agora"</label>
                                <span className="text-[10px] text-amber-500 font-semibold">LINK_DO_PRODUTO</span>
                              </div>
                              <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  value={product.linkUrl}
                                  onChange={(e) => handleProductChange(product.id, "linkUrl", e.target.value)}
                                  placeholder="https://www.site.com/produto-exemplo"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#D1A72F]"
                                />
                              </div>
                            </div>

                            {/* Foto do Produto */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-slate-400 font-semibold">URL da Imagem (Picsum / Unsplash / Imgur)</label>
                                <button
                                  type="button"
                                  onClick={() => setCroppingProduct(product)}
                                  className="flex items-center gap-1.5 px-2 py-0.5 bg-[#D1A72F]/10 hover:bg-[#D1A72F]/20 text-[#D1A72F] font-bold text-[10px] uppercase tracking-wider rounded-md border border-[#D1A72F]/20 transition cursor-pointer"
                                >
                                  <Crop className="h-2.5 w-2.5" />
                                  <span>Recortar / Ajustar</span>
                                </button>
                              </div>
                              <div className="relative">
                                <ImageIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  value={product.imageUrl}
                                  onChange={(e) => handleProductChange(product.id, "imageUrl", e.target.value)}
                                  placeholder="https://picsum.photos/600/600"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#D1A72F]"
                                />
                              </div>

                              {/* Aspect-Ratio Previewer Box */}
                              <div className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Visualizador de Uniformidade de Aspect Ratio:</span>
                                <div className="flex items-center gap-3">
                                  {/* Aspect Ratio 1:1 Preview */}
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-[#D1A72F]/40 bg-slate-900 relative">
                                      {product.imageUrl ? (
                                        <img 
                                          src={product.imageUrl} 
                                          alt="Preview 1:1" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://i.imgur.com/AcOPGk8.png";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-bold">1:1 Square</span>
                                  </div>

                                  {/* Aspect Ratio 4:3 Preview */}
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative">
                                      {product.imageUrl ? (
                                        <img 
                                          src={product.imageUrl} 
                                          alt="Preview 4:3" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://i.imgur.com/AcOPGk8.png";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-bold">4:3 Portrait</span>
                                  </div>

                                  {/* Tip */}
                                  <div className="flex-grow text-[9px] text-slate-400 leading-normal">
                                    <p>Simula como o item se comporta sob cortes automáticos.</p>
                                    <p className="text-[#D1A72F] mt-0.5 font-bold">✨ Clique em 'Recortar / Ajustar' para ajustar o enquadramento.</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Link Quick Test Preview */}
                            <div className="flex justify-end pt-1">
                              <a 
                                href={product.linkUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-1.5 text-xs text-[#D1A72F] hover:underline"
                              >
                                <span>Testar link no navegador</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[#D1A72F] font-bold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Novo Produto</span>
                  </button>
                </>
              )}
            </div>
              </div>
            )}

            {/* Tab: GENERAL & COUPON */}
            {activeTab === "general" && (
              <div className="flex flex-col gap-6 text-xs animate-fade-in pb-10">
                <div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Identidade & Estilo 100% Personalizável</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Customize totalmente a aparência, tipografia, cores e blocos do seu catálogo digital.</p>
                </div>

                {/* --- SEÇÃO 1: CONTEÚDO --- */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-[#D1A72F] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Edit3 className="h-3.5 w-3.5" /> 1. Textos & Conteúdo Principal
                  </h4>
                  
                  {/* Título Principal */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Título de Chamada</label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => handleConfigChange("title", e.target.value)}
                      placeholder="Ex: Promoção especial de Copa do Mundo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-[#D1A72F]"
                    />
                  </div>

                  {/* Subtítulo Principal */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Subtítulo de Chamada</label>
                    <textarea
                      value={config.subtitle}
                      onChange={(e) => handleConfigChange("subtitle", e.target.value)}
                      placeholder="Ex: Use o cupom COPA06OFF e aproveite 6% de desconto nos produtos selecionados."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-[#D1A72F] resize-none"
                    />
                  </div>

                  {/* Cupom */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Código do Cupom de Desconto</label>
                    <input
                      type="text"
                      value={config.couponCode}
                      onChange={(e) => handleConfigChange("couponCode", e.target.value)}
                      placeholder="Ex: COPA06OFF"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 uppercase font-mono font-bold tracking-wider focus:outline-none focus:border-[#D1A72F]"
                    />
                  </div>

                  {/* Logo da Empresa */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">URL da Logo (PNG transparente recomendado)</label>
                    <input
                      type="text"
                      value={config.logoUrl}
                      onChange={(e) => handleConfigChange("logoUrl", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#D1A72F]"
                    />
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Recomendado: 40px altura</span>
                      <a href={config.logoUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:underline flex items-center gap-0.5">
                        Ver atual <ExternalLink className="h-2 w-2" />
                      </a>
                    </div>
                  </div>

                  {/* Banner de Promoção */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">URL do Banner Principal</label>
                    <input
                      type="text"
                      value={config.bannerUrl}
                      onChange={(e) => handleConfigChange("bannerUrl", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#D1A72F]"
                    />
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Recomendado: 1200x460px</span>
                      <a href={config.bannerUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:underline flex items-center gap-0.5">
                        Ver atual <ExternalLink className="h-2 w-2" />
                      </a>
                    </div>
                  </div>

                  {/* Texto de Rodapé */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Assinatura do Rodapé</label>
                    <input
                      type="text"
                      value={config.footerText}
                      onChange={(e) => handleConfigChange("footerText", e.target.value)}
                      placeholder="Ex: Prime Home Decor — Catálogo especial"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-[#D1A72F]"
                    />
                  </div>
                </div>

                {/* --- SEÇÃO 2: TIPOGRAFIA --- */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-[#D1A72F] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Grid className="h-3.5 w-3.5" /> 2. Tipografia & Layout
                  </h4>

                  {/* Tipo de Fonte */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Estilo/Família de Fonte</label>
                    <select
                      value={config.fontFamily || "Inter"}
                      onChange={(e) => handleConfigChange("fontFamily", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-[#D1A72F] cursor-pointer"
                    >
                      <option value="Inter">Inter (Limpo, Moderno e Neutro)</option>
                      <option value="Playfair Display">Playfair Display (Sofisticado, Clássico Imperial)</option>
                      <option value="Space Grotesk">Space Grotesk (Tecnológico, Contemporâneo)</option>
                      <option value="JetBrains Mono">JetBrains Mono (Espaçado, Técnico e Brutalista)</option>
                      <option value="Montserrat">Montserrat (Estilo Editorial Premium)</option>
                      <option value="Cinzel">Cinzel (Extremamente Luxuoso / Jóias)</option>
                    </select>
                  </div>

                  {/* Alinhamento dos Textos */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Posicionamento/Alinhamento de Textos</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["left", "center", "right"].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => handleConfigChange("textAlignment", align)}
                          className={`py-2 px-3 rounded-lg border font-semibold text-center transition cursor-pointer capitalize ${
                            (config.textAlignment || "center") === align
                              ? "bg-[#D1A72F] border-[#D1A72F] text-slate-950"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {align === "left" ? "Esquerda" : align === "right" ? "Direita" : "Centro"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- SEÇÃO 3: CORES DE TEXTOS & TÍTULOS --- */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-[#D1A72F] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Tag className="h-3.5 w-3.5" /> 3. Cores dos Textos
                  </h4>

                  {/* Cor do Texto Principal */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Cor do Título & Texto Principal</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.textColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("textColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.textColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("textColor", e.target.value)}
                        placeholder="#0E2C29"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor do Subtítulo */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Cor do Subtítulo & Textos de Apoio</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.subtitleColor || "#4B5563"}
                        onChange={(e) => handleConfigChange("subtitleColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.subtitleColor || "#4B5563"}
                        onChange={(e) => handleConfigChange("subtitleColor", e.target.value)}
                        placeholder="#4B5563"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>
                </div>

                {/* --- SEÇÃO 4: CORES DE FUNDO (SESSÕES) --- */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-[#D1A72F] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Monitor className="h-3.5 w-3.5" /> 4. Cores de Fundo (Sessões)
                  </h4>

                  {/* Cor de Fundo da Página */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Fundo Geral do Site</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.backgroundColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("backgroundColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("backgroundColor", e.target.value)}
                        placeholder="#ffffff"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor de Fundo do Topo */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Fundo do Topo (Header/Logo)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.headerBgColor || config.backgroundColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("headerBgColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.headerBgColor || config.backgroundColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("headerBgColor", e.target.value)}
                        placeholder="#ffffff"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor de Fundo do Bloco de Cupom */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Fundo do Bloco do Cupom</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.couponBgColor || "#F5F5F5"}
                        onChange={(e) => handleConfigChange("couponBgColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.couponBgColor || "#F5F5F5"}
                        onChange={(e) => handleConfigChange("couponBgColor", e.target.value)}
                        placeholder="#F5F5F5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor de Fundo da Seção de Produtos */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Fundo da Seção de Produtos</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.productSectionBgColor || "#F7F7F5"}
                        onChange={(e) => handleConfigChange("productSectionBgColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.productSectionBgColor || "#F7F7F5"}
                        onChange={(e) => handleConfigChange("productSectionBgColor", e.target.value)}
                        placeholder="#F7F7F5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor de Fundo do Rodapé */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Fundo do Rodapé (Footer)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.footerBgColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("footerBgColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.footerBgColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("footerBgColor", e.target.value)}
                        placeholder="#0E2C29"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>
                </div>

                {/* --- SEÇÃO 5: ELEMENTOS, CUPOM & BOTÕES --- */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-[#D1A72F] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <ShoppingBag className="h-3.5 w-3.5" /> 5. Cupom, Botões & Cards
                  </h4>

                  {/* Borda do Cupom */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Cor de Destaque / Borda / Botão de Cópia do Cupom</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.couponBorderColor || "#D1A72F"}
                        onChange={(e) => handleConfigChange("couponBorderColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.couponBorderColor || "#D1A72F"}
                        onChange={(e) => handleConfigChange("couponBorderColor", e.target.value)}
                        placeholder="#D1A72F"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor do Texto do Código do Cupom */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Cor do Texto do Código do Cupom</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.couponTextColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("couponTextColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.couponTextColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("couponTextColor", e.target.value)}
                        placeholder="#0E2C29"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Fundo do Card de Produto */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Fundo do Card de Produto</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.cardBgColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("cardBgColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.cardBgColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("cardBgColor", e.target.value)}
                        placeholder="#ffffff"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor do Texto do Card de Produto */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Cor do Título do Produto</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.cardTextColor || "#1F2937"}
                        onChange={(e) => handleConfigChange("cardTextColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.cardTextColor || "#1F2937"}
                        onChange={(e) => handleConfigChange("cardTextColor", e.target.value)}
                        placeholder="#1F2937"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Fundo do Botão Comprar */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Fundo do Botão "Comprar Agora"</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.buttonBgColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("buttonBgColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.buttonBgColor || "#0E2C29"}
                        onChange={(e) => handleConfigChange("buttonBgColor", e.target.value)}
                        placeholder="#0E2C29"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor do Texto do Botão Comprar */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Texto do Botão "Comprar Agora"</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.buttonTextColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("buttonTextColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.buttonTextColor || "#ffffff"}
                        onChange={(e) => handleConfigChange("buttonTextColor", e.target.value)}
                        placeholder="#ffffff"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>

                  {/* Cor do Texto do Rodapé */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Cor do Texto do Rodapé</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.footerTextColor || "#9CA3AF"}
                        onChange={(e) => handleConfigChange("footerTextColor", e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={config.footerTextColor || "#9CA3AF"}
                        onChange={(e) => handleConfigChange("footerTextColor", e.target.value)}
                        placeholder="#9CA3AF"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#D1A72F]"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Geral Button */}
                <button
                  type="button"
                  onClick={() => {
                    setConfig({
                      logoUrl: "https://i.imgur.com/m87tydP.png",
                      bannerUrl: "https://i.imgur.com/AcOPGk8.png",
                      couponCode: "COPA06OFF",
                      title: "Promoção especial de Copa do Mundo",
                      subtitle: "Use o cupom COPA06OFF e aproveite 6% de desconto nos produtos selecionados.",
                      footerText: "Prime Home Decor — Catálogo especial de Copa do Mundo",
                      backgroundColor: "#ffffff",
                      fontFamily: "Inter",
                      textColor: "#0E2C29",
                      subtitleColor: "#4B5563",
                      textAlignment: "center",
                      headerBgColor: "#ffffff",
                      couponBgColor: "#F5F5F5",
                      couponTextColor: "#0E2C29",
                      couponBorderColor: "#D1A72F",
                      buttonBgColor: "#0E2C29",
                      buttonTextColor: "#ffffff",
                      footerBgColor: "#0E2C29",
                      footerTextColor: "#9CA3AF",
                      cardBgColor: "#ffffff",
                      cardTextColor: "#1F2937",
                      productSectionBgColor: "#F7F7F5"
                    });
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-center"
                >
                  Resetar Todas as Cores & Estilos para Padrão
                </button>
              </div>
            )}


            {/* Tab: EXPORT CODE */}
            {activeTab === "export" && (
              <div className="flex flex-col gap-4 text-xs flex-grow animate-fade-in">
                
                {/* Link Público para Cliente */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Link Público para o Cliente
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                      Hospedado Online
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Você pode salvar o catálogo no servidor para manter as informações atualizadas na sua página de cliente:
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 font-mono text-xs focus:outline-none"
                    />
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 active:scale-95 cursor-pointer shrink-0 ${
                        saveSuccess 
                          ? "bg-emerald-600 text-white" 
                          : "bg-[#D1A72F] hover:bg-[#B89020] text-[#0E2C29]"
                      }`}
                    >
                      {isSaving ? "Salvando..." : saveSuccess ? "Salvo!" : "Salvar"}
                    </button>
                  </div>
                  
                  <div className="flex justify-end">
                    <a 
                      href="/catalog" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[#D1A72F] hover:underline text-xs flex items-center gap-1"
                    >
                      Abrir visualização do cliente <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Exportar PDF */}
                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Exportar como PDF Interativo
                    </span>
                    <span className="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                      Com links clicáveis
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Gere um catálogo em formato PDF de alta qualidade. Os botões de compra e imagens conterão links diretos para que seus clientes comprem com apenas um clique.
                  </p>
                  
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-750 disabled:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                        <span>{pdfProgress || "Gerando PDF..."}</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Gerar PDF Agora</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Código Fonte Autônomo</h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    Sem dependências
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Este código contém todo o catálogo em um **único arquivo HTML independente**. É ideal para disparar por e-mail marketing, hospedar como landing page, ou enviar diretamente aos clientes no WhatsApp.
                </p>

                {/* Code Window */}
                <div className="flex-grow flex flex-col relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-[350px]">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">index.html (HTML + CSS + JS)</span>
                    <button 
                      onClick={handleCopyCode}
                      className="text-xs text-[#D1A72F] hover:text-[#B89020] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode ? "Copiado!" : "Copiar tudo"}</span>
                    </button>
                  </div>
                  <pre className="p-4 overflow-auto font-mono text-[11px] text-slate-300 leading-normal flex-grow select-all select-none">
                    <code>{generatedHtml}</code>
                  </pre>
                </div>

                <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#D1A72F] shrink-0 mt-0.5" />
                  <div>
                    <h4 class="font-bold text-slate-200 mb-0.5">Exportação Inteligente</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      O arquivo gerado inclui Tailwind CSS via CDN oficial e otimizações de fontes pré-carregadas. Funciona diretamente em qualquer navegador!
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Quick Help Footer inside sidebar */}
          <div className="p-6 border-t border-slate-800 bg-slate-950 mt-auto text-[11px] text-slate-500 flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Qualquer alteração feita é atualizada na prévia ao lado automaticamente.</span>
          </div>
        </aside>

        {/* Right Side: Interactive Live Preview Container */}
        <main id="preview-container" className="flex-grow bg-slate-900 flex flex-col p-4 md:p-8 overflow-y-auto lg:h-[calc(100vh-80px)]">
          
          {/* Preview Navigation Bar / Switcher */}
          <div className="max-w-6xl w-full mx-auto mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="preview-mode-desktop"
                onClick={() => setPreviewMode("desktop")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  previewMode === "desktop" 
                    ? "bg-[#D1A72F] text-[#0E2C29]" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Modo Computador</span>
              </button>
              <button
                id="preview-mode-mobile"
                onClick={() => setPreviewMode("mobile")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  previewMode === "mobile" 
                    ? "bg-[#D1A72F] text-[#0E2C29]" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Modo Celular (Responsivo)</span>
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Visualização em tempo real</span>
            </span>
          </div>

          {/* Simulated Screen Stage */}
          <div className="flex-grow flex items-center justify-center w-full max-w-6xl mx-auto">
            
            <div 
              id="simulated-device"
              className={`shadow-2xl transition-all duration-300 overflow-y-auto ${
                previewMode === "mobile" 
                  ? "w-[375px] h-[700px] border-[12px] border-slate-950 rounded-[40px] shadow-black/40 relative" 
                  : "w-full min-h-[600px] border border-slate-200 rounded-2xl"
              }`}
              style={{ backgroundColor: config.backgroundColor || "#ffffff" }}
            >
              {/* If mobile, draw a top notch */}
              {previewMode === "mobile" && (
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 rounded-t-lg flex items-center justify-center z-50">
                  <div className="w-24 h-4 bg-slate-950 rounded-b-xl"></div>
                </div>
              )}

              {/* LIVE SIMULATED RENDER OF THE HTML/CSS/JS PAGE */}
              <div 
                className={`text-slate-900 ${previewMode === "mobile" ? "pt-6 h-full overflow-y-auto" : ""}`}
                style={{ 
                  backgroundColor: config.backgroundColor || "#ffffff",
                  fontFamily: `${config.fontFamily || "Inter"}, sans-serif`
                }}
              >
                
                {/* 1. Topo com Logo */}
                <header 
                  className="w-full border-b py-4 px-4 sticky top-0 z-40 shadow-sm flex items-center justify-center"
                  style={{ 
                    backgroundColor: config.headerBgColor || config.backgroundColor || "#ffffff",
                    borderColor: (config.headerBgColor || config.backgroundColor || "#ffffff") === "#ffffff" ? "#f3f4f6" : "rgba(0,0,0,0.06)"
                  }}
                >
                  <img 
                    src={config.logoUrl || "https://placeholder.com/logo"} 
                    alt="Prime Home Decor Logo" 
                    className="h-9 md:h-11 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </header>

                {/* 2. Banner Principal */}
                <div 
                  className="w-full"
                  style={{ backgroundColor: config.headerBgColor || config.backgroundColor || "#ffffff" }}
                >
                  <div className="max-w-6xl mx-auto">
                    <img 
                      src={config.bannerUrl || "https://placeholder.com/banner"} 
                      alt="Copa do Mundo Banner" 
                      className="w-full h-auto object-cover max-h-[380px] mx-auto block"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>

                {/* 3. Descrição e Bloco de Cupom */}
                <div className={`py-10 px-4 max-w-2xl mx-auto flex flex-col ${
                  config.textAlignment === "left" ? "items-start text-left" : config.textAlignment === "right" ? "items-end text-right" : "items-center text-center"
                }`}>
                  <span 
                    className="inline-block px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full mb-3"
                    style={{ 
                      backgroundColor: (config.couponBorderColor || "#D1A72F") + "22",
                      color: config.couponBorderColor || "#D1A72F"
                    }}
                  >
                    Seleção Especial de Copa
                  </span>
                  <h2 
                    className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3"
                    style={{ color: config.textColor || "#0E2C29" }}
                  >
                    {config.title || "Promoção Especial de Copa do Mundo"}
                  </h2>
                  <p 
                    className="text-xs md:text-sm leading-relaxed mb-6"
                    style={{ color: config.subtitleColor || "#4B5563" }}
                  >
                    {config.subtitle || "Aproveite nossa curadoria premium com descontos exclusivos para preparar seu lar para vibrar em grande estilo."}
                  </p>

                  {/* Cupom Box */}
                  <div 
                    className={`rounded-2xl p-5 md:p-6 border shadow-sm w-full max-w-md ${
                      config.textAlignment === "left" ? "mr-auto ml-0" : config.textAlignment === "right" ? "ml-auto mr-0" : "mx-auto"
                    }`}
                    style={{ 
                      backgroundColor: config.couponBgColor || "#F5F5F5",
                      borderColor: (config.couponBorderColor || "#D1A72F") + "55"
                    }}
                  >
                    <p 
                      className="text-[10px] uppercase tracking-wider font-bold mb-1.5"
                      style={{ color: config.subtitleColor || "#4B5563", opacity: 0.8 }}
                    >
                      Cupom de Desconto Especial
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <div 
                        className="flex items-center justify-center border-2 border-dashed px-4 py-2 bg-white rounded-lg font-mono text-lg font-extrabold w-full sm:w-auto"
                        style={{ 
                          borderColor: config.couponBorderColor || "#D1A72F",
                          color: config.couponTextColor || "#0E2C29"
                        }}
                      >
                        <span>{config.couponCode}</span>
                      </div>
                      <button 
                        onClick={handleCopyCoupon} 
                        className="font-bold px-4 py-2.5 rounded-lg transition-all duration-200 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer hover:opacity-95 active:scale-95"
                        style={{ 
                          backgroundColor: config.couponBorderColor || "#D1A72F",
                          color: (config.couponTextColor === "#ffffff" ? "#000000" : "#ffffff")
                        }}
                      >
                        {copiedCoupon ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCoupon ? "Copiado!" : "Copiar Cupom"}</span>
                      </button>
                    </div>
                    <p 
                      className="text-[11px] mt-3 font-medium"
                      style={{ color: config.subtitleColor || "#4B5563" }}
                    >
                      Use o cupom <strong style={{ color: config.couponTextColor || "#0E2C29" }}>{config.couponCode}</strong> para obter descontos incríveis nos produtos selecionados.
                    </p>
                  </div>
                </div>

                {/* 4. Grade de Produtos */}
                <div 
                  className="py-10 px-4 border-t border-b border-gray-100"
                  style={{ backgroundColor: config.productSectionBgColor || "#F7F7F5" }}
                >
                  <div className="max-w-6xl mx-auto">
                    <div className={`mb-8 ${
                      config.textAlignment === "left" ? "text-left" : config.textAlignment === "right" ? "text-right" : "text-center"
                    }`}>
                      <h3 
                        className="text-lg font-bold tracking-tight"
                        style={{ color: config.textColor || "#0E2C29" }}
                      >
                        Produtos em Destaque
                      </h3>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ color: config.subtitleColor || "#4B5563" }}
                      >
                        Toque em "Comprar agora" para acessar a página oficial e finalizar seu pedido.
                      </p>
                    </div>

                    {/* Cards Grid */}
                    {products.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                        <ShoppingBag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-500">Nenhum produto cadastrado no momento</p>
                        <p className="text-xs text-gray-400 mt-1">Use o editor na barra lateral esquerda para adicionar novos produtos!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((p) => (
                          <div 
                            key={p.id} 
                            className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
                            style={{ backgroundColor: config.cardBgColor || "#ffffff" }}
                          >
                            <div 
                              className="relative aspect-square w-full overflow-hidden"
                              style={{ backgroundColor: config.productSectionBgColor || "#F5F5F5" }}
                            >
                              <img 
                                src={p.imageUrl || "https://picsum.photos/600/600"} 
                                alt={p.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://picsum.photos/600/600";
                                }}
                              />
                            </div>
                            
                            <div className="p-4 flex flex-col flex-grow justify-between text-left">
                              <div>
                                <h4 
                                  className="font-semibold text-xs md:text-sm leading-snug mb-1.5 min-h-[36px] line-clamp-2"
                                  style={{ color: config.cardTextColor || "#1F2937" }}
                                >
                                  {p.name || "Sem Nome"}
                                </h4>
                                <div className="mb-3">
                                  <p 
                                    className="font-bold text-base"
                                    style={{ color: config.buttonBgColor || "#0E2C29" }}
                                  >
                                    {p.price || "R$ 0,00"}
                                  </p>
                                  {p.installmentPrice && (
                                    <p 
                                      className="text-[10px] text-gray-500 font-medium -mt-1"
                                      style={{ color: config.cardTextColor ? `${config.cardTextColor}bb` : "#6B7280" }}
                                    >
                                      {p.installmentPrice}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* CTA button with editable link */}
                              <a 
                                href={p.linkUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="block w-full py-2 px-3 text-center text-xs font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                                style={{ 
                                  backgroundColor: config.buttonBgColor || "#0E2C29", 
                                  color: config.buttonTextColor || "#ffffff" 
                                }}
                              >
                                Comprar agora
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Rodapé Simples */}
                <footer 
                  className="py-10 px-4 text-center border-t border-gray-100"
                  style={{ 
                    backgroundColor: config.footerBgColor || "#0E2C29",
                    borderColor: (config.footerBgColor || "#0E2C29") === "#ffffff" ? "#f3f4f6" : "transparent"
                  }}
                >
                  <div className="max-w-6xl mx-auto flex flex-col items-center gap-3">
                    <img 
                      src={config.logoUrl} 
                      alt="Prime Home Decor" 
                      className="h-7 object-contain"
                      style={{ 
                        filter: (config.footerBgColor || "#0E2C29") === "#ffffff" ? "none" : "brightness(0) invert(1)"
                      }}
                    />
                    <p 
                      className="text-xs font-medium max-w-md"
                      style={{ color: config.footerTextColor || "#9CA3AF" }}
                    >
                      {config.footerText || "Prime Home Decor — Catálogo especial de Copa do Mundo"}
                    </p>
                    <div 
                      className="text-[10px] mt-1"
                      style={{ color: config.footerTextColor || "#9CA3AF", opacity: 0.7 }}
                    >
                      &copy; 2026 Prime Home Decor. Todos os direitos reservados.
                    </div>
                  </div>
                </footer>

              </div>
            </div>

          </div>

        </main>

        {/* Modal do Recortador e Ajustador de Imagem */}
        {croppingProduct && (
          <ImageCropper
            initialImageUrl={croppingProduct.imageUrl}
            productName={croppingProduct.name}
            onClose={() => setCroppingProduct(null)}
            onCropComplete={(croppedUrl) => {
              handleProductChange(croppingProduct.id, "imageUrl", croppedUrl);
            }}
          />
        )}

      </div>
    </div>
  );
}
