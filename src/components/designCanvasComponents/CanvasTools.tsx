// src/components/designCanvasComponents/CanvasTools.tsx
import * as fabric from "fabric";

/** internal types */
type ToolName = "brush" | "eraser" | null;
type AnyCanvas = fabric.Canvas & {
  _activeTool?: ToolName;
  _brushColor?: string;
  _brushSize?: number;
  _eraserSize?: number;
};

/* ---------- basic shapes/text ---------- */
export function addText(canvas: fabric.Canvas) {
  const text = new fabric.Textbox("New Text", {
    left: 100,
    top: 100,
    fontSize: 20,
    fill: "#000",
    erasable: true,
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.requestRenderAll();
}

export function addRectangle(canvas: fabric.Canvas) {
  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    fill: "red",
    width: 100,
    height: 100,
    erasable: true,
  });
  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
}

export function addCircle(canvas: fabric.Canvas) {
  const circle = new fabric.Circle({
    left: 150,
    top: 150,
    radius: 50,
    fill: "blue",
    erasable: true,
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
}

export function addLine(canvas: fabric.Canvas) {
  const line = new fabric.Line([50, 100, 200, 100], {
    stroke: "black",
    strokeWidth: 2,
    erasable: true,
  });
  canvas.add(line);
  canvas.setActiveObject(line);
  canvas.requestRenderAll();
}

/* ---------- drawing helpers ---------- */
export function disableDrawingMode(canvas: fabric.Canvas) {
  const c = canvas as AnyCanvas;
  c.isDrawingMode = false;
  c._activeTool = null;
  c.selection = true;
  c.defaultCursor = "default";
  if ((canvas as any).discardActiveObject) canvas.discardActiveObject();
  canvas.requestRenderAll();
}

export function addBrush(canvas: fabric.Canvas, color?: string, width?: number) {
  const c = canvas as AnyCanvas;
  if (c._activeTool === "brush") {
    disableDrawingMode(canvas);
    return;
  }

  const PencilBrush = (fabric as any).PencilBrush ?? (fabric as any).Brush;
  const brush = new PencilBrush(canvas);

  const chosenColor = color ?? c._brushColor ?? "#000000";
  const chosenWidth =
    typeof width === "number"
      ? width
      : typeof c._brushSize === "number"
      ? c._brushSize
      : 3;

  brush.width = chosenWidth;
  (brush as any).color = chosenColor;

  canvas.freeDrawingBrush = brush;
  c.isDrawingMode = true;
  c._activeTool = "brush";
  c._brushColor = chosenColor;
  c._brushSize = chosenWidth;
  c.selection = false;
  c.defaultCursor = "crosshair";
  if ((canvas as any).discardActiveObject) canvas.discardActiveObject();
  canvas.requestRenderAll();
}

export function setBrushColor(canvas: fabric.Canvas, color: string) {
  const c = canvas as AnyCanvas;
  c._brushColor = color;
  const brush = (canvas as any).freeDrawingBrush;
  if (brush) (brush as any).color = color;
}

export function setBrushSize(canvas: fabric.Canvas, size: number) {
  const c = canvas as AnyCanvas;
  c._brushSize = size;
  const brush = (canvas as any).freeDrawingBrush;
  if (brush) brush.width = size;
}

/* ---------- eraser ---------- */
export function addEraser(canvas: fabric.Canvas, size: number = 20) {
  const c = canvas as AnyCanvas;

  if (c._activeTool === "eraser") {
    disableDrawingMode(canvas);
    return;
  }

  const chosenSize = typeof c._eraserSize === "number" ? c._eraserSize : size;
  c._eraserSize = chosenSize;

  // ✅ Use Fabric’s built-in EraserBrush
  const EraserBrush = (fabric as any).EraserBrush;
  if (EraserBrush) {
    const eraser = new EraserBrush(canvas);
    eraser.width = chosenSize;
    canvas.freeDrawingBrush = eraser;
  }

  c.isDrawingMode = true;
  c._activeTool = "eraser";
  c.selection = false;
  c.defaultCursor = "crosshair";

  if ((canvas as any).discardActiveObject) {
    canvas.discardActiveObject();
  }
  canvas.requestRenderAll();
}

export function setEraserSize(canvas: fabric.Canvas, size: number) {
  const c = canvas as AnyCanvas;
  c._eraserSize = size;
  const brush = (canvas as any).freeDrawingBrush;
  if (brush) brush.width = size;
}

/* ---------- freeform ---------- */
export function addFreeform(canvas: fabric.Canvas) {
  const path = new fabric.Path("M 0 0 Q 50 100 100 0 T 200 0", {
    left: 100,
    top: 200,
    stroke: "green",
    fill: "",
    strokeWidth: 2,
    erasable: true,
  });
  canvas.add(path);
  canvas.setActiveObject(path);
  canvas.requestRenderAll();
}

/* ---------- image picker ---------- */
// src/components/designCanvasComponents/CanvasTools.tsx

/** compress image files to base64 with size limits */
export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;

      // Scale proportionally
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = width * scale;
        height = height * scale;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG base64
      let dataUrl = canvas.toDataURL("image/jpeg", quality);

      // If still too large, reduce quality iteratively
      let q = quality;
      while (dataUrl.length > 700_000 && q > 0.3) {
        q -= 0.1;
        dataUrl = canvas.toDataURL("image/jpeg", q);
      }

      resolve(dataUrl);
    };
  });
}

/** Add image with automatic compression */
export async function addImage(canvas: fabric.Canvas) {
  if (typeof document === "undefined") return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";

  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      document.body.removeChild(input);
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.7);

      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.src = compressedDataUrl;

      imgEl.onload = () => {
        const imgInstance = new fabric.Image(imgEl, {
          selectable: true,
          erasable: true,
        });

        const cw = canvas.getWidth() || 500;
        const ch = canvas.getHeight() || 500;
        const scale = Math.min(
          1,
          Math.min(
            (cw * 0.6) / (imgEl.width || 1),
            (ch * 0.6) / (imgEl.height || 1)
          )
        );
        imgInstance.scale(scale || 0.6);

        try {
          canvas.add(imgInstance);
          if ((canvas as any).centerObject) {
            (canvas as any).centerObject(imgInstance);
          } else {
            imgInstance.set({
              left: (cw - (imgEl.width || 100) * (imgInstance.scaleX || 1)) / 2,
              top: (ch - (imgEl.height || 100) * (imgInstance.scaleY || 1)) / 2,
            });
          }
        } catch {
          imgInstance.set({ left: 50, top: 50 });
          canvas.add(imgInstance);
        }

        canvas.setActiveObject(imgInstance);
        canvas.requestRenderAll();
        document.body.removeChild(input);
      };
    } catch (err) {
      console.error("Failed to compress image", err);
      document.body.removeChild(input);
    }
  };

  document.body.appendChild(input);
  input.click();
}

