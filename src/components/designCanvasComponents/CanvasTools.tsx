import * as fabric from "fabric";
import FloodFill from "q-floodfill";

/** internal types */
type ToolName = "brush" | "eraser" | "bucket" | "eyedropper" | null;
type AnyCanvas = fabric.Canvas & {
  _activeTool?: ToolName;
  _brushColor?: string;
  _brushSize?: number;
  _eraserSize?: number;
  _defaultColor?: string; // ✅ global default color
  _bucketHandler?: (opts: any) => void;
  _eyedropperHandler?: (opts: any) => void;

  // ✅ add Fabric method typings
  sendToBack?: (obj: fabric.Object) => void;
};

/* ---------- global color helpers ---------- */
export function getDefaultColor(canvas: fabric.Canvas): string {
  return (canvas as AnyCanvas)._defaultColor ?? "#ff0000"; // ✅ default red
}

export function setDefaultColor(canvas: fabric.Canvas, color: string) {
  const c = canvas as AnyCanvas;
  c._defaultColor = color;
  c._brushColor = color;
  if (canvas.freeDrawingBrush) {
    (canvas.freeDrawingBrush as any).color = color;
  }
}

/* ---------- detect & set object color ---------- */
export function getObjectColor(obj: fabric.Object): string | undefined {
  if ("fill" in obj && obj.fill && typeof obj.fill === "string") {
    return obj.fill;
  }
  if ("stroke" in obj && obj.stroke && typeof obj.stroke === "string") {
    return obj.stroke;
  }
  return undefined;
}

export function setObjectColor(obj: fabric.Object, color: string) {
  if (obj.type === "line" || obj.type === "path") {
    obj.set("stroke", color);
  } else {
    obj.set("fill", color);
  }
}

/* ---------- basic shapes/text ---------- */
export function addText(
  canvas: fabric.Canvas,
  textString: string = "New Text",
  fontSize: number = 20,
  color?: string
) {
  const text = new fabric.Textbox(textString, {
    left: 100,
    top: 100,
    fontSize,
    fill: color ?? getDefaultColor(canvas),
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
    fill: getDefaultColor(canvas),
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
    fill: getDefaultColor(canvas),
    erasable: true,
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
}

export function addLine(canvas: fabric.Canvas) {
  const line = new fabric.Line([50, 100, 200, 100], {
    stroke: getDefaultColor(canvas),
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

  // Disable drawing
  c.isDrawingMode = false;
  c.selection = true;
  c.defaultCursor = "default";
  c._activeTool = null;

  // Remove flood fill listeners
  if (c._bucketHandler) {
    canvas.off("mouse:down", c._bucketHandler as any);
    c._bucketHandler = undefined;
  }

  // Remove eyedropper listeners
  if (c._eyedropperHandler) {
    canvas.off("mouse:down", c._eyedropperHandler as any);
    c._eyedropperHandler = undefined;
  }

  // Reset cursor
  (canvas as any).discardActiveObject?.();
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

  const chosenColor = color ?? c._brushColor ?? getDefaultColor(canvas);
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
  (canvas as any).discardActiveObject?.();
  canvas.requestRenderAll();
}

export function setBrushColor(
  canvas: fabric.Canvas,
  color: string,
  size?: number
) {
  const c = canvas as AnyCanvas;
  c._brushColor = color;
  const brush = (canvas as any).freeDrawingBrush;
  if (brush) {
    (brush as any).color = color;
    if (typeof size === "number") {
      brush.width = size;
      c._brushSize = size;
    }
  }
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

  // ✅ Plain white brush instead of transparent erasing
  const PencilBrush = (fabric as any).PencilBrush ?? (fabric as any).Brush;
  const whiteBrush = new PencilBrush(canvas);
  whiteBrush.width = chosenSize;
  (whiteBrush as any).color = "#f5f5f5"; // plain white

  canvas.freeDrawingBrush = whiteBrush;

  c.isDrawingMode = true;
  c._activeTool = "eraser";
  c.selection = false;
  c.defaultCursor = "crosshair";

  (canvas as any).discardActiveObject?.();
  canvas.requestRenderAll();
}


export function setEraserSize(canvas: fabric.Canvas, size: number) {
  const c = canvas as AnyCanvas;
  c._eraserSize = size;

  const brush = (canvas as any).freeDrawingBrush;
  if (brush) {
    if ("width" in brush) {
      brush.width = size;
    } else if ("brushWidth" in brush) {
      brush.brushWidth = size;
    }
  }

  canvas.requestRenderAll();
}

/* ---------- freeform ---------- */
export function addFreeform(canvas: fabric.Canvas) {
  const path = new fabric.Path("M 0 0 Q 50 100 100 0 T 200 0", {
    left: 100,
    top: 200,
    stroke: getDefaultColor(canvas),
    fill: "",
    strokeWidth: 2,
    erasable: true,
  });
  canvas.add(path);
  canvas.setActiveObject(path);
  canvas.requestRenderAll();
}

/* ---------- bucket fill ---------- */
/* ---------- bucket fill ---------- */
export function addBucketTool(canvas: fabric.Canvas, color?: string) {
  const c = canvas as AnyCanvas;
  disableDrawingMode(canvas);
  c._activeTool = "bucket";
  c.defaultCursor = "cell";

  const chosenColor = color ?? "#ff0000";

  const handleClick = (opts: any) => {
    const pointer = canvas.getPointer(opts.e, true);
    const x = Math.floor(pointer.x);
    const y = Math.floor(pointer.y);

    // draw current canvas content into offscreen raster
    const raster = document.createElement("canvas");
    raster.width = canvas.getWidth();
    raster.height = canvas.getHeight();
    const ctx = raster.getContext("2d")!;
    canvas.renderAll();
    ctx.drawImage(canvas.lowerCanvasEl, 0, 0);
    ctx.drawImage(canvas.upperCanvasEl, 0, 0);

    // flood fill into offscreen imageData
    const imageData = ctx.getImageData(0, 0, raster.width, raster.height);
    const flood = new FloodFill(imageData);
    flood.fill(chosenColor, x, y, 0);
    ctx.putImageData(flood.imageData, 0, 0);

    // create <img> so fabric.Image has proper HTMLImageElement
    const filledImg = new Image();
    filledImg.src = raster.toDataURL("image/png");
    filledImg.onload = () => {
      const bucketImage = new fabric.Image(filledImg, {
        selectable: false,
        evented: true,
        hasControls: true,
        hasBorders: true,
        erasable: true,
      });

      // Add to Fabric canvas
      canvas.add(bucketImage);

      // send behind everything else
      (canvas as AnyCanvas).sendToBack?.(bucketImage);

      canvas.setActiveObject(bucketImage);
      canvas.requestRenderAll();
    };
  };

  canvas.off("mouse:down", c._bucketHandler as any);
  c._bucketHandler = handleClick;
  canvas.on("mouse:down", handleClick);
}


/* ---------- eyedropper ---------- */
function extractColorFromTarget(target: fabric.Object): string {
  const color = getObjectColor(target);
  if (color) return color;

  if (target.type === "image" && target instanceof fabric.Image) {
    try {
      const el = target.getElement() as HTMLImageElement;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = el.width;
      canvas.height = el.height;
      ctx.drawImage(el, 0, 0);
      const imgData = ctx.getImageData(
        Math.floor(el.width / 2),
        Math.floor(el.height / 2),
        1,
        1
      ).data;
      return `rgb(${imgData[0]}, ${imgData[1]}, ${imgData[2]})`;
    } catch {
      return "#000000";
    }
  }
  return "#000000";
}

export function addEyedropperTool(
  canvas: fabric.Canvas,
  onColorPicked: (color: string) => void
) {
  const c = canvas as AnyCanvas;
  disableDrawingMode(canvas);
  c._activeTool = "eyedropper";
  c.defaultCursor = "crosshair";
  canvas.selection = false;
  canvas.forEachObject((obj) => (obj.selectable = false));

  const handleClick = (opts: any) => {
    const target = opts?.target as fabric.Object | undefined;
    if (target) {
      const pickedColor = extractColorFromTarget(target);
      setDefaultColor(canvas, pickedColor);
      setBrushColor(canvas, pickedColor);

      try {
        onColorPicked(pickedColor);
      } catch {}

      canvas.off("mouse:down", handleClick);
      canvas.selection = true;
      canvas.forEachObject((obj) => (obj.selectable = true));
      c._activeTool = null;
      c.defaultCursor = "default";
    }
  };

  

  canvas.off("mouse:down", c._eyedropperHandler as any);
  c._eyedropperHandler = handleClick;
  canvas.on("mouse:down", handleClick);
}




export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7,
  skipThreshold = 200_000
) {
  return new Promise<string>((resolve) => {
    if (file.size <= skipThreshold) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

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

      const isPng = file.type === "image/png";
      let dataUrl: string;

      if (isPng) {
        dataUrl = canvas.toDataURL("image/png");
      } else {
        dataUrl = canvas.toDataURL("image/jpeg", quality);

        let q = quality;
        while (dataUrl.length > 700_000 && q > 0.3) {
          q -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }
      }

      resolve(dataUrl);
    };
  });
}

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
              left:
                (cw - (imgEl.width || 100) * (imgInstance.scaleX || 1)) / 2,
              top:
                (ch - (imgEl.height || 100) * (imgInstance.scaleY || 1)) / 2,
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

