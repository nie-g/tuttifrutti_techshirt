import * as fabric from "fabric";
import FloodFill from "q-floodfill";

/** internal types */
type ToolName = "brush" | "eraser" | "bucket" | "eyedropper" | null;
type AnyCanvas = fabric.Canvas & {
  _activeTool?: ToolName;
  _brushColor?: string;
  _brushSize?: number;
  _eraserSize?: number;
  _defaultColor?: string;
  _bucketHandler?: (opts: any) => void;
  _eyedropperHandler?: (opts: any) => void;
  sendToBack?: (obj: fabric.Object) => void;
  _bucketImage?: fabric.Image;
};

/* ---------- global color helpers ---------- */
export function getDefaultColor(canvas: fabric.Canvas): string {
  return (canvas as AnyCanvas)._defaultColor ?? "#ff0000";
}

export function setDefaultColor(canvas: fabric.Canvas, color: string) {
  const c = canvas as AnyCanvas;
  c._defaultColor = color;
  c._brushColor = color;
  if (canvas.freeDrawingBrush) (canvas.freeDrawingBrush as any).color = color;
}

/* ---------- detect & set object color ---------- */
export function getObjectColor(obj: fabric.Object): string | undefined {
  if ("fill" in obj && obj.fill && typeof obj.fill === "string") return obj.fill;
  if ("stroke" in obj && obj.stroke && typeof obj.stroke === "string") return obj.stroke;
  return undefined;
}

export function setObjectColor(obj: fabric.Object, color: string) {
  if (obj.type === "line" || obj.type === "path") obj.set("stroke", color);
  else obj.set("fill", color);
}


/* ---------- HELPER: FLATTEN CANVAS ---------- */
async function flattenCanvasBeforeAdding(canvas: fabric.Canvas) {
  return new Promise<fabric.Image>((resolve) => {
    // Disable selection on active object
    if (canvas.getActiveObject()) {
      canvas.discardActiveObject();
    }

    // ✅ Reset zoom and pan before rasterizing
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    // Create new raster canvas
    const raster = document.createElement("canvas");
    raster.width = width;
    raster.height = height;
    const ctx = raster.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);

    // ✅ Always use logical pixel draw
    ctx.drawImage(canvas.lowerCanvasEl, 0, 0, width, height);
    ctx.drawImage(canvas.upperCanvasEl, 0, 0, width, height);

    // Create flattened Fabric.Image
    const imgEl = new Image();
    imgEl.onload = () => {
      const flattenedImage = new fabric.Image(imgEl, {
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        selectable: false,
        hasControls: true,
        hasBorders: true,
        erasable: true,
      });

      // ✅ Match image logical dimensions to canvas
      flattenedImage.set({
        width,
        height,
      });

      // Clear everything and re-add flattened version
      canvas.clear();
      canvas.add(flattenedImage);

      // ✅ Reset zoom *again* to avoid compounding transforms
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.requestRenderAll();

      resolve(flattenedImage);
    };

    imgEl.src = raster.toDataURL("image/png");
  });
}


/* ---------- basic shapes/text ---------- */
export async function addText(canvas: fabric.Canvas, textString = "New Text", fontSize = 20, color?: string) {
  await flattenCanvasBeforeAdding(canvas);

  const text = new fabric.Textbox(textString, {
    left: 100,
    top: 100,
    fontSize,
    fill: color ?? getDefaultColor(canvas),
    erasable: true,
  });

  canvas.add(text);
  canvas.selection = true;
  canvas.skipTargetFind = false;
  canvas.setActiveObject(text);
  canvas.requestRenderAll();
}

export async function addRectangle(canvas: fabric.Canvas) {
  await flattenCanvasBeforeAdding(canvas);

  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    fill: getDefaultColor(canvas),
    width: 100,
    height: 100,
    erasable: true,
  });

  canvas.add(rect);
    canvas.selection = true;
  canvas.skipTargetFind = false;
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
}

export async function addCircle(canvas: fabric.Canvas) {
  await flattenCanvasBeforeAdding(canvas);

  const circle = new fabric.Circle({
    left: 150,
    top: 150,
    radius: 50,
    fill: getDefaultColor(canvas),
    erasable: true,
  });

  canvas.add(circle);
    canvas.selection = true;
  canvas.skipTargetFind = false;
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
}

export async function addLine(canvas: fabric.Canvas) {
  await flattenCanvasBeforeAdding(canvas);

  const line = new fabric.Line([50, 100, 200, 100], {
    stroke: getDefaultColor(canvas),
    strokeWidth: 2,
    erasable: true,
  });

  canvas.add(line);
  canvas.selection = true;
  canvas.skipTargetFind = false;
  canvas.setActiveObject(line);
  canvas.requestRenderAll();
}

