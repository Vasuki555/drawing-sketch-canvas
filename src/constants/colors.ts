// Color constants for the drawing app

// 25+ solid colors as required
export const SOLID_COLORS = [
  // Basic colors
  '#000000', // Black
  '#FFFFFF', // White
  '#808080', // Gray
  '#C0C0C0', // Light Gray
  '#404040', // Dark Gray
  
  // Red family
  '#FF0000', // Red
  '#FF4500', // Orange Red
  '#DC143C', // Crimson
  '#B22222', // Fire Brick
  '#8B0000', // Dark Red
  
  // Orange/Yellow family
  '#FFA500', // Orange
  '#FFD700', // Gold
  '#FFFF00', // Yellow
  '#ADFF2F', // Green Yellow
  '#F0E68C', // Khaki
  
  // Green family
  '#00FF00', // Lime
  '#32CD32', // Lime Green
  '#008000', // Green
  '#006400', // Dark Green
  '#228B22', // Forest Green
  
  // Blue family
  '#0000FF', // Blue
  '#00BFFF', // Deep Sky Blue
  '#87CEEB', // Sky Blue
  '#4169E1', // Royal Blue
  '#000080', // Navy
  
  // Purple/Pink family
  '#800080', // Purple
  '#9400D3', // Violet
  '#4B0082', // Indigo
  '#FF69B4', // Hot Pink
  '#FF1493', // Deep Pink
  
  // Additional colors
  '#00FFFF', // Cyan
  '#00FF7F', // Spring Green
  '#8A2BE2', // Blue Violet
  '#A0522D', // Sienna
  '#D2691E', // Chocolate
];

// Gradient colors (linear gradients)
export const GRADIENT_COLORS = [
  // Sunset gradients
  { id: 'sunset1', colors: ['#FF6B6B', '#FFE66D'], name: 'Sunset' },
  { id: 'sunset2', colors: ['#FF8A80', '#FF5722'], name: 'Orange Sunset' },
  { id: 'sunset3', colors: ['#FFAB91', '#FF7043'], name: 'Peach Sunset' },
  
  // Ocean gradients
  { id: 'ocean1', colors: ['#4FC3F7', '#29B6F6'], name: 'Ocean Blue' },
  { id: 'ocean2', colors: ['#81C784', '#66BB6A'], name: 'Ocean Green' },
  { id: 'ocean3', colors: ['#4DD0E1', '#26C6DA'], name: 'Tropical' },
  
  // Purple gradients
  { id: 'purple1', colors: ['#BA68C8', '#AB47BC'], name: 'Purple Dream' },
  { id: 'purple2', colors: ['#9C27B0', '#673AB7'], name: 'Deep Purple' },
  { id: 'purple3', colors: ['#E1BEE7', '#CE93D8'], name: 'Light Purple' },
  
  // Rainbow gradients
  { id: 'rainbow1', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], name: 'Rainbow' },
  { id: 'rainbow2', colors: ['#96CEB4', '#FFEAA7', '#DDA0DD'], name: 'Pastel Rainbow' },
  
  // Monochrome gradients
  { id: 'mono1', colors: ['#2C3E50', '#34495E'], name: 'Dark Gray' },
  { id: 'mono2', colors: ['#BDC3C7', '#95A5A6'], name: 'Light Gray' },
  
  // Fire gradients
  { id: 'fire1', colors: ['#FF4757', '#FF3838'], name: 'Fire Red' },
  { id: 'fire2', colors: ['#FFA726', '#FF7043'], name: 'Fire Orange' },
];

// Background colors
export const BACKGROUND_COLORS = [
  '#FFFFFF', // White
  '#F8F9FA', // Light Gray
  '#F5F5F5', // White Smoke
  '#E9ECEF', // Light Gray 2
  '#DEE2E6', // Light Gray 3
  '#FFF8DC', // Cornsilk
  '#F0F8FF', // Alice Blue
  '#F5FFFA', // Mint Cream
  '#FFFACD', // Lemon Chiffon
  '#FFE4E1', // Misty Rose
  '#E6E6FA', // Lavender
  '#F0FFFF', // Azure
];

// Default colors
export const DEFAULT_STROKE_COLOR = '#000000';
export const DEFAULT_FILL_COLOR = '#FF0000';
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
export const DEFAULT_TEXT_COLOR = '#000000';