import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  NotebookPen,
    CalendarDays,
} from 'lucide-react';
import { isAdmin, isAdminAllowedSetupCard, isSuperAdmin } from '@/utils/role';


const setupCards = [
    {
        id: 'initial',
        title: 'Initial System Setup',
        description: 'Set up your company and HRIS system',
        icon: Settings,
        path: '/setup/initial',
    },
     {
        id: 'lessons',
        title: 'Lessons',
        description: 'Learn about the system and its features',
        icon: NotebookPen,
        path: '/setup/lessons',
    },
    {
        id: 'holidays',
        title: 'Holidays',
        description: 'Manage company holidays and important events',
        icon: CalendarDays,
        path: '/setup/holidays',
    },
];

const SetupManager = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('User');

    // Get user name from localStorage
    useEffect(() => {
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                const displayName = parsed.first_name || parsed.name || 'User';
                setUserName(displayName);
            } catch (e) {
                console.error('Failed to parse user info', e);
            }
        }
    }, []);


    // Computed every render (not memoized): role lives in localStorage and can
    // change on login/logout without remounting this component.
    const visibleSetupCards = isSuperAdmin()
        ? setupCards
        : isAdmin()
            ? setupCards.filter((card) => isAdminAllowedSetupCard(card.id))
            : setupCards;

    return (
        <div className="space-y-8">
            {/* BREADCRUMB NAVIGATION */}
            <div className="bg-blue-100 px-6 py-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="hover:text-blue-600 transition-colors"
                    >
                        Dashboard
                    </button>
                    <span className="text-gray-500">›</span>
                    <span className="text-gray-700 font-medium">Setup Manager</span>
                </div>
            </div>

            <div className="p-6 space-y-8">
            {/* HEADER WITH GREETING */}
            <div>
                <h1 className="text-3xl font-bold mb-6">Hello {userName}!</h1>
                <p className="text-muted-foreground text-lg">
                    Welcome to System Setup. Configure all essential settings and data for your HRIS system
                </p>
            </div>

            {/* CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleSetupCards.map((card) => {
                    const IconComponent = card.icon;
                    
                    return (
                        <Card key={card.id} className='py-0' >
                            <CardContent className="p-6  space-y-6">
                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-4">
                                        <IconComponent className="w-6 h-6" />
                                        <h3 className="text-lg font-semibold">{card.title}</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                                <Button 
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(card.path);
                                    }}
                                >
                                    Configure
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            </div>
        </div>
    );
};

export default SetupManager;