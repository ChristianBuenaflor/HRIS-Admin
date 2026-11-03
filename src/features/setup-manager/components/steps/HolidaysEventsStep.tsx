import { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HolidayTypeManager } from '../HolidayTypeManager';
import type { HolidayFormData, StepComponentProps } from '../setupManagerTypes';
import { holidayAPI, type Holiday, type HolidayTypeRecord } from '../../services/holidayApi';
import { toHolidayDateKey } from '@/utils/holidayDate';

const formatHolidayDate = (dateValue: string) => {
    const [year, month, day] = toHolidayDateKey(dateValue).split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
};

export const HolidaysEventsStep = ({ setupData, setSetupData }: StepComponentProps) => {
    const [newItem, setNewItem] = useState<Omit<HolidayFormData, 'id'>>({
        name: '',
        date: '',
        type: '',
        holidayTypeId: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [holidayTypes, setHolidayTypes] = useState<HolidayTypeRecord[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [holidayToArchive, setHolidayToArchive] = useState<HolidayFormData | null>(null);

    const applyBackendHolidays = (holidays: Holiday[]) => {
        setSetupData({
            ...setupData,
            holidays: holidays
                .filter((holiday) => !holiday.is_archived)
                .map((holiday) => ({
                    id: holiday.id.toString(),
                    name: holiday.holiday_name,
                    date: toHolidayDateKey(holiday.holiday_date),
                    type: typeof holiday.holiday_type === 'object' && holiday.holiday_type !== null ? holiday.holiday_type.type_name : holiday.holiday_type || '',
                    holidayTypeId: holiday.holiday_type_id,
                })),
        });
    };

    const loadHolidays = async () => {
        try {
            const response = await holidayAPI.getAll();
            const holidays = response.data.data;
            applyBackendHolidays(Array.isArray(holidays) ? holidays : []);
        } catch (error) {
            console.error('Failed to load holidays:', error);
            toast.error('Failed to load holidays');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadHolidays();
        // The setup step loads the existing holidays once when it mounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveItem = async () => {
        if (!newItem.name.trim() || !newItem.date || !newItem.holidayTypeId) {
            toast.error('Please enter a name, date, and holiday type');
            return;
        }

        try {
            setIsSaving(true);
            const payload = {
                holiday_date: newItem.date,
                holiday_name: newItem.name.trim(),
                holiday_type_id: newItem.holidayTypeId,
            };
            if (editingId === null) await holidayAPI.create(payload);
            else await holidayAPI.update(Number(editingId), payload);
            setNewItem({ name: '', date: '', type: holidayTypes[0]?.type_name ?? '', holidayTypeId: holidayTypes[0]?.id ?? 0 });
            setEditingId(null);
            await loadHolidays();
            toast.success(editingId === null ? 'Holiday added successfully' : 'Holiday updated successfully');
        } catch (error: unknown) {
            toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Failed to save holiday' : 'Failed to save holiday');
        } finally {
            setIsSaving(false);
        }
    };

    const removeItem = async () => {
        if (!holidayToArchive) return;
        try {
            setIsSaving(true);
            await holidayAPI.archive(Number(holidayToArchive.id));
            setHolidayToArchive(null);
            await loadHolidays();
            toast.success('Holiday archived successfully');
        } catch (error: unknown) {
            toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Failed to archive holiday' : 'Failed to archive holiday');
        } finally {
            setIsSaving(false);
        }
    };

    const editItem = (item: HolidayFormData) => {
        setEditingId(item.id);
        setNewItem({ name: item.name, date: item.date, type: item.type, holidayTypeId: item.holidayTypeId });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewItem({ name: '', date: '', type: holidayTypes[0]?.type_name ?? '', holidayTypeId: holidayTypes[0]?.id ?? 0 });
    };

    return (
        <>
        <HolidayTypeManager onTypesChanged={(loadedTypes) => {
            setHolidayTypes(loadedTypes);
            setNewItem((current) => current.holidayTypeId ? current : { ...current, holidayTypeId: loadedTypes[0]?.id ?? 0, type: loadedTypes[0]?.type_name ?? '' });
        }} />
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Holidays
                </CardTitle>
                <CardDescription>Add company holidays and important events to your HRIS calendar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                    <div className="flex min-w-[720px] items-end gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor="holiday-event-name">Name</Label>
                        <Input id="holiday-event-name" value={newItem.name} onChange={(event) => setNewItem({ ...newItem, name: event.target.value })} placeholder="e.g. Independence Day" />
                    </div>
                    <div className="w-[180px] shrink-0 space-y-2">
                        <Label htmlFor="holiday-event-date">Date</Label>
                        <Input id="holiday-event-date" type="date" value={newItem.date} onChange={(event) => setNewItem({ ...newItem, date: event.target.value })} />
                    </div>
                    <div className="w-[160px] shrink-0 space-y-2">
                        <Label>Type</Label>
                        <Select value={newItem.holidayTypeId ? String(newItem.holidayTypeId) : undefined} onValueChange={(value) => { const holidayType = holidayTypes.find((item) => item.id === Number(value)); setNewItem({ ...newItem, holidayTypeId: Number(value), type: holidayType?.type_name ?? '' }); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {holidayTypes.map((holidayType) => <SelectItem key={holidayType.id} value={String(holidayType.id)}>{holidayType.type_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" onClick={() => void saveItem()} disabled={isSaving || holidayTypes.length === 0}>{editingId === null ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}{editingId === null ? 'Add' : 'Save'}</Button>
                        {editingId !== null && <Button type="button" variant="outline" size="icon" onClick={cancelEdit} aria-label="Cancel editing"><X className="w-4 h-4" /></Button>}
                    </div>
                    </div>
                </div>

                {isLoading ? <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">Loading holidays...</p> : setupData.holidays.length > 0 ? (
                    <div className="divide-y rounded-md border">
                        {setupData.holidays.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatHolidayDate(item.date)} - {item.type} Holiday</p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => editItem(item)} aria-label={`Edit ${item.name}`}><Pencil className="w-4 h-4" /></Button>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setHolidayToArchive(item)} disabled={isSaving} aria-label={`Archive ${item.name}`}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No holidays or events added yet.</p>}
            </CardContent>
        </Card>
        <Dialog open={holidayToArchive !== null} onOpenChange={(open) => !open && setHolidayToArchive(null)}>
            <DialogContent>
                <DialogHeader><DialogTitle>Archive holiday?</DialogTitle><DialogDescription>Archive {holidayToArchive?.name}? It will be removed from the active list.</DialogDescription></DialogHeader>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setHolidayToArchive(null)} disabled={isSaving}>Cancel</Button><Button type="button" variant="destructive" onClick={() => void removeItem()} disabled={isSaving}>Archive</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};