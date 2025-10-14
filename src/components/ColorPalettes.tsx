// src/components/ColorPalette.tsx
import React, { useState, useEffect } from "react";
import { Palette, Plus, X } from "lucide-react";

const paletteModes = ["analogic", "monochrome", "complement", "triad", "quad"] as const;

type PaletteMode = (typeof paletteModes)[number];

interface PaletteResult {
  mode: PaletteMode;
  colors: string[];
}

interface ColorPaletteProps {
  newPaletteColors: string[];
  setNewPaletteColors: React.Dispatch<React.SetStateAction<string[]>>;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  newPaletteColors,
  setNewPaletteColors
}) => {
  const [query, setQuery] = useState<string>("");
  const [palettes, setPalettes] = useState<PaletteResult[]>([]);
  const [personalColors, setPersonalColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState<string>("#ffffff");
  const [error, setError] = useState<string>("");
  const [isSearched, setIsSearched] = useState<boolean>(false);
  const [suggestedPalette, setSuggestedPalette] = useState<string[]>([]);

  // Sync newPaletteColors with personalColors
  useEffect(() => {
    if (newPaletteColors && newPaletteColors.length > 0) {
      setPersonalColors(newPaletteColors);
    }
  }, [newPaletteColors]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        let colorInput = query.trim();

        if (/^[0-9A-F]{6}$/i.test(colorInput)) {
          colorInput = "#" + colorInput;
        } else if (/^#?[0-9A-F]{3}$/i.test(colorInput.replace("#", ""))) {
          const hex = colorInput.replace("#", "");
          colorInput =
            "#" + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        fetchAllPalettes(colorInput);
        setIsSearched(true);
      } else {
        setPalettes([]);
        setError("");
        setIsSearched(false);
        setSuggestedPalette([]);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchPalette = async (hex: string, mode: PaletteMode) => {
    const cleanHex = hex.replace("#", "");
    try {
      const response = await fetch(
        `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=${mode}&count=5`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${mode} palette:`, error);
      return { colors: [] };
    }
  };

  const fetchAllPalettes = async (input: string) => {
    try {
      const hex = await convertToHex(input);

      if (!hex || !/^[0-9A-F]{6}$/i.test(hex)) {
        setPalettes([]);
        setError("Invalid color format. Please try again.");
        generateSuggestedPalette("ff0000");
        return;
      }

      const hexWithPrefix = `#${hex}`;
      const allPalettes = await Promise.all(
        paletteModes.map((mode) => fetchPalette(hexWithPrefix, mode))
      );

      const formatted: PaletteResult[] = allPalettes
        .map((data, i) => {
          const colors =
            data.colors?.map((c: any) => c.hex?.value).filter(Boolean) || [];
          if (colors.length >= 3) {
            return { mode: paletteModes[i], colors };
          }
          return null;
        })
        .filter((p): p is PaletteResult => p !== null);

      setPalettes(formatted);

      if (formatted.length === 0) {
        setError("No palettes exist for this color.");
        generateSuggestedPalette(hex);
      } else {
        setError("");
        setSuggestedPalette([]);
      }
    } catch (err) {
      console.error("Palette fetch error:", err);
      setPalettes([]);
      setError("No palettes exist for this color.");
    }
  };

  // ====== COLOR HELPERS ======
  const shadeColor = (r: number, g: number, b: number, factor: number): string => {
    const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
    return `#${newR.toString(16).padStart(2, "0")}${newG
      .toString(16)
      .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  };

  const complementaryColor = (r: number, g: number, b: number): string => {
    return `#${(255 - r).toString(16).padStart(2, "0")}${(255 - g)
      .toString(16)
      .padStart(2, "0")}${(255 - b).toString(16).padStart(2, "0")}`;
  };

  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
      h /= 6;
    }
    return [h * 360, s, l];
  };

  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    h /= 360;
    let r: number, g: number, b: number;
    if (s === 0) { r = g = b = l; } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if(t<0) t+=1; if(t>1) t-=1;
        if(t<1/6) return p+(q-p)*6*t;
        if(t<1/2) return q;
        if(t<2/3) return p+(q-p)*(2/3-t)*6;
        return p;
      };
      const q = l<0.5?l*(1+s):l+s-l*s;
      const p = 2*l-q;
      r = hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
    }
    return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
  };

  const analogousColor = (r: number, g: number, b: number): string => {
    const [h,s,l] = rgbToHsl(r,g,b);
    const [newR,newG,newB] = hslToRgb((h+30)%360,s,l);
    return `#${newR.toString(16).padStart(2,"0")}${newG.toString(16).padStart(2,"0")}${newB.toString(16).padStart(2,"0")}`;
  };

  const generateSuggestedPalette = (hex: string) => {
    hex = hex.replace("#","");
    if(!/^[0-9A-F]{6}$/i.test(hex)){
      setSuggestedPalette(["#ff0000","#cc0000","#ff3333","#00ffff","#ffff00"]);
      return;
    }
    const r=parseInt(hex.substring(0,2),16);
    const g=parseInt(hex.substring(2,4),16);
    const b=parseInt(hex.substring(4,6),16);

    const colors = [
      `#${hex}`,
      shadeColor(r,g,b,0.8),
      shadeColor(r,g,b,1.2),
      complementaryColor(r,g,b),
      analogousColor(r,g,b)
    ];

    setSuggestedPalette(colors.filter(c=>/^#[0-9A-F]{6}$/i.test(c)));
  };

  const convertToHex = async (input: string): Promise<string> => {
    if(/^#[0-9A-F]{6}$/i.test(input)) return input.replace("#","");
    if(/^[0-9A-F]{6}$/i.test(input)) return input;
    try{
      const dummy=document.createElement("div");
      dummy.style.backgroundColor=input;
      document.body.appendChild(dummy);
      const computed=getComputedStyle(dummy).backgroundColor;
      document.body.removeChild(dummy);
      const rgb=computed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if(rgb){
        return parseInt(rgb[1]).toString(16).padStart(2,"0")+parseInt(rgb[2]).toString(16).padStart(2,"0")+parseInt(rgb[3]).toString(16).padStart(2,"0");
      }
      return "ff0000";
    }catch{return "ff0000";}
  };

  // ===== Palette Actions =====
  const addCustomColor = () => {
    if(!personalColors.includes(customColor)){
      const updated=[...personalColors,customColor];
      setPersonalColors(updated);
      setNewPaletteColors(()=>updated);
    }
  };

  const addToPersonalPalette=(color:string)=>{
    if(!personalColors.includes(color)){
      const updated=[...personalColors,color];
      setPersonalColors(updated);
      setNewPaletteColors(()=>updated);
    }
  };

  const removeFromPersonalPalette=(colorToRemove:string)=>{
    const updated=personalColors.filter(c=>c!==colorToRemove);
    setPersonalColors(updated);
    setNewPaletteColors(()=>updated);
  };

  return (
    <div className="p-1 max-w-4xl mx-auto space-y-8 text-gray-800 bg-gradient-to-br from-white to-teal-50 rounded-2xl shadow-md">
      <div className="flex items-center gap-3">
        <Palette className="w-7 h-7 text-teal-600" />
        <h2 className="text-2xl font-bold text-gray-900">Choose Color Palette</h2>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Enter a hex code or color name (e.g. #34d399 or 'green')"
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
        className="border p-3 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
      />

      {/* Results */}
      <div className="min-h-[100px]">
        {!isSearched && (
          <div className="flex flex-col items-center justify-center p-6 text-gray-500">
            <Palette className="w-10 h-10 mb-2 text-teal-400 opacity-50"/>
            <p>Enter a color above to generate palettes</p>
          </div>
        )}

        {isSearched && error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          palettes.map((palette, idx)=>(
            <div key={idx} className="mb-4 p-3 bg-white rounded-lg shadow-sm border">
              <h4 className="text-sm font-semibold capitalize mb-2">{palette.mode} Palette</h4>
              <div className="flex gap-2 flex-wrap">
                {palette.colors.map((color,i)=>(
                  <div key={i} className="w-12 h-12 rounded-md shadow-sm border cursor-pointer" style={{backgroundColor:color}} onClick={()=>addToPersonalPalette(color)}/>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Suggested Palette */}
        {suggestedPalette.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Suggested Palette</h3>
            <div className="flex gap-2 flex-wrap">
              {suggestedPalette.map((color,i)=>(
                <div key={i} className="w-12 h-12 rounded-md shadow-sm border cursor-pointer " style={{backgroundColor:color}} onClick={()=>addToPersonalPalette(color)}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Picker */}
      <div className="p-3 bg-white rounded-lg shadow-sm border">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">Add a Custom Color</h3>
        <div className="flex items-center gap-3">
          <input aria-label="Select custom color" type="color" value={customColor} onChange={(e)=>setCustomColor(e.target.value)} className="w-12 h-12 border rounded-md cursor-pointer"/>
          <button onClick={addCustomColor} className="bg-teal-500 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-teal-600 transition-colors flex items-center gap-1 text-sm">
            <Plus size={14}/> Add Color
          </button>
        </div>
      </div>

      {/* Personal Palette */}
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-sm font-semibold mb-3">Your Personal Palette</h3>
        {personalColors.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {personalColors.map((color,i)=>(
              <div key={i} className="relative w-12 h-12 rounded-md shadow-sm border" style={{backgroundColor:color}}>
                <button aria-label="Remove color from palette" onClick={()=>removeFromPersonalPalette(color)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <X size={12}/>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No colors in your palette yet.</p>
        )}
      </div>
    </div>
  );
};

export default ColorPalette;
