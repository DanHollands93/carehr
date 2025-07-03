import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Settings, Database, Mail, Bell, FileText, Zap } from "lucide-react";

interface WorkflowAction {
  id: string;
  type: 'database_update' | 'send_email' | 'create_notification' | 'generate_report' | 'webhook';
  name: string;
  config: Record<string, any>;
}

interface WorkflowTrigger {
  id: string;
  type: 'button_click' | 'form_submit' | 'schedule' | 'data_change';
  name: string;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
}

interface WorkflowDesignerProps {
  onProcessChange: (process: any) => void;
  process: any;
}

const actionTypes = [
  { value: 'database_update', label: 'Update Database', icon: Database },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'create_notification', label: 'Create Notification', icon: Bell },
  { value: 'generate_report', label: 'Generate Report', icon: FileText },
  { value: 'webhook', label: 'Call Webhook', icon: Zap },
];

const triggerTypes = [
  { value: 'button_click', label: 'Button Click' },
  { value: 'form_submit', label: 'Form Submit' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'data_change', label: 'Data Change' },
];

export const WorkflowDesigner = ({ onProcessChange, process }: WorkflowDesignerProps) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);

  const createWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      trigger: {
        id: `trigger_${Date.now()}`,
        type: 'button_click',
        name: 'Button Click',
        config: {}
      },
      actions: []
    };
    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
  };

  const addAction = (type: WorkflowAction['type']) => {
    if (!selectedWorkflow) return;

    const newAction: WorkflowAction = {
      id: `action_${Date.now()}`,
      type,
      name: actionTypes.find(t => t.value === type)?.label || type,
      config: {}
    };

    const updatedWorkflow = {
      ...selectedWorkflow,
      actions: [...selectedWorkflow.actions, newAction]
    };

    setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
  };

  const updateAction = (actionId: string, updates: Partial<WorkflowAction>) => {
    if (!selectedWorkflow) return;

    const updatedActions = selectedWorkflow.actions.map(action =>
      action.id === actionId ? { ...action, ...updates } : action
    );

    const updatedWorkflow = {
      ...selectedWorkflow,
      actions: updatedActions
    };

    setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
  };

  const removeAction = (actionId: string) => {
    if (!selectedWorkflow) return;

    const updatedWorkflow = {
      ...selectedWorkflow,
      actions: selectedWorkflow.actions.filter(action => action.id !== actionId)
    };

    setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
    setSelectedAction(null);
  };

  const renderActionConfig = (action: WorkflowAction) => {
    switch (action.type) {
      case 'database_update':
        return (
          <div className="space-y-4">
            <div>
              <Label>Table</Label>
              <Input
                value={action.config.table || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, table: e.target.value }
                })}
                placeholder="Table name"
              />
            </div>
            <div>
              <Label>SQL Query</Label>
              <Textarea
                value={action.config.query || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, query: e.target.value }
                })}
                placeholder="UPDATE table SET column = value WHERE condition"
                rows={4}
              />
            </div>
          </div>
        );

      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <Label>To Email</Label>
              <Input
                value={action.config.to || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, to: e.target.value }
                })}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={action.config.subject || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, subject: e.target.value }
                })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, message: e.target.value }
                })}
                placeholder="Email message"
                rows={4}
              />
            </div>
          </div>
        );

      case 'create_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={action.config.title || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, title: e.target.value }
                })}
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, message: e.target.value }
                })}
                placeholder="Notification message"
                rows={3}
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                value={action.config.url || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, url: e.target.value }
                })}
                placeholder="https://api.example.com/webhook"
              />
            </div>
            <div>
              <Label>Method</Label>
              <Select
                value={action.config.method || 'POST'}
                onValueChange={(value) => updateAction(action.id, {
                  config: { ...action.config, method: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">No configuration needed</p>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Workflows
            <Button size="sm" onClick={createWorkflow}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflow?.id === workflow.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <div className="font-medium">{workflow.name}</div>
                <div className="text-sm text-muted-foreground">
                  {workflow.actions.length} actions
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          {selectedWorkflow && (
            <div>
              <Label>Workflow Name</Label>
              <Input
                value={selectedWorkflow.name}
                onChange={(e) => {
                  const updatedWorkflow = { ...selectedWorkflow, name: e.target.value };
                  setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
                  setSelectedWorkflow(updatedWorkflow);
                }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {selectedWorkflow ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {actionTypes.map((actionType) => {
                  const Icon = actionType.icon;
                  return (
                    <Button
                      key={actionType.value}
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(actionType.value as WorkflowAction['type'])}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {actionType.label}
                    </Button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {selectedWorkflow.actions.map((action, index) => (
                  <div
                    key={action.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAction?.id === action.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedAction(action)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{action.name}</div>
                        <div className="text-sm text-muted-foreground">Step {index + 1}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAction(action.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Select a workflow to manage actions</p>
          )}
        </CardContent>
      </Card>

      {/* Action Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Action Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAction ? (
            <div className="space-y-4">
              <div>
                <Label>Action Name</Label>
                <Input
                  value={selectedAction.name}
                  onChange={(e) => updateAction(selectedAction.id, { name: e.target.value })}
                />
              </div>
              {renderActionConfig(selectedAction)}
            </div>
          ) : (
            <p className="text-muted-foreground">Select an action to configure it</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};