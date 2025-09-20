import React from "react";

const SeeDesignStep: React.FC<{ design: any }> = ({ design }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold">See Final Design</h3>
      <p className="mt-2 text-gray-600">
        {design.description || "No design description available."}
      </p>
    </div>
  );
};

export default SeeDesignStep;
