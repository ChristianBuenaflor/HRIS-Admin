import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarComponent } from "@/features/navbar/SidebarComponent";
import { HeadbarComponent } from "@/features/navbar/HeadbarComponent";
import { isAuthenticated } from "@/utils/role";
import { hydrateStoredRole } from "@/utils/hydrateRole";


const Layout = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [, setRoleVersion] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/", { replace: true });
            return;
        }
        // Existing sessions stored before role hydration carry no role fields;
        // enrich once so Admin restrictions apply, then re-render. Failures
        // keep the legacy authenticated session.
        let cancelled = false;
        hydrateStoredRole().then(() => {
            if (!cancelled) setRoleVersion((v) => v + 1);
        });
        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <SidebarComponent
                    activeView={activeView}
                    setActiveView={setActiveView}
                />

                <main className="flex-1 overflow-auto">
                    <HeadbarComponent />
                    <div className="p-6">
                        <Outlet context={{ activeView }} />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
export default Layout;