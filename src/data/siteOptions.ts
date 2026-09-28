export const provinces = ["Central", "Eastern", "North Central", "Northern", "North Western", "Sabaragamuwa", "Southern", "Uva", "Western"];

export const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

export const historicalPeriods = [
  "PREHISTORIC", "PROTOHISTORIC", "ANURADHAPURA", "POLONNARUWA", "DAMBADENIYA", "YAPAHUWA", "KURUNEGALA", "GAMPOLA", "KOTTE", "KANDYAN", "COLONIAL", "MODERN",
];

export const siteTypes = [
  "TEMPLE", "STUPA", "MONASTERY", "FORTRESS", "PALACE", "CAVE", "CEMETERY", "INSCRIPTION", "RESERVOIR", "MONUMENT", "SETTLEMENT", "OTHER",
];

const sriLankaOutline = [
  [9.83, 80.22], [9.58, 80.55], [9.28, 80.82], [8.93, 81], [8.57, 81.24], [8.3, 81.33], [7.95, 81.43], [7.72, 81.7], [7.3, 81.84], [6.87, 81.84], [6.55, 81.63], [6.22, 81.32], [6.12, 81.12], [6.02, 80.8], [5.92, 80.59], [5.95, 80.44], [6.03, 80.22], [6.28, 80.04], [6.47, 79.98], [6.72, 79.9], [6.93, 79.84], [7.21, 79.83], [7.59, 79.79], [7.95, 79.7], [8.23, 79.72], [8.55, 79.66], [8.78, 79.71], [8.95, 79.85], [9.05, 79.69], [9.13, 79.92], [9.32, 80], [9.55, 80.08], [9.63, 80.28], [9.5, 80.4], [9.61, 80.16], [9.61, 79.92], [9.68, 79.78], [9.83, 80.03],
];

export function isOnSriLanka(lat: number, lng: number) {
  let inside = false;
  for (let i = 0, j = sriLankaOutline.length - 1; i < sriLankaOutline.length; j = i++) {
    const [yi, xi] = sriLankaOutline[i];
    const [yj, xj] = sriLankaOutline[j];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function optionLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}