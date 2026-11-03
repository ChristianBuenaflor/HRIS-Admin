import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from 'lucide-react';
import { toast } from "sonner";
import type { SetupData } from '../../setup-manager/components/setupManagerTypes';
import { setupSteps } from '../../setup-manager/components/constants';
import { StepIndicator } from '../../setup-manager/components/StepIndicator';
import { NavigationButtons } from '../../setup-manager/components/NavigationButton';
import { CompanyInfoStep } from '../../setup-manager/components/steps/CompanyInfoStep';
import { DepartmentsStep } from '../../setup-manager/components/steps/DepartmentsStep';
import { PositionsStep } from '../../setup-manager/components/steps/PositionsStep';
import { LeaveTypesStep } from '../../setup-manager/components/steps/LeaveTypesStep';
import { BenefitTypesStep } from '../../setup-manager/components/steps/BenefitTypeStep';
import { EmploymentTypesStep } from '../../setup-manager/components/steps/EmploymentTypeStep';
import { WorkLocationsStep } from '../../setup-manager/components/steps/WorkLocationsStep';
import { AllowanceStep } from '../../setup-manager/components/steps/AllowanceStep';
import { LoanTypesStep } from '../../setup-manager/components/steps/LoanTypesStep';


const SetupManager = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const stepParam = searchParams.get('step');
    
    // Find the initial step index from URL parameter or default to 0
    const getInitialStepIndex = () => {
        if (stepParam) {
            const stepIndex = setupSteps.findIndex(s => s.id === stepParam);
            return stepIndex >= 0 ? stepIndex : 0;
        }
        return 0;
    };

    const [currentStep, setCurrentStep] = useState(getInitialStepIndex());
    const [setupData, setSetupData] = useState<SetupData>({
        companyName: '',
        companyLogo: '',
        companyMission: '',
        companyVision: '',
        registrationNumber: '',
        taxId: '',
        foundedYear: '',
        industry: '',
        companySize: '',
        website: '',
        primaryEmail: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        departments: [],
        positions: [],
        leaveTypes: [],
        benefitTypes: [],
        employmentTypes: [],
        workLocations: [],
        holidays: [],
        allowance: [],
        LoanType: [],
    });

    const handleNext = () => {
        if (currentStep < setupSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        if (currentStep < setupSteps.length - 1) {
            toast.error(`Please complete all ${setupSteps.length} steps before finishing (currently on step ${currentStep + 1}).`);
            return;
        }
        const required: Array<[string, unknown]> = [
            ["companyName", setupData.companyName],
            ["departments", setupData.departments],
            ["positions", setupData.positions],
        ];
        const missing = required.filter(([, v]) => !v || (Array.isArray(v) && v.length === 0)).map(([k]) => k);
        if (missing.length > 0) {
            toast.error(`Complete required sections before finishing: ${missing.join(", ")}. Individual steps save to the API separately.`);
            return;
        }
        localStorage.setItem('hris_setup_data', JSON.stringify({ ...setupData, completedAt: new Date().toISOString() }));
        localStorage.setItem('hris_setup_complete', 'true');
        toast.success('Setup snapshot saved locally. Verify each step saved to the backend before going live.');
    };

    const renderStepContent = () => {
        const step = setupSteps[currentStep].id;

        switch (step) {
            case 'company':
                return <CompanyInfoStep setupData={setupData} setSetupData={setSetupData} />;
            case 'departments':
                return <DepartmentsStep setupData={setupData} setSetupData={setSetupData} />;
            case 'positions':
                return <PositionsStep setupData={setupData} setSetupData={setSetupData} />;
            case 'leave':
                return <LeaveTypesStep setupData={setupData} setSetupData={setSetupData} />;
            case 'benefits':
                return <BenefitTypesStep setupData={setupData} setSetupData={setSetupData} />;
            case 'employment':
                return <EmploymentTypesStep setupData={setupData} setSetupData={setSetupData} />;
            case 'locations':
                return <WorkLocationsStep setupData={setupData} setSetupData={setSetupData} />;
            case 'allowance':
                return <AllowanceStep setupData={setupData} setSetupData={setSetupData} />;
            case 'loans':
                return <LoanTypesStep setupData={setupData} setSetupData={setSetupData} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
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
                    <button 
                        onClick={() => navigate('/setup-manager')}
                        className="hover:text-blue-600 transition-colors"
                    >
                        Setup Manager
                    </button>
                    <span className="text-gray-500">›</span>
                    <span className="text-gray-700 font-medium">Initial System Setup</span>
                </div>
            </div>

            <div className="p-6 mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Settings className="w-8 h-8" />
                    Initial System Setup
                </h1>
                <p className="text-muted-foreground mt-2">
                    Configure all essential settings and data for your HRIS system
                </p>
            </div>

            {/* Progress Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Step {currentStep + 1} of {setupSteps.length}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {setupSteps[currentStep].label}
                            </span>
                        </div>

                        {/* Step Progress */}
                        <div className="flex items-center justify-between w-full mt-2">
                            {setupSteps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`flex-1 h-2 mx-1 rounded-full transition-colors ${index <= currentStep ? 'bg-primary' : 'bg-muted'
                                        }`}
                                />
                            ))}
                        </div>

                        <StepIndicator
                            currentStep={currentStep}
                            onStepClick={(index) => setCurrentStep(index)}
                        />
                    </div>
                </CardContent>
            </Card>


            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation */}
            <Card>
                <CardContent className="pt-6">
                    <NavigationButtons
                        currentStep={currentStep}
                        onBack={handleBack}
                        onNext={handleNext}
                        onComplete={handleComplete}
                    />
                </CardContent>
            </Card>
            </div>
        </div>
    );
};

export default SetupManager;