// utils/capturePreview.ts
export function captureThreePreview(threeCanvas: HTMLCanvasElement): string {
  return threeCanvas.toDataURL("image/png"); // Base64 PNG
}
