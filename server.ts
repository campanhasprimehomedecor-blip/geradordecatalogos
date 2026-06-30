import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { CatalogConfig, Product } from "./src/types";
import { generateSingleFileHTML } from "./src/utils/htmlGenerator";

const DATA_FILE = path.join(process.cwd(), "catalog-data.json");

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
    imageUrl: "https://picsum.photos/id/684/600/600",
    linkUrl: "https://www.primehomedecor.com.br/manta-verde-copa"
  },
  {
    id: "p2",
    name: "Kit 2 Almofadas Veludo Ouro Gold",
    price: "R$ 119,90",
    imageUrl: "https://picsum.photos/id/1069/600/600",
    linkUrl: "https://www.primehomedecor.com.br/kit-almofadas-gold"
  },
  {
    id: "p3",
    name: "Bandeja de Servir Retangular Dourada Luxo",
    price: "R$ 249,90",
    imageUrl: "https://picsum.photos/id/488/600/600",
    linkUrl: "https://www.primehomedecor.com.br/bandeja-dourada"
  },
  {
    id: "p4",
    name: "Conjunto de Taças de Vidro Verde (6 unidades)",
    price: "R$ 199,90",
    imageUrl: "https://picsum.photos/id/429/600/600",
    linkUrl: "https://www.primehomedecor.com.br/tacas-verdes"
  },
  {
    id: "p5",
    name: "Bowl de Cerâmica Rústico Copa Ouro",
    price: "R$ 59,90",
    imageUrl: "https://picsum.photos/id/326/600/600",
    linkUrl: "https://www.primehomedecor.com.br/bowl-ceramica"
  },
  {
    id: "p6",
    name: "Tapete Soft Cozy Off-White Prime",
    price: "R$ 349,90",
    imageUrl: "https://picsum.photos/id/20/600/600",
    linkUrl: "https://www.primehomedecor.com.br/tapete-offwhite"
  },
  {
    id: "p7",
    name: "Luminária de Mesa Industrial Cobre Gold",
    price: "R$ 159,90",
    imageUrl: "https://picsum.photos/id/345/600/600",
    linkUrl: "https://www.primehomedecor.com.br/luminaria-mesa"
  },
  {
    id: "p8",
    name: "Vaso Decorativo de Vidro Verde Imperial",
    price: "R$ 129,90",
    imageUrl: "https://picsum.photos/id/1062/600/600",
    linkUrl: "https://www.primehomedecor.com.br/vaso-verde"
  }
];

function readCatalogData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading catalog data, using initial data.", error);
  }
  return { config: INITIAL_CONFIG, products: INITIAL_PRODUCTS };
}

function saveCatalogData(data: { config: CatalogConfig; products: Product[] }) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving catalog data", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch saved state
  app.get("/api/catalog", (req, res) => {
    const data = readCatalogData();
    res.json(data);
  });

  // API Route to save state
  app.post("/api/catalog", (req, res) => {
    const { config, products } = req.body;
    if (!config || !products) {
      res.status(400).json({ error: "Dados inválidos." });
      return;
    }
    saveCatalogData({ config, products });
    res.json({ success: true });
  });

  // Public customer view of the pure HTML catalog
  app.get("/catalog", (req, res) => {
    const { config, products } = readCatalogData();
    const html = generateSingleFileHTML(config, products);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  // Vite dev middleware or Production static server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
