import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Save, Download, Database, BarChart, PieChart, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomReport {
  id: string;
  name: string;
  description: string;
  query: string;
  chartType: 'table' | 'bar' | 'pie' | 'line';
  parameters: ReportParameter[];
}

interface ReportParameter {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date';
  defaultValue?: string;
}

interface ReportBuilderProps {
  onProcessChange: (process: any) => void;
  process: any;
}

const chartTypes = [
  { value: 'table', label: 'Table', icon: Database },
  { value: 'bar', label: 'Bar Chart', icon: BarChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'line', label: 'Line Chart', icon: LineChart },
];

export const ReportBuilder = ({ onProcessChange, process }: ReportBuilderProps) => {
  const { toast } = useToast();
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const createReport = () => {
    const newReport: CustomReport = {
      id: `report_${Date.now()}`,
      name: 'New Report',
      description: '',
      query: 'SELECT * FROM employees LIMIT 10;',
      chartType: 'table',
      parameters: []
    };
    setReports([...reports, newReport]);
    setSelectedReport(newReport);
  };

  const updateReport = (updates: Partial<CustomReport>) => {
    if (!selectedReport) return;

    const updatedReport = { ...selectedReport, ...updates };
    setReports(reports.map(r => r.id === selectedReport.id ? updatedReport : r));
    setSelectedReport(updatedReport);
  };

  const addParameter = () => {
    if (!selectedReport) return;

    const newParameter: ReportParameter = {
      id: `param_${Date.now()}`,
      name: 'parameter_name',
      type: 'text',
      defaultValue: ''
    };

    updateReport({
      parameters: [...selectedReport.parameters, newParameter]
    });
  };

  const updateParameter = (paramId: string, updates: Partial<ReportParameter>) => {
    if (!selectedReport) return;

    const updatedParameters = selectedReport.parameters.map(param =>
      param.id === paramId ? { ...param, ...updates } : param
    );

    updateReport({ parameters: updatedParameters });
  };

  const removeParameter = (paramId: string) => {
    if (!selectedReport) return;

    updateReport({
      parameters: selectedReport.parameters.filter(p => p.id !== paramId)
    });
  };

  const executeQuery = async () => {
    if (!selectedReport) return;

    setIsExecuting(true);
    try {
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock result data
      const mockResult = [
        { id: 1, name: 'John Doe', department: 'Engineering', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', department: 'Marketing', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', department: 'Sales', email: 'bob@example.com' },
      ];
      
      setQueryResult(mockResult);
      toast({
        title: "Query Executed",
        description: `Found ${mockResult.length} records`
      });
    } catch (error) {
      toast({
        title: "Query Error",
        description: "Failed to execute query",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const saveReport = () => {
    toast({
      title: "Report Saved",
      description: "Your custom report has been saved successfully."
    });
  };

  const exportReport = () => {
    toast({
      title: "Report Exported",
      description: "Report data has been exported to CSV."
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Report Builder */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Reports
              <Button size="sm" onClick={createReport}>
                <Database className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReport?.id === report.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-muted-foreground">{report.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedReport && (
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Report Name</Label>
                <Input
                  value={selectedReport.name}
                  onChange={(e) => updateReport({ name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={selectedReport.description}
                  onChange={(e) => updateReport({ description: e.target.value })}
                  placeholder="Brief description of the report"
                />
              </div>

              <div>
                <Label>Chart Type</Label>
                <Select
                  value={selectedReport.chartType}
                  onValueChange={(value) => updateReport({ chartType: value as CustomReport['chartType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>SQL Query</Label>
                <Textarea
                  value={selectedReport.query}
                  onChange={(e) => updateReport({ query: e.target.value })}
                  rows={6}
                  className="font-mono"
                  placeholder="SELECT * FROM table_name WHERE condition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Parameters</Label>
                  <Button size="sm" variant="outline" onClick={addParameter}>
                    Add Parameter
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedReport.parameters.map((param) => (
                    <div key={param.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Parameter name"
                        value={param.name}
                        onChange={(e) => updateParameter(param.id, { name: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        value={param.type}
                        onValueChange={(value) => updateParameter(param.id, { type: value as ReportParameter['type'] })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeParameter(param.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={executeQuery} disabled={isExecuting}>
                  <Play className="h-4 w-4 mr-2" />
                  {isExecuting ? 'Executing...' : 'Execute'}
                </Button>
                <Button variant="outline" onClick={saveReport}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Query Results */}
      <Card>
        <CardHeader>
          <CardTitle>Query Results</CardTitle>
        </CardHeader>
        <CardContent>
          {queryResult.length > 0 ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(queryResult[0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResult.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, i) => (
                        <TableCell key={i}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Execute a query to see results here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};