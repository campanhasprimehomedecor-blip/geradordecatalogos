export interface Product {
  id: string;
  name: string;
  price: string;
  installmentPrice?: string; // Optional installment price (e.g. "ou 10x de R$ 29,90")
  imageUrl: string;
  linkUrl: string;
}

export interface CatalogConfig {
  logoUrl: string;
  bannerUrl: string;
  couponCode: string;
  title: string;
  subtitle: string;
  footerText: string;
  backgroundColor?: string;
  // Font styling
  fontFamily?: string;
  textColor?: string;
  subtitleColor?: string;
  textAlignment?: "left" | "center" | "right";
  // Element colors
  headerBgColor?: string;
  couponBgColor?: string;
  couponTextColor?: string;
  couponBorderColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  cardBgColor?: string;
  cardTextColor?: string;
  productSectionBgColor?: string;
  couponText?: string;
}
