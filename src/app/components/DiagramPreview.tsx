import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, Maximize2, AlertTriangle } from "lucide-react";
import MermaidDiagram from "./MermaidDiagram";

interface DiagramPreviewProps {
  diagramDefinition: string;
}

const DiagramPreview = ({ diagramDefinition }: DiagramPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogSize, setDialogSize] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [processedDefinition, setProcessedDefinition] = useState("");

  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(window.innerWidth * 0.8, 1200);
      const height = Math.min(window.innerHeight * 0.8, 800);
      setDialogSize({ width, height });
    };

    window.addEventListener("resize", updateSize);
    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    processDiagramDefinition();
  }, [diagramDefinition]);

  const processDiagramDefinition = () => {
    try {
      // Reset error state
      setError(null);

      // Check for empty or whitespace-only string
      if (!diagramDefinition || !diagramDefinition.trim()) {
        setError("Diagram definition cannot be empty");
        return;
      }

      // Process the string
      let processed = diagramDefinition
        .trimStart() // Remove leading whitespace
        .replace(/^sequenceDiagram\s+/m, "sequenceDiagram\n") // Normalize sequenceDiagram declaration
        .replace(/\\n/g, "\n"); // Replace literal \n with actual newlines

      // Basic syntax validation
      const firstLine = processed.split("\n")[0].toLowerCase().trim();
      const validTypes = [
        "graph",
        "flowchart",
        "sequencediagram",
        "classdiagram",
        "statediagram",
        "erdiagram",
        "gantt",
        "pie",
      ];

      if (!validTypes.some((type) => firstLine === type)) {
        if (!processed.startsWith("sequenceDiagram")) {
          processed = "sequenceDiagram\n" + processed;
        }
      }

      // Ensure proper line breaks after the diagram type declaration
      processed = processed.replace(/^(sequenceDiagram)\s*/, "$1\n");

      // console.log("Processed diagram definition:", processed); // Debug log
      setProcessedDefinition(processed);
    } catch (err) {
      setError("Failed to process diagram definition");
      console.error("Diagram processing error:", err);
    }
  };

  const ErrorDisplay = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="p-4 bg-muted rounded-lg border border-primary/20 dark:border-primary/40 cursor-pointer hover:bg-muted/80 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              <h3 className="font-semibold">Transaction Flow</h3>
            </div>
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-md min-h-[200px] border border-primary/20 dark:border-primary/40">
            {error || !processedDefinition ? (
              <div className="h-full flex items-center justify-center">
                <ErrorDisplay
                  message={error || "No diagram definition provided"}
                />
              </div>
            ) : (
              <MermaidDiagram
                diagramDefinition={processedDefinition}
                key={`preview-${isOpen}`}
              />
            )}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent
        className="p-0 overflow-hidden border border-primary/20 dark:border-primary/40"
        style={{
          maxWidth: `${dialogSize.width}px`,
          maxHeight: `${dialogSize.height}px`,
          width: "80vw",
          height: "80vh",
        }}
      >
        <DialogHeader className="p-4 border-b border-primary/20 dark:border-primary/40">
          <DialogTitle>Transaction Flow Diagram</DialogTitle>
        </DialogHeader>
        <div
          className="p-4 overflow-auto"
          style={{ height: "calc(100% - 60px)" }}
        >
          <div className="h-full w-full bg-white dark:bg-slate-900 rounded-lg border border-primary/20 dark:border-primary/40">
            {error || !processedDefinition ? (
              <div className="h-full flex items-center justify-center p-4">
                <ErrorDisplay
                  message={error || "No diagram definition provided"}
                />
              </div>
            ) : (
              <MermaidDiagram
                diagramDefinition={processedDefinition}
                key={`dialog-${isOpen}`}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiagramPreview;
