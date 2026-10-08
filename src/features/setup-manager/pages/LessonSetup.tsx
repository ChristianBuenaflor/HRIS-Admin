import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/axios";
import { LessonInfoStep } from "../components/steps/LessonInfoStep";
import { ModulesStep } from "../components/steps/ModulesStep";
import { QuestionsStep } from "../components/steps/QuestionsStep";

interface QuestionChoice {
  choice_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question: string;
  choices: QuestionChoice[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface LessonData {
  title: string;
  description: string;
}

const LessonSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const [lessonData, setLessonData] = useState<LessonData>({
    title: "",
    description: "",
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    { id: "lesson-info", label: "Lesson Information" },
    { id: "modules", label: "Create Modules" },
    { id: "questions", label: "Questions & Answers" },
  ];

  const handleNext = () => {
    // Step 0: Validate lesson data and move to step 1
    if (currentStep === 0) {
      if (!lessonData.title.trim() || !lessonData.description.trim()) {
        toast.error("Please fill in lesson title and description");
        return;
      }
      setCurrentStep(1);
      return;
    }

    // Step 1: Validate modules exist and move to step 2
    if (currentStep === 1) {
      if (modules.length === 0) {
        toast.error("Please add at least one module");
        return;
      }

      // Validate each module has questions
      // const hasEmptyModules = modules.some((m) => m.questions.length === 0);
      // if (hasEmptyModules) {
      //   toast.error("Each module must have at least one question");
      //   return;
      // }

      setCurrentStep(2);
      return;
    }

    // Step 2: Validate questions before completion
    if (currentStep === 2) {
      const totalQuestions = modules.reduce((sum, m) => sum + m.questions.length, 0);
      if (totalQuestions === 0) {
        toast.error("Please add at least one question");
        return;
      }
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Validate final state
      if (!lessonData.title.trim() || !lessonData.description.trim()) {
        toast.error("Lesson information is incomplete");
        return;
      }

      if (modules.length === 0) {
        toast.error("Please add at least one module");
        return;
      }

      // Validate each module has at least one question with choices
      for (const module of modules) {
        if (module.questions.length === 0) {
          toast.error(`Module "${module.title}" has no questions`);
          return;
        }
        for (const question of module.questions) {
          if (question.choices.length === 0) {
            toast.error(`Question "${question.question}" has no choices`);
            return;
          }
        }
      }

      // Build the payload according to backend structure
      const payload = {
        lesson_title: lessonData.title,
        lesson_description: lessonData.description,
        modules: modules.map((module) => ({
          title: module.title,
          description: module.description,
          questions: module.questions.map((question) => ({
            question: question.question,
            choices: question.choices.map((choice) => ({
              choice_text: choice.choice_text,
              is_correct: choice.is_correct,
            })),
          })),
        })),
      };

      console.log("Saving complete lesson structure:", payload);
      setIsSaving(true);

      const res = await api.post(
        `/training/create/full-lesson`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      if (!res.data?.success) {
        console.error("Lesson creation failed:", res.data);
        toast.error(res.data?.message || "Failed to create lesson");
        return;
      }

      console.log("✓ Complete lesson created successfully:", res.data);
      toast.success("Lesson created successfully with all modules and questions!");

      // Reset form and navigate back
      setTimeout(() => {
        navigate("/setup-manager");
      }, 1500);
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      const errorMsg =
        error?.response?.data?.message || error.message || "Failed to create lesson";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep].id;

    switch (step) {
      case "lesson-info":
        return <LessonInfoStep lessonData={lessonData} setLessonData={setLessonData} />;
      case "modules":
        return <ModulesStep modules={modules} setModules={setModules} />;
      case "questions":
        return <QuestionsStep modules={modules} setModules={setModules} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-blue-600 transition-colors"
          >
            Dashboard
          </button>
          <span className="text-gray-500">›</span>
          <button
            onClick={() => navigate("/setup-manager")}
            className="hover:text-blue-600 transition-colors"
          >
            Setup Manager
          </button>
          <span className="text-gray-500">›</span>
          <span className="text-gray-700 font-medium">Lesson Setup</span>
        </div>
      </div>

      <div className="p-6 mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Lesson Setup
          </h1>
          <p className="text-muted-foreground mt-2">
            Create lessons with modules and questions step by step
          </p>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {steps[currentStep].label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center justify-between w-full">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                      index <= currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Step Indicators */}
              <div className="flex justify-between mt-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        index <= currentStep
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs text-center max-w-[60px] text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSaving}
          >
            Back
          </Button>

          <div className="flex gap-3">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={isSaving}
                className="min-w-[200px]"
              >
                {isSaving ? "Saving..." : "Complete & Save"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isSaving}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonSetup;
