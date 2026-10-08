import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import { hasRouteAccess } from '@/utils/role'

const Login = lazy(() => import('@/auth/Login'))
const Layout = lazy(() => import('@/components/Layout'))
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'))
const SettingsComponent = lazy(() => import('@/features/settings/SettingsComponent'))
const ReportAnalytics = lazy(() => import('@/features/report-analytics/ReportAnalytics'))
const AttendanceLeaving = lazy(() => import('@/features/attendance-leaving/AttendanceLeaving'))
const SetupManager = lazy(() => import('@/features/setup-manager/SetupManager'))
const InitialSystemSetup = lazy(() => import('@/features/setup-manager/pages/InitialSystemSetup'))
const LessonSetup = lazy(() => import('@/features/setup-manager/pages/LessonSetup'))
const HolidaySetup = lazy(() => import('@/features/setup-manager/pages/HolidaySetup'))
const Employees = lazy(() => import('@/features/employees/Employees'))
const ChristmasBonus = lazy(() => import('@/features/christmas-bonus/ChristmasBonus'))
const RecruitmentJobPostings = lazy(() => import('@/features/job-posting/RecruitmentJobPostings'))
const RecruitmentOnboarding = lazy(() => import('@/features/recruitment-onboarding/RecuitmentOnboarding'))
const PayrollProcessing = lazy(() => import('@/features/payroll-benefits/PayrollProcessing').then(({ PayrollProcessing }) => ({ default: PayrollProcessing })))
const LoanManagement = lazy(() => import('@/features/loan-management/LoanManagement').then(({ LoanManagement }) => ({ default: LoanManagement })))
const Announcement = lazy(() => import('@/features/announcement/Announcement'))

const LoadingScreen = () => <div className="flex min-h-screen items-center justify-center">Loading...</div>

const RequireAccess = ({ path, children }: { path: string; children: ReactNode }) => {
    if (!hasRouteAccess(path)) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const MainRoutes = () => {
    const routes = useRoutes([

        //BASE
        { path: "/", element: <Login /> },

        //HOME
        {
            path: "/", // parent wrapper
            element: <Layout />,
            children: [
                { path: "dashboard", element: <Dashboard /> },
                { path: "settings", element: <RequireAccess path="/settings"><SettingsComponent /></RequireAccess> },
                { path: "reports-analytics", element: <RequireAccess path="/reports-analytics"><ReportAnalytics /></RequireAccess> },
                { path: "setup-manager", element: <SetupManager /> },
                { path: "attendance-leaving", element: <AttendanceLeaving /> },
                { path: "employees", element: <RequireAccess path="/employees"><Employees /></RequireAccess> },
                { path: "job-posting", element: <RequireAccess path="/job-posting"><RecruitmentJobPostings /></RequireAccess> },
                { path: "payroll", element: <PayrollProcessing /> },
                { path: "christmas-bonus", element: <RequireAccess path="/christmas-bonus"><ChristmasBonus /></RequireAccess> },
                { path: "loan-management", element: <RequireAccess path="/loan-management"><LoanManagement /></RequireAccess> },
                { path: "recruitment-onboarding", element: <RequireAccess path="/recruitment-onboarding"><RecruitmentOnboarding /></RequireAccess> },
                { path: "announcement", element: <Announcement /> },
            ],
        },

        //SETUP ROUTES
        {
            path: "/setup",
            element: <Layout />,
            children: [
                { path: "initial", element: <RequireAccess path="/setup/initial"><InitialSystemSetup /></RequireAccess> },
                { path: "lessons", element: <RequireAccess path="/setup/lessons"><LessonSetup /></RequireAccess> },
                { path: "holidays", element: <HolidaySetup /> },
            ],
        },
    ])

    return <Suspense fallback={<LoadingScreen />}>{routes}</Suspense>
}

export default MainRoutes