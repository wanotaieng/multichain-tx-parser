import React, {
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
  useEffect,
} from "react";
import mermaid from "mermaid";
import { Settings2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface MermaidDiagramProps {
  diagramDefinition: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: true,
    wrap: true,
    width: 150,
  },
  flowchart: {
    curve: "basis",
  },
});

const MermaidDiagram = ({ diagramDefinition }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [diagramCenter, setDiagramCenter] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const initialPositionRef = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current) return;

      try {
        elementRef.current.innerHTML = "";

        // diagramDefinition 검증 및 정규화
        if (!diagramDefinition || !diagramDefinition.trim()) {
          throw new Error("Diagram definition is empty");
        }

        // 다이어그램 타입 확인
        const firstLine = diagramDefinition.trim().split("\n")[0].toLowerCase();
        const validTypes = [
          "graph",
          "flowchart",
          "sequencediagram",
          "classDiagram",
          "stateDiagram",
          "erDiagram",
          "gantt",
          "pie",
        ];

        if (!validTypes.some((type) => firstLine.includes(type))) {
          throw new Error("Invalid diagram type specified");
        }

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const processedDefinition = diagramDefinition.trim() + "\n";

        // 렌더링 시도
        const { svg } = await mermaid.render(id, processedDefinition);
        elementRef.current.innerHTML = svg;

        const svgElement = elementRef.current.querySelector("svg");
        if (svgElement && containerRef.current) {
          // SVG 스타일링
          svgElement.style.maxWidth = "none";
          svgElement.style.height = "auto";
          svgElement.style.cursor = "grab";

          // 중앙 정렬 계산
          const containerRect = containerRef.current.getBoundingClientRect();
          const svgRect = svgElement.getBoundingClientRect();

          const centerPosition = {
            x: (containerRect.width - svgRect.width) / 2,
            y: (containerRect.height - svgRect.height) / 2,
          };

          initialPositionRef.current = centerPosition;

          setDiagramCenter({
            x: containerRect.width / 2,
            y: containerRect.height / 2,
          });

          setPosition(centerPosition);
        }
      } catch (error) {
        console.error("Mermaid diagram rendering failed:", error);
        if (elementRef.current) {
          elementRef.current.innerHTML = `
            <div class="p-4 text-red-500 bg-red-50 rounded-lg">
              Failed to render diagram: ${
                error instanceof Error ? error.message : "Unknown error"
              }
            </div>
          `;
        }
      }
    };

    renderDiagram();
    setScale(1);
  }, [diagramDefinition]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(0.5, scale + delta), 4);

      const scaleChange = newScale / scale;
      const newPosition = {
        x: mouseX - (mouseX - position.x) * scaleChange,
        y: mouseY - (mouseY - position.y) * scaleChange,
      };

      setScale(newScale);
      setPosition(newPosition);
    },
    [scale, position]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") {
      e.stopPropagation();
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setPosition(initialPositionRef.current);
  };

  const handleZoom = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const newScale = Math.min(Math.max(0.5, scale + delta), 4);
    setScale(newScale);
    const scaleChange = newScale / scale;
    setPosition({
      x: diagramCenter.x - (diagramCenter.x - position.x) * scaleChange,
      y: diagramCenter.y - (diagramCenter.y - position.y) * scaleChange,
    });
  };

  const toggleControls = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowControls(!showControls);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <button
        onClick={toggleControls}
        className={`absolute bottom-4 right-4 p-2 rounded-full 
        bg-white/80 dark:bg-slate-800/80 
        shadow-md 
        hover:bg-gray-100 dark:hover:bg-slate-700 
        transition-transform duration-200 z-20
        border border-primary/20 dark:border-primary/40
        ${showControls ? "rotate-180" : ""}`}
      >
        <Settings2 className="w-5 h-5" />
      </button>
      <div
        className={`absolute bottom-16 right-4 flex flex-col gap-2 z-10 
        bg-white/90 dark:bg-slate-800/90 
        p-2 rounded-lg shadow-lg transition-all duration-200
        border border-primary/20 dark:border-primary/40
        ${
          showControls
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full"
        }`}
      >
        <button
          onClick={handleZoom(0.1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoom(-0.1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
      <div
        className="w-full h-full overflow-hidden bg-white rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div
          ref={elementRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          className="w-full h-full flex items-center justify-center"
        />
      </div>
    </div>
  );
};

export default MermaidDiagram;
