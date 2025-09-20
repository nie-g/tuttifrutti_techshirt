import React from "react";

interface DesignImagesProps {
  images: string[];
}

const DesignImages: React.FC<DesignImagesProps> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Design Previews</h3>
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`design-preview-${idx}`}
            className="w-full h-32 object-cover rounded-md"
          />
        ))}
      </div>
    </div>
  );
};

export default DesignImages;