export async function addFreeform(canvas: fabric.Canvas) {
  await flattenCanvasBeforeAdding(canvas);

  const path = new fabric.Path("M 0 0 Q 50 100 100 0 T 200 0", {
    left: 100,
    top: 200,
    stroke: getDefaultColor(canvas),
    fill: "",
    strokeWidth: 2,
    erasable: true,
  });

  canvas.add(path);
  canvas.selection = true;
  canvas.skipTargetFind = false;
  canvas.setActiveObject(path);
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

/* ---------- brush ---------- */
export async function addBrush(canvas: fabric.Canvas, color?: string, width?: number) {
  const c = canvas as AnyCanvas;

  if (c._activeTool === "brush") {
    disableDrawingMode(canvas);
    return;
  }

  // Flatten canvas before starting brush
  await flattenCanvasBeforeAdding(canvas);

  const brush = new fabric.PencilBrush(canvas); // directly use PencilBrush
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

export function setBrushColor(canvas: fabric.Canvas, color: string, size?: number) {
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

  canvas.requestRenderAll();
}

/* ---------- eraser ---------- */
export async function addEraser(canvas: fabric.Canvas, size: number = 20) {
  const c = canvas as AnyCanvas;

  if (c._activeTool === "eraser") {
    disableDrawingMode(canvas);
    return;
  }

  // Flatten canvas before starting eraser
  await flattenCanvasBeforeAdding(canvas);

  const chosenSize = typeof c._eraserSize === "number" ? c._eraserSize : size;
  c._eraserSize = chosenSize;

  const whiteBrush = new fabric.PencilBrush(canvas);
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

    // Step 1: Render current canvas into offscreen canvas
    const raster = document.createElement("canvas");
    raster.width = canvas.getWidth();
    raster.height = canvas.getHeight();
    const ctx = raster.getContext("2d")!;
    canvas.renderAll();
    ctx.drawImage(canvas.lowerCanvasEl, 0, 0);
    ctx.drawImage(canvas.upperCanvasEl, 0, 0);

    // Step 2: Apply flood fill to offscreen imageData
    const imageData = ctx.getImageData(0, 0, raster.width, raster.height);
    const flood = new FloodFill(imageData);
    flood.fill(chosenColor, x, y, 0);
    ctx.putImageData(flood.imageData, 0, 0);

    // Step 3: Create a Fabric Image from the flood-filled raster
    const filledImg = new Image();
    filledImg.src = raster.toDataURL("image/png");
    filledImg.onload = () => {
      // Step 4: Clear the canvas **before** adding the new bucket image
      canvas.clear();

      const bucketImage = new fabric.Image(filledImg, {
        selectable: false,   // editable/movable
        evented: true,
        hasControls: true,
        hasBorders: true,
        erasable: true,
      });

      // Step 5: Track the bucket image so it can be removed/replaced later
      c._bucketImage = bucketImage;

      // Step 6: Add the new bucket image
      canvas.add(bucketImage);

      // Step 7: Send it to back so future objects can be drawn on top
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

function pickVisibleColor(canvas: fabric.Canvas, x: number, y: number): string {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.getWidth();
  tempCanvas.height = canvas.getHeight();
  const ctx = tempCanvas.getContext("2d")!;

  // Render everything into it
  canvas.renderAll();
  ctx.drawImage(canvas.lowerCanvasEl, 0, 0);
  ctx.drawImage(canvas.upperCanvasEl, 0, 0);

  // Sample pixel
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
}

/* ---------- eyedropper (hybrid) ---------- */
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

  const handleClick = async (opts: any) => {
    let pickedColor = "#000000";

    // 1️⃣ Try native EyeDropper API if available
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        pickedColor = result.sRGBHex;
      } catch {
        // Fallback silently if user cancels
      }
    }

    // 2️⃣ Fallback to Fabric pixel sampling if EyeDropper not used
    if (pickedColor === "#000000") {
      const pointer = opts?.pointer || canvas.getPointer(opts.e, true);
      const x = Math.floor(pointer.x);
      const y = Math.floor(pointer.y);
      pickedColor = pickVisibleColor(canvas, x, y);
    }

    // 3️⃣ Update default color and brush
    setDefaultColor(canvas, pickedColor);
    setBrushColor(canvas, pickedColor);

    try {
      onColorPicked(pickedColor);
    } catch {}

    // 4️⃣ Reset canvas state
    canvas.off("mouse:down", handleClick);
   
    canvas.skipTargetFind = false;
    canvas.selection = false;
    c._activeTool = null;
    c.defaultCursor = "default";
  };

  // 5️⃣ Attach handler
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

  await flattenCanvasBeforeAdding(canvas);

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

        canvas.add(imgInstance);
        canvas.selection = true;
        canvas.skipTargetFind = false;
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

export async function addImageFromUrl(canvas: fabric.Canvas, imageUrl: string) {
  await flattenCanvasBeforeAdding(canvas);

  return new Promise<void>((resolve, reject) => {
    const imgEl = new Image();
    imgEl.crossOrigin = "anonymous";
    imgEl.src = imageUrl;

    imgEl.onload = () => {
      const imgInstance = new fabric.Image(imgEl, {
        selectable: true,
        erasable: true,
      });

      const cw = canvas.getWidth() || 500;
      const ch = canvas.getHeight() || 500;
      const scale = Math.min(
        1,
        Math.min((cw * 0.6) / (imgEl.width || 1), (ch * 0.6) / (imgEl.height || 1))
      );
      imgInstance.scale(scale || 0.6);

      canvas.add(imgInstance);
      canvas.selection = true;
      canvas.skipTargetFind = false;
      canvas.setActiveObject(imgInstance);
      canvas.requestRenderAll();
      resolve();
    };

    imgEl.onerror = reject;
  });
}
