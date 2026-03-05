
import { Outlet } from "react-router-dom";
import TopNavigation from "./TopNavigation";

const HRLayout = () => {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <TopNavigation />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default HRLayout;
