import React, { useState } from "react";

interface CommentsStepProps {
  comments: { _id: string; comment: string; created_at?: number }[];
  onAdd: (comment: string) => void;
}

const CommentsStep: React.FC<CommentsStepProps> = ({ comments, onAdd }) => {
  const [text, setText] = useState("");

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      <div className="space-y-2 mb-4">
        {comments.length === 0 && <p className="text-gray-500">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c._id} className="p-2 border rounded-md">
            <p>{c.comment}</p>
            {c.created_at && (
              <p className="text-xs text-gray-400">
                {new Date(c.created_at).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-md px-2 py-1"
          placeholder="Write a comment..."
        />
        <button
          onClick={() => {
            onAdd(text);
            setText("");
          }}
          className="px-4 py-1 bg-teal-500 text-white rounded-md hover:bg-teal-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CommentsStep;
