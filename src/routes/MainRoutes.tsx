import { lazy, Suspense } from 'react'
import { useRoutes } from 'react-router-dom'

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
                { path: "settings", element: <SettingsComponent /> },
                { path: "reports-analytics", element: <ReportAnalytics /> },
                { path: "setup-manager", element: <SetupManager /> },
                { path: "attendance-leaving", element: <AttendanceLeaving /> },
                { path: "employees", element: <Employees /> },
                { path: "job-posting", element: <RecruitmentJobPostings /> },
                { path: "payroll", element: <PayrollProcessing /> },
                { path: "christmas-bonus", element: <ChristmasBonus /> },
                { path: "loan-management", element: <LoanManagement /> },
                { path: "recruitment-onboarding", element: <RecruitmentOnboarding /> },
                { path: "announcement", element: <Announcement /> },
            ],
        },

        //SETUP ROUTES
        {
            path: "/setup",
            element: <Layout />,
            children: [
                { path: "initial", element: <InitialSystemSetup /> },
                { path: "lessons", element: <LessonSetup /> },
                { path: "holidays", element: <HolidaySetup /> },
            ],
        },
    ])

    return <Suspense fallback={<LoadingScreen />}>{routes}</Suspense>
}

export default MainRoutes