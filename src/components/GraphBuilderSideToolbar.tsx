import React from "react";
import { Toolbar, ToolbarGroup, ToolbarItem, ToolbarSeparator } from "./Toolbar";
import { Expand, ScanSearch, Shrink, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { useGraphBuilderStore } from "../stores/graph-builder-store";

interface IGraphBuilderSideToolbarProps {
	fullscreen: boolean;
	toggleFullscreen: () => void;
}

function GraphBuilderSideToolbar({ fullscreen, toggleFullscreen }: IGraphBuilderSideToolbarProps): React.JSX.Element {
	const { zoomIn, zoomOut, autoLayout, fitAll } = useGraphBuilderStore();

	return (
		<div className="h-min-dvh absolute bottom-24 left-4 z-40">
			<Toolbar orientation="vertical">
				<ToolbarGroup maxActiveItems={0}>
					<ToolbarItem
						icon={<Sparkles />}
						onChange={autoLayout}
						hint="Auto layout"
					/>
					<ToolbarSeparator />
					<ToolbarItem
						icon={<ZoomIn />}
						onChange={zoomIn}
						hint="Zoom in"
					/>
					<ToolbarItem
						icon={<ZoomOut />}
						hint="Zoom out"
						onChange={zoomOut}
					/>
					<ToolbarItem
						icon={<ScanSearch />}
						onClick={fitAll}
						hint="Fit all nodes into view"
					/>
					<ToolbarItem
						icon={fullscreen ? <Shrink /> : <Expand />}
						onClick={toggleFullscreen}
						hint="Toggle fullscreen"
					/>
				</ToolbarGroup>
			</Toolbar>
		</div>
	);
}

export default GraphBuilderSideToolbar;
