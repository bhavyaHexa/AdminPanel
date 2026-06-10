export const API_ROUTES = {
  // Collections
  COLLECTIONS: '/collections',
  GET_ALL_COLLECTIONS: '/collections',
  COLLECTION_BY_ID: (id: string) => `/collections/${id}`,
  UPLOAD_COLLECTION_IMAGE: (id: string) => `/collections/${id}/upload/image`,
  UPLOAD_COLLECTION_PREVIEW: (id: string) => `/collections/${id}/upload/preview`,

  // Models
  MODELS: '/models',
  GET_ALL_MODELS: '/models',
  MODEL_BY_ID: (id: string) => `/models/${id}`,
  UPLOAD_MODEL_IMAGE: (id: string) => `/models/${id}/upload/image`,
  UPLOAD_MODEL_PREVIEW: (id: string) => `/models/${id}/upload/preview`,

  // Colors
  COLORS: '/colors',
  GET_ALL_COLORS: '/colors',
  COLOR_BY_ID: (id: string) => `/colors/${id}`,
  UPLOAD_COLOR_IMAGE: (id: string) => `/colors/${id}/upload/image`,

  // Widths
  WIDTHS: '/widths',
  GET_ALL_WIDTHS: '/widths',
  WIDTH_BY_ID: (id: string) => `/widths/${id}`,

  // Price Lists
  PRICE_LISTS: '/price-lists',
  PRICE_LIST_BY_ID: (id: string) => `/price-lists/${id}`,

  // Assets-3D
  ASSETS_3D: '/assets-3d',
  GET_ALL_ASSETS_3D: '/assets-3d',
  UPLOAD_ASSET_3D_GLB: (widthId: string) => `/assets-3d/width/${widthId}/upload/glb`,
  ASSET_3D_BY_WIDTH: (widthId: string) => `/assets-3d/by-width/${widthId}`,

  // Textures
  TEXTURES: '/textures',
  GET_ALL_TEXTURES: '/textures',
  TEXTURE_BY_WIDTH: (widthId: string) => `/textures/by-width/${widthId}`,
  TEXTURE_BY_ID: (id: string) => `/textures/${id}`,
  UPLOAD_TEXTURE_AO_GOLD: (id: string) => `/textures/${id}/upload/ao-gold`,
  UPLOAD_TEXTURE_AO_SILVER: (id: string) => `/textures/${id}/upload/ao-silver`,
  UPLOAD_TEXTURE_AO_ENGRAVE: (id: string) => `/textures/${id}/upload/ao-engrave`,
  UPLOAD_TEXTURE_NORMAL_BASE: (id: string) => `/textures/${id}/upload/normal-base`,
  UPLOAD_TEXTURE_NORMAL_FINISHING: (id: string) => `/textures/${id}/upload/normal-finishing`,

  // Auth Endpoints
  SIGNUP: '/auth/signup',
  CONFIRM_SIGNUP: '/auth/confirm-signup',
  RESEND_CODE: '/auth/resend-code',
  LOGIN: '/auth/login',
  REFRESH_TOKENS: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  CONFIRM_FORGOT_PASSWORD: '/auth/confirm-forgot-password',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',
  ME: '/auth/me',
};
