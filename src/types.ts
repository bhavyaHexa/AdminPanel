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
  normalBase?: string;
  normalFinishing?: string;
  aoNoDiamond?: string;
  aoNoDiamondSilver?: string;
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

// Authentication Payloads & Responses
export interface SignupPayload {
  name: string;
  email: string;
  password?: string;
}

export interface ConfirmSignupPayload {
  email: string;
  code: string;
}

export interface ResendCodePayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ConfirmForgotPasswordPayload {
  email: string;
  code: string;
  newPassword?: string;
}

export interface ChangePasswordPayload {
  oldPassword?: string;
  newPassword?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  message?: string;
  accessToken?: string;
  token?: string; // fallback
  jwtToken?: string; // fallback
  user?: User;
}

