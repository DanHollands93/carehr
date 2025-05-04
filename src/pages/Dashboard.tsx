
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, FilePlus, ListPlus, Settings } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { label: "Menu Sets", value: 3, icon: ListPlus, color: "bg-secondary/10 text-secondary" },
    { label: "Processes", value: 8, icon: FilePlus, color: "bg-accent/10 text-accent" },
    { label: "Active Users", value: 12, icon: Settings, color: "bg-hr-primary/10 text-hr-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Welcome to the HR System Flow Builder
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="hr-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hr-card">
          <CardHeader>
            <CardTitle>Menu Sets</CardTitle>
            <CardDescription>Create and manage menu sets for your HR system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Define navigation menus and assign them to user roles</p>
            <Button asChild className="w-full">
              <Link to="/menu-sets" className="flex items-center justify-between">
                Go to Menu Sets <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hr-card">
          <CardHeader>
            <CardTitle>Processes</CardTitle>
            <CardDescription>Create forms, listings and other processes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Build forms and data displays that users can interact with</p>
            <Button asChild className="w-full">
              <Link to="/processes" className="flex items-center justify-between">
                Go to Processes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hr-card">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Learn how to use the HR Flow Builder</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2">1</div>
                <span>Create processes (forms, lists)</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2">2</div>
                <span>Build menu sets to organize processes</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2">3</div>
                <span>Assign menu sets to user roles</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full">
              View Documentation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
