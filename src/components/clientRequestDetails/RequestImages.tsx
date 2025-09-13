import React from "react";

interface RequestImagesProps {
  images: string[];
}

const RequestImages: React.FC<RequestImagesProps> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Uploaded Images</h3>
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`upload-${idx}`}
            className="w-full h-32 object-cover rounded-md"
          />
        ))}
      </div>
    </div>
  );
};

export default RequestImages;
