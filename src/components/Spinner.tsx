import React from "react";

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
	<div className={`size-20 animate-spin rounded-full border-8 border-base-300 border-r-neutral ${className ?? ""}`} />
);
