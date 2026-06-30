import React, { useState, useRef, useEffect } from "react";
import { 
  Crop, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Upload, 
  Check, 
  X, 
  RefreshCw, 
  Image as ImageIcon,
  AlertTriangle,
  Move
} from "lucide-react";

interface ImageCropperProps {
  initialImageUrl: string;
  productName: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onClose: () => void;
}

type AspectRatioType = "1:1" | "4:3" | "16:9";

export function ImageCropper({ initialImageUrl, productName, onCropComplete, onClose }: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("1:1");
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [corsError, setCorsError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Dragging state
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle URL change or input load
  const handleUrlSubmit = (url: string) => {
    if (!url) return;
    setIsLoading(true);
    setCorsError(false);
    setImageLoaded(false);
    setImageUrl(url);
    setScale(1.0);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  };

  // Local file upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setCorsError(false);
    setImageLoaded(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === "string") {
        setImageUrl(event.target.result);
        setScale(1.0);
        setRotation(0);
        setOffsetX(0);
        setOffsetY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Initialize and load image
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    // Enable crossOrigin to try and crop external URLs if permitted by CORS
    if (!imageUrl.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }

    setIsLoading(true);
    
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setIsLoading(false);
      setCorsError(false);
    };

    img.onerror = () => {
      // If anonymous failed, try without anonymous (it will draw but be tainted)
      if (!imageUrl.startsWith("data:") && img.crossOrigin === "anonymous") {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          imageRef.current = fallbackImg;
          setImageLoaded(true);
          setIsLoading(false);
          setCorsError(true); // Flag CORS issue to show warning to user
        };
        fallbackImg.onerror = () => {
          setIsLoading(false);
          alert("Não foi possível carregar a imagem desta URL. Verifique o link ou envie uma foto local.");
        };
        fallbackImg.src = imageUrl;
      } else {
        setIsLoading(false);
        alert("Erro ao carregar imagem.");
      }
    };

    img.src = imageUrl;
  }, [imageUrl]);

  // Main canvas drawing and animation frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || !imageRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Context style
    ctx.fillStyle = "#1e293b"; // slate-800 bg
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Move coordinate origin to center of canvas
    ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw image centered around the origin
    const drawWidth = img.width;
    const drawHeight = img.height;
    
    // Fit image size to canvas initial scale
    const scaleToFitWidth = canvas.width / drawWidth;
    const scaleToFitHeight = canvas.height / drawHeight;
    const initialFitScale = Math.min(scaleToFitWidth, scaleToFitHeight) * 0.9;

    const finalWidth = drawWidth * initialFitScale;
    const finalHeight = drawHeight * initialFitScale;

    ctx.drawImage(img, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);

    ctx.restore();

    // Draw aspect ratio guide box
    ctx.strokeStyle = "#D1A72F"; // brand gold
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);

    const { boxWidth, boxHeight } = getCropBoxDimensions(canvas.width, canvas.height, aspectRatio);
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;

    // Draw dark semi-transparent tint outside the crop box
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)"; // semi-transparent slate-900

    // Top box
    ctx.fillRect(0, 0, canvas.width, boxY);
    // Bottom box
    ctx.fillRect(0, boxY + boxHeight, canvas.width, canvas.height - (boxY + boxHeight));
    // Left box
    ctx.fillRect(0, boxY, boxX, boxHeight);
    // Right box
    ctx.fillRect(boxX + boxWidth, boxY, canvas.width - (boxX + boxWidth), boxHeight);

    // Draw crop border
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Draw subtle grid lines inside crop box
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines
    ctx.beginPath();
    ctx.moveTo(boxX + boxWidth / 3, boxY);
    ctx.lineTo(boxX + boxWidth / 3, boxY + boxHeight);
    ctx.moveTo(boxX + (boxWidth * 2) / 3, boxY);
    ctx.lineTo(boxX + (boxWidth * 2) / 3, boxY + boxHeight);
    // Horizontal grid lines
    ctx.moveTo(boxX, boxY + boxHeight / 3);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight / 3);
    ctx.moveTo(boxX, boxY + (boxHeight * 2) / 3);
    ctx.lineTo(boxX + boxWidth, boxY + (boxHeight * 2) / 3);
    ctx.stroke();

  }, [imageLoaded, scale, rotation, offsetX, offsetY, aspectRatio, imageUrl]);

  // Dimensions of crop guidelines box based on ratio
  const getCropBoxDimensions = (canvasWidth: number, canvasHeight: number, ratio: AspectRatioType) => {
    const padding = 30;
    const maxW = canvasWidth - padding * 2;
    const maxH = canvasHeight - padding * 2;

    let boxWidth = maxW;
    let boxHeight = maxH;

    if (ratio === "1:1") {
      const size = Math.min(maxW, maxH);
      boxWidth = size;
      boxHeight = size;
    } else if (ratio === "4:3") {
      // Portrait look or standard 4:3
      if (maxW / maxH > 4 / 3) {
        boxHeight = maxH;
        boxWidth = (maxH * 4) / 3;
      } else {
        boxWidth = maxW;
        boxHeight = (maxW * 3) / 4;
      }
    } else if (ratio === "16:9") {
      if (maxW / maxH > 16 / 9) {
        boxHeight = maxH;
        boxWidth = (maxH * 16) / 9;
      } else {
        boxWidth = maxW;
        boxHeight = (maxW * 9) / 16;
      }
    }

    return { boxWidth, boxHeight };
  };

  // Mouse / Touch drag handlers for panning the image
  const handleStartDrag = (clientX: number, clientY: number) => {
    if (!imageLoaded) return;
    isDragging.current = true;
    dragStart.current = { x: clientX - offsetX, y: clientY - offsetY };
  };

  const handleDrag = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    setOffsetX(clientX - dragStart.current.x);
    setOffsetY(clientY - dragStart.current.y);
  };

  const handleEndDrag = () => {
    isDragging.current = false;
  };

  // Create high-quality cropped Base64 image
  const handleApplyCrop = () => {
    const originalImg = imageRef.current;
    const canvas = canvasRef.current;
    if (!originalImg || !canvas) return;

    if (corsError) {
      // Warn about CORS restriction on browser security
      const confirmForce = window.confirm(
        "Aviso de Segurança: Esta URL de imagem externa não permite recorte automático direto por restrições do servidor de origem (CORS).\n\nPara prosseguir com o recorte, faça o download desta imagem no seu computador e faça o upload dela pelo botão 'Enviar Foto do PC'."
      );
      if (!confirmForce) return;
    }

    // Determine cropped bounds
    const { boxWidth, boxHeight } = getCropBoxDimensions(canvas.width, canvas.height, aspectRatio);
    
    // Create an offscreen output canvas
    // Let's standardise the sizes: 
    // 1:1 -> 600x600 px
    // 4:3 -> 800x600 px
    // 16:9 -> 800x450 px
    const outputCanvas = document.createElement("canvas");
    let outputWidth = 600;
    let outputHeight = 600;

    if (aspectRatio === "4:3") {
      outputWidth = 800;
      outputHeight = 600;
    } else if (aspectRatio === "16:9") {
      outputWidth = 800;
      outputHeight = 450;
    }

    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    const outCtx = outputCanvas.getContext("2d");
    if (!outCtx) return;

    outCtx.fillStyle = "#ffffff"; // Default background white in case of transparent images
    outCtx.fillRect(0, 0, outputWidth, outputHeight);

    // We need to map the edits on the preview canvas (canvas) directly to the output canvas
    // Preview canvas crop box coordinates:
    const previewBoxX = (canvas.width - boxWidth) / 2;
    const previewBoxY = (canvas.height - boxHeight) / 2;

    outCtx.save();

    // Map centered origin of preview canvas crop box to output center
    outCtx.translate(outputWidth / 2, outputHeight / 2);

    // Apply scale multiplier reflecting the ratio between output crop size and preview crop box size
    const scaleRatio = outputWidth / boxWidth;
    
    // Apply panning offsets relative to scale
    outCtx.scale(scaleRatio, scaleRatio);
    outCtx.translate(offsetX, offsetY);
    
    // Apply rotation
    outCtx.rotate((rotation * Math.PI) / 180);
    // Apply zoom scale
    outCtx.scale(scale, scale);

    // Draw the image centered around output origin
    const drawWidth = originalImg.width;
    const drawHeight = originalImg.height;
    
    const scaleToFitWidth = canvas.width / drawWidth;
    const scaleToFitHeight = canvas.height / drawHeight;
    const initialFitScale = Math.min(scaleToFitWidth, scaleToFitHeight) * 0.9;

    const finalWidth = drawWidth * initialFitScale;
    const finalHeight = drawHeight * initialFitScale;

    outCtx.drawImage(
      originalImg, 
      -finalWidth / 2, 
      -finalHeight / 2, 
      finalWidth, 
      finalHeight
    );

    outCtx.restore();

    try {
      // Export to high-quality compressed image
      const dataUrl = outputCanvas.toDataURL("image/jpeg", 0.9);
      onCropComplete(dataUrl);
      onClose();
    } catch (e) {
      console.error("Failed to crop image on canvas: ", e);
      alert("Erro ao recortar a imagem. Possível restrição de segurança CORS da URL externa. Recomendamos baixar a imagem e fazer o envio local clicando em 'Enviar Foto do PC'.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-[#D1A72F]" />
            <div>
              <h3 className="text-sm font-bold text-slate-200">Ajustar e Recortar Imagem</h3>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[320px]">
                {productName || "Produto"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace */}
        <div className="p-5 flex-grow flex flex-col gap-4">
          
          {/* URL Input & Local Upload Button */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-8">
              <label className="block text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                Endereço da Imagem (URL)
              </label>
              <input
                type="text"
                defaultValue={imageUrl.startsWith("data:") ? "" : imageUrl}
                onBlur={(e) => handleUrlSubmit(e.target.value)}
                placeholder="Insira uma URL de imagem externa..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-[#D1A72F]"
              />
            </div>
            
            <div className="md:col-span-4 self-end">
              <label className="block text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                ou Arquivo do PC
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 cursor-pointer transition">
                <Upload className="h-3.5 w-3.5" />
                <span>Enviar Foto do PC</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* CORS Warning Alert */}
          {corsError && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-200 text-[11px] leading-relaxed">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Restrição CORS detectada:</strong> A URL externa impede o recorte direto por políticas do navegador. 
                Sugerimos <strong className="underline">baixar essa imagem</strong> e usar o botão <strong className="underline">"Enviar Foto do PC"</strong> para editar perfeitamente sem bloqueios.
              </div>
            </div>
          )}

          {/* Editor Area */}
          <div className="flex flex-col items-center justify-center bg-slate-950/50 rounded-xl p-4 border border-slate-800/40 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-2 rounded-xl z-20">
                <RefreshCw className="h-8 w-8 text-[#D1A72F] animate-spin" />
                <span className="text-xs text-slate-300 font-semibold">Carregando imagem...</span>
              </div>
            )}

            {/* Target Aspect Ratio Presets */}
            <div className="flex items-center gap-2 mb-3 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2">Proporção:</span>
              {(["1:1", "4:3", "16:9"] as AspectRatioType[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-1 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${
                    aspectRatio === ratio
                      ? "bg-[#D1A72F] text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {ratio === "1:1" ? "Quadrada (1:1)" : ratio === "4:3" ? "Clássica (4:3)" : "Widescreen (16:9)"}
                </button>
              ))}
            </div>

            {/* Interactive Canvas Container */}
            <div 
              ref={containerRef}
              className="relative overflow-hidden border border-slate-800 bg-slate-950 rounded-lg cursor-move select-none"
              style={{ width: "420px", height: "320px" }}
              onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
              onMouseMove={(e) => handleDrag(e.clientX, e.clientY)}
              onMouseUp={handleEndDrag}
              onMouseLeave={handleEndDrag}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleStartDrag(touch.clientX, touch.clientY);
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                handleDrag(touch.clientX, touch.clientY);
              }}
              onTouchEnd={handleEndDrag}
            >
              <canvas
                ref={canvasRef}
                width={420}
                height={320}
                className="block w-full h-full"
              />

              {/* Indicator Overlay Tip */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-950/80 px-2.5 py-1 rounded-full text-[9px] text-slate-400 font-semibold border border-slate-800 pointer-events-none flex items-center gap-1">
                <Move className="h-2.5 w-2.5" />
                <span>Clique e arraste a imagem para mover</span>
              </div>
            </div>
          </div>

          {/* Controls Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/20 p-4 border border-slate-800/40 rounded-xl">
            
            {/* Zoom Control */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Zoom / Escala</span>
                <span className="font-mono">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-[#D1A72F] h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                <ZoomIn className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotação Ângulo</span>
                <span className="font-mono">{rotation}°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">0°</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-[#D1A72F] h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-slate-500">360°</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setScale(1.0);
              setRotation(0);
              setOffsetX(0);
              setOffsetY(0);
            }}
            className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Resetar Ajustes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={!imageLoaded}
              className="flex items-center gap-1.5 py-2 px-5 bg-[#D1A72F] hover:bg-[#B89020] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-md shadow-amber-500/5 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Aplicar Recorte Uniforme</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
