import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentsReport from "./PaymentsReport";
import OrdersReport from "./OrdersReport";
import ProfitsReport from "./ProfitsReport";
import ServicesReport from "./ServicesReport";
import UsersReport from "./UsersReport";
import ProvidersReport from "./ProvidersReport";
import TicketsReport from "./TicketsReport";

const ReportsManagement = () => {
  const [activeTab, setActiveTab] = useState("payments");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Análisis y estadísticas del sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="profits">Profits</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          <PaymentsReport />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersReport />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <TicketsReport />
        </TabsContent>

        <TabsContent value="profits" className="mt-6">
          <ProfitsReport />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ServicesReport />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersReport />
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <ProvidersReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsManagement;
