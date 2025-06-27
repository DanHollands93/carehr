
import { useParams } from "react-router-dom";
import DynamicProcess from "@/components/DynamicProcess";

const DynamicProcessPage = () => {
  const { processId } = useParams<{ processId: string }>();

  if (!processId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-muted-foreground">Process ID not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <DynamicProcess processId={processId} />
    </div>
  );
};

export default DynamicProcessPage;
