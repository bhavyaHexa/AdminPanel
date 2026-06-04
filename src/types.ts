export interface PriceList {
  id?: string;
  widthId: string;
  isDiamonds: boolean;
  carat: string;
  biggerSizePrice: string;
  smallerSizePrice: string;
}

export interface Asset3D {
  id?: string;
  model_url: string;
  version: string;
  widthId: string;
}

export interface Texture {
  id?: string;
  aoGold?: string;
  aoSilver?: string;
  aoEngrave?: string;
  widthId: string;
}

export interface Width {
  id?: string;
  value: string;
  colorId: string;
  asset3D: Asset3D | null;
  texture: Texture | null;
  priceLists: PriceList[];
}

export interface Color {
  id?: string;
  name: string;
  hex: string;
  description: string | null;
  sku: string;
  image?: string | null;
  modelId: string;
  widths: Width[];
}

export interface Model {
  id?: string;
  name: string;
  description: string | null;
  image?: string | null;
  preview_url?: string | null;
  base_metal_color: string;
  finishing_metal_color: string;
  engraving_mesh_color: string;
  colorChange: string[];
  isDiamonds: boolean;
  collectionId: string;
  createdAt?: string;
  updatedAt?: string;
  colors: Color[];
}

export interface Collection {
  id?: string;
  name: string;
  image?: string;
  preview_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
  models: Model[];
}
