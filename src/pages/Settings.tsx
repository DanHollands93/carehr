
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import LookupListsManager from "@/components/LookupListsManager";
import EnhancedPermissionsManager from "@/components/EnhancedPermissionsManager";
import CompanySettingsManager from "@/components/CompanySettingsManager";
import AutoExceptionsSettings from "@/components/AutoExceptionsSettings";
import ComplianceTypeManager from "@/components/ComplianceTypeManager";
import EmployeeFormConfigManager from "@/components/EmployeeFormConfigManager";
import ReviewTypeManager from "@/components/ReviewTypeManager";
import JobRolePayRateManager from "@/components/JobRolePayRateManager";

const Settings = () => {
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully"
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure your HR System flow builder
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="timeclock">Time Clock</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="lookups">Lookup Lists</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Types</TabsTrigger>
          <TabsTrigger value="employee-forms">Employee Forms</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="job-roles">Job Roles & Pay</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure the general settings of your HR system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system-name">System Name</Label>
                <Input id="system-name" defaultValue="HR Flow Builder" />
                <p className="text-sm text-muted-foreground">
                  This will be displayed in the header and system messages
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input id="admin-email" type="email" defaultValue="admin@example.com" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes as you make them
                  </p>
                </div>
                <Switch id="auto-save" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications about system updates
                  </p>
                </div>
                <Switch id="notifications" />
              </div>
              
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <CompanySettingsManager />
        </TabsContent>

        <TabsContent value="timeclock">
          <AutoExceptionsSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your HR system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme Colors</Label>
                <div className="flex gap-2 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-hr-primary cursor-pointer ring-2 ring-offset-2 ring-primary" />
                  <div className="w-10 h-10 rounded-full bg-hr-accent cursor-pointer" />
                  <div className="w-10 h-10 rounded-full bg-hr-secondary cursor-pointer" />
                  <div className="w-10 h-10 rounded-full bg-blue-500 cursor-pointer" />
                  <div className="w-10 h-10 rounded-full bg-green-500 cursor-pointer" />
                  <div className="w-10 h-10 rounded-full bg-red-500 cursor-pointer" />
                  <div className="w-10 h-10 rounded-full bg-amber-500 cursor-pointer" />
                  <div className="w-10 h-10 rounded-full bg-pink-500 cursor-pointer" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark mode for the user interface
                  </p>
                </div>
                <Switch id="dark-mode" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-muted-foreground">
                    Make the UI more compact with less whitespace
                  </p>
                </div>
                <Switch id="compact-view" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    Logo
                  </div>
                  <Button variant="outline" size="sm">Upload New</Button>
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <EnhancedPermissionsManager />
        </TabsContent>

        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Connect your HR system with other applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input id="api-key" type="password" value="●●●●●●●●●●●●●●●●" readOnly className="flex-1" />
                  <Button variant="outline">Regenerate</Button>
                  <Button variant="outline">Copy</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this API key to connect external systems
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">HRIS Integration</h4>
                    <p className="text-sm text-muted-foreground">Connect to your HR Information System</p>
                  </div>
                  <Switch id="hris-connection" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SSO Authentication</h4>
                    <p className="text-sm text-muted-foreground">Enable Single Sign-On with your identity provider</p>
                  </div>
                  <Switch id="sso-connection" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Calendar Integration</h4>
                    <p className="text-sm text-muted-foreground">Sync with organization calendar</p>
                  </div>
                  <Switch id="calendar-connection" />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lookups">
          <LookupListsManager />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceTypeManager />
        </TabsContent>

        <TabsContent value="employee-forms">
          <EmployeeFormConfigManager />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewTypeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
