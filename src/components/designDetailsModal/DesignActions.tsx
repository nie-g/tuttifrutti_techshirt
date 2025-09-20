import React from "react";

interface DesignActionsProps {
  onStartProject: () => void;
  disabled?: boolean;
}

const DesignActions: React.FC<DesignActionsProps> = ({ onStartProject, disabled }) => {
  return (
    <div className="mt-4 flex justify-end">
      <button
        onClick={onStartProject}
        disabled={disabled}
        className={`px-4 py-2 rounded-md text-white ${
          disabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Start Project
      </button>
    </div>
  );
};

export default DesignActions;
