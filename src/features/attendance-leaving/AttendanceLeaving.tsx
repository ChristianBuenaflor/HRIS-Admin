import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceTracker from "./components/AttendanceTracker";
import LeaveManagement from "./components/LeaveManagement";
import DTRAdjustments from "./components/DTRAdjustments";
import ForgotClockInRequest from "./components/ForgotClockInRequest";
import Overtime from "./components/Overtime";
import { Clock, Calendar, FileCheck, FileClock, Timer } from 'lucide-react';

const AttendanceLeaving = () => {
    const [activeTab, setActiveTab] = useState('attendance');

    return (
        <div className="p-6 space-y-0">
            <div>
                <h2 className="text-3xl font-bold">Attendance and Leaving</h2>
                <p className="text-muted-foreground">Managing employee's daily attendance and leaving</p>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
                <div className="border-b px-6 pt-6">
                    <div className="pb-4">
                        <h1 className="text-2xl font-semibold">Attendance & Leave</h1>
                        <p className="text-muted-foreground">
                            Track attendance, manage leave requests, and review DTR adjustments
                        </p>
                    </div>
                    <TabsList>
                        <TabsTrigger value="attendance" className="gap-2">
                            <Clock className="w-4 h-4" />
                            Attendance
                        </TabsTrigger>
                        <TabsTrigger value="adjustments" className="gap-2">
                            <FileCheck className="w-4 h-4" />
                            DTR Adjustments
                        </TabsTrigger>
                        <TabsTrigger value="forgot-clock-in" className="gap-2">
                            <FileClock className="w-4 h-4" />
                            Forgot Clock In Request
                        </TabsTrigger>
                        <TabsTrigger value="leave" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            Leave
                        </TabsTrigger>
                        <TabsTrigger value="overtime" className="gap-2">
                            <Timer className="w-4 h-4" />
                            Overtime
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="attendance" className="mt-0">
                    <AttendanceTracker />
                </TabsContent>

                <TabsContent value="adjustments" className="mt-0">
                    <DTRAdjustments />
                </TabsContent>

                <TabsContent value="leave" className="mt-0">
                    <LeaveManagement />
                </TabsContent>
                
                <TabsContent value="forgot-clock-in" className="mt-0">
                    <ForgotClockInRequest />
                </TabsContent>

                <TabsContent value="overtime" className="mt-0">
                    <Overtime />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default AttendanceLeaving;