import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import { hasRouteAccess, isAuthenticated } from '@/utils/role'

const Login = lazy(() => import('@/auth/Login'))
const Layout = lazy(() => import('@/components/Layout'))
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'))
const SettingsComponent = lazy(() => import('@/features/settings/SettingsComponent'))
const ReportAnalytics = lazy(() => import('@/features/report-analytics/ReportAnalytics'))
const AttendanceLeaving = lazy(() => import('@/features/attendance-leaving/AttendanceLeaving'))
const AttendanceCalendar = lazy(() => import('@/features/attendance-calendar/AttendanceCalendar'))
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

const RequireAuth = ({ children }: { children: ReactNode }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

const RequireAccess = ({ path, children }: { path: string; children: ReactNode }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
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
            element: <RequireAuth><Layout /></RequireAuth>,
            children: [
                { path: "dashboard", element: <RequireAccess path="/dashboard"><Dashboard /></RequireAccess> },
                { path: "settings", element: <RequireAccess path="/settings"><SettingsComponent /></RequireAccess> },
                { path: "reports-analytics", element: <RequireAccess path="/reports-analytics"><ReportAnalytics /></RequireAccess> },
                { path: "setup-manager", element: <RequireAccess path="/setup-manager"><SetupManager /></RequireAccess> },
                { path: "attendance-leaving", element: <RequireAccess path="/attendance-leaving"><AttendanceLeaving /></RequireAccess> },
                { path: "attendance-calendar", element: <RequireAccess path="/attendance-calendar"><AttendanceCalendar /></RequireAccess> },
                { path: "employees", element: <RequireAccess path="/employees"><Employees /></RequireAccess> },
                { path: "job-posting", element: <RequireAccess path="/job-posting"><RecruitmentJobPostings /></RequireAccess> },
                { path: "payroll", element: <RequireAccess path="/payroll"><PayrollProcessing /></RequireAccess> },
                { path: "christmas-bonus", element: <RequireAccess path="/christmas-bonus"><ChristmasBonus /></RequireAccess> },
                { path: "loan-management", element: <RequireAccess path="/loan-management"><LoanManagement /></RequireAccess> },
                { path: "recruitment-onboarding", element: <RequireAccess path="/recruitment-onboarding"><RecruitmentOnboarding /></RequireAccess> },
                { path: "announcement", element: <RequireAccess path="/announcement"><Announcement /></RequireAccess> },
            ],
        },

        //SETUP ROUTES
        {
            path: "/setup",
            element: <RequireAuth><Layout /></RequireAuth>,
            children: [
                { path: "initial", element: <RequireAccess path="/setup/initial"><InitialSystemSetup /></RequireAccess> },
                { path: "lessons", element: <RequireAccess path="/setup/lessons"><LessonSetup /></RequireAccess> },
                { path: "holidays", element: <RequireAccess path="/setup/holidays"><HolidaySetup /></RequireAccess> },
            ],
        },
    ])

    return <Suspense fallback={<LoadingScreen />}>{routes}</Suspense>
}

export default MainRoutes