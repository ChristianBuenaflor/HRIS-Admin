import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, ArrowRight, CalendarDays, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { holidayAPI, type Holiday, type HolidayPayload, type HolidayTypeRecord } from '../services/holidayApi';
import { HolidayTypeManager } from '../components/HolidayTypeManager';
import { toHolidayDateKey } from '@/utils/holidayDate';

const emptyForm: HolidayPayload = { holiday_date: '', holiday_name: '', holiday_type_id: 0 };

const formatHolidayDate = (dateValue: string) => {
    const [year, month, day] = toHolidayDateKey(dateValue).split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
};

const HolidaySetup = () => {
    const navigate = useNavigate();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [holidayTypes, setHolidayTypes] = useState<HolidayTypeRecord[]>([]);
    const [form, setForm] = useState<HolidayPayload>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [holidayToArchive, setHolidayToArchive] = useState<Holiday | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);

    const steps = [
        { label: 'Holiday Types', icon: Tags },
        { label: 'Holidays', icon: CalendarDays },
    ];

    const loadHolidays = async () => {
        try {
            const response = await holidayAPI.getAll();
            const data = response.data.data;
            setHolidays(Array.isArray(data) ? data.filter((holiday) => !holiday.is_archived) : []);
        } catch (error) {
            console.error('Failed to load holidays:', error);
            toast.error('Failed to load holidays');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadHolidays();
    }, []);

    const updateForm = (field: keyof HolidayPayload, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const saveHoliday = async () => {
        const name = form.holiday_name.trim();
        if (!name || !form.holiday_date || !form.holiday_type_id) {
            toast.error('Please enter a holiday name, date, and type');
            return;
        }

        try {
            setIsSaving(true);
            const payload = { ...form, holiday_name: name };
            if (editingId === null) {
                await holidayAPI.create(payload);
                toast.success('Holiday added successfully');
            } else {
                await holidayAPI.update(editingId, payload);
                toast.success('Holiday updated successfully');
            }
            cancelEdit();
            setIsHolidayDialogOpen(false);
            await loadHolidays();
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            toast.error(message || 'Failed to save holiday');
        } finally {
            setIsSaving(false);
        }
    };

    const editHoliday = (holiday: Holiday) => {
        setEditingId(holiday.id);
        setForm({ holiday_date: toHolidayDateKey(holiday.holiday_date), holiday_name: holiday.holiday_name, holiday_type_id: holiday.holiday_type_id });
        setIsHolidayDialogOpen(true);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const openCreateHoliday = () => {
        cancelEdit();
        setIsHolidayDialogOpen(true);
    };

    const archiveHoliday = async () => {
        if (!holidayToArchive) return;
        try {
            setIsSaving(true);
            await holidayAPI.archive(holidayToArchive.id);
            setHolidayToArchive(null);
            toast.success('Holiday archived successfully');
            await loadHolidays();
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            toast.error(message || 'Failed to archive holiday');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-100 px-6 py-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => navigate('/dashboard')} className="hover:text-blue-600 transition-colors">Dashboard</button>
                    <span className="text-gray-500">›</span>
                    <button onClick={() => navigate('/setup-manager')} className="hover:text-blue-600 transition-colors">Setup Manager</button>
                    <span className="text-gray-500">›</span>
                    <span className="text-gray-700 font-medium">Holidays</span>
                </div>
            </div>
            <div className="p-6 mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarDays className="w-8 h-8" />Holiday Setup</h1>
                    <p className="text-muted-foreground mt-2">Create holiday types first, then add holidays to your company calendar.</p>
                </div>
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
                            <span className="text-sm text-muted-foreground">{steps[currentStep].label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {steps.map((step, index) => <div key={step.label} className={`h-2 flex-1 rounded-full transition-colors ${index <= currentStep ? 'bg-primary' : 'bg-muted'}`} />)}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                return <button key={step.label} type="button" onClick={() => setCurrentStep(index)} className={`flex flex-col items-center gap-2 rounded-lg p-3 transition-colors ${index === currentStep ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}><span className={`flex h-10 w-10 items-center justify-center rounded-full ${index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-400'}`}><StepIcon className="h-5 w-5" /></span><span className="text-xs font-medium">{step.label}</span></button>;
                            })}
                        </div>
                    </CardContent>
                </Card>
                {currentStep === 0 && <HolidayTypeManager onTypesChanged={setHolidayTypes} />}
                {currentStep === 1 && <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle>Holidays</CardTitle>
                                <CardDescription>Keep your company holiday calendar up to date.</CardDescription>
                            </div>
                            <Button type="button" onClick={openCreateHoliday} disabled={holidayTypes.length === 0}>
                                <Plus className="w-4 h-4" />Add Holiday
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">Loading holidays...</p> : holidays.length ? <div className="divide-y rounded-md border">{holidays.map((holiday) => <div key={holiday.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="font-medium truncate">{holiday.holiday_name}</p><p className="text-sm text-muted-foreground">{formatHolidayDate(holiday.holiday_date)} - {typeof holiday.holiday_type === 'object' && holiday.holiday_type !== null ? holiday.holiday_type.type_name : holiday.holiday_type || 'Holiday'} Holiday</p></div><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => editHoliday(holiday)} aria-label={`Edit ${holiday.holiday_name}`}><Pencil className="w-4 h-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => setHolidayToArchive(holiday)} aria-label={`Archive ${holiday.holiday_name}`}><Trash2 className="w-4 h-4" /></Button></div></div>)}</div> : <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No holidays added yet.</p>}
                    </CardContent>
                </Card>}
                <Card>
                    <CardContent className="flex items-center justify-between pt-6">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} disabled={currentStep === 0}><ArrowLeft className="w-4 h-4" />Back</Button>
                        <span className="text-sm text-muted-foreground">{steps[currentStep].label}</span>
                        <Button type="button" onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))} disabled={currentStep === steps.length - 1}>Next<ArrowRight className="w-4 h-4" /></Button>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId === null ? 'Add Holiday' : 'Edit Holiday'}</DialogTitle>
                        <DialogDescription>Enter the holiday details for your company calendar.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2"><Label htmlFor="holiday-name">Name</Label><Input id="holiday-name" value={form.holiday_name} onChange={(event) => updateForm('holiday_name', event.target.value)} placeholder="e.g. Independence Day" /></div>
                        <div className="space-y-2"><Label htmlFor="holiday-date">Date</Label><Input id="holiday-date" type="date" value={form.holiday_date} onChange={(event) => updateForm('holiday_date', event.target.value)} /></div>
                        <div className="space-y-2"><Label>Type</Label><Select value={form.holiday_type_id ? String(form.holiday_type_id) : undefined} onValueChange={(value) => updateForm('holiday_type_id', value)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{holidayTypes.map((holidayType) => <SelectItem key={holidayType.id} value={String(holidayType.id)}>{holidayType.type_name}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsHolidayDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button type="button" onClick={() => void saveHoliday()} disabled={isSaving || holidayTypes.length === 0}>{editingId === null ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}{editingId === null ? 'Add Holiday' : 'Save Changes'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={holidayToArchive !== null} onOpenChange={(open) => !open && setHolidayToArchive(null)}><DialogContent><DialogHeader><DialogTitle>Archive holiday?</DialogTitle><DialogDescription>Archive {holidayToArchive?.holiday_name}? It will be removed from the active list.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setHolidayToArchive(null)} disabled={isSaving}>Cancel</Button><Button type="button" variant="destructive" onClick={() => void archiveHoliday()} disabled={isSaving}><Archive className="w-4 h-4" />Archive</Button></DialogFooter></DialogContent></Dialog>
        </div>
    );
};

export default HolidaySetup;
