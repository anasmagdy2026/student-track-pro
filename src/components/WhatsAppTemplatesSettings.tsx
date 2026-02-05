 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from '@/components/ui/dialog';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from '@/components/ui/accordion';
 import { useWhatsAppTemplates, WhatsAppTemplate } from '@/hooks/useWhatsAppTemplates';
 import { MessageCircle, Edit, User, Users, Save, Info } from 'lucide-react';
 import { toast } from 'sonner';
 
 const TARGET_LABELS = {
   parent: 'ولي الأمر',
   student: 'الطالب',
   both: 'الطالب وولي الأمر',
 };
 
 const VARIABLE_HINTS: Record<string, string[]> = {
   absence: ['{studentName}', '{date}'],
   payment_reminder: ['{studentName}', '{month}', '{amount}'],
   exam_result: ['{studentName}', '{examName}', '{score}', '{maxScore}', '{percentage}', '{label}'],
   late_parent: ['{studentName}', '{groupName}', '{date}', '{groupTime}', '{lateMinutes}'],
   late_student: ['{studentName}', '{groupName}', '{date}', '{groupTime}', '{lateMinutes}'],
   monthly_report: ['{studentName}', '{monthLabel}', '{groupLine}', '{presentCount}', '{totalCount}', '{attendancePercentage}', '{absentCount}', '{paidStatus}', '{amount}', '{examAverage}', '{lessonAverage}', '{overallPercentage}'],
   next_session: ['{studentName}', '{groupName}', '{content}'],
 };
 
 export function WhatsAppTemplatesSettings() {
   const { templates, loading, updateTemplate } = useWhatsAppTemplates();
   const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
   const [editForm, setEditForm] = useState({
     template: '',
     is_active: true,
     target: 'parent' as 'parent' | 'student' | 'both',
   });
   const [saving, setSaving] = useState(false);
 
   const openEditDialog = (template: WhatsAppTemplate) => {
     setEditingTemplate(template);
     setEditForm({
       template: template.template,
       is_active: template.is_active,
       target: template.target,
     });
   };
 
   const handleSave = async () => {
     if (!editingTemplate) return;
     setSaving(true);
     try {
       await updateTemplate(editingTemplate.id, editForm);
       toast.success('تم حفظ التعديلات');
       setEditingTemplate(null);
     } catch (err) {
       toast.error('تعذّر حفظ التعديلات');
     } finally {
       setSaving(false);
     }
   };
 
   const handleToggleActive = async (template: WhatsAppTemplate) => {
     try {
       await updateTemplate(template.id, { is_active: !template.is_active });
       toast.success(template.is_active ? 'تم تعطيل الرسالة' : 'تم تفعيل الرسالة');
     } catch (err) {
       toast.error('تعذّر تغيير الحالة');
     }
   };
 
   if (loading) {
     return <p className="text-muted-foreground">جاري التحميل...</p>;
   }
 
   return (
     <div className="space-y-4">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <MessageCircle className="h-5 w-5 text-primary" />
             قوالب رسائل الواتساب
           </CardTitle>
           <CardDescription>
             تعديل نصوص الرسائل المرسلة للطلاب وأولياء الأمور
           </CardDescription>
         </CardHeader>
         <CardContent>
           <Accordion type="single" collapsible className="space-y-2">
             {templates.map((template) => (
               <AccordionItem key={template.id} value={template.id} className="border rounded-lg px-4">
                 <AccordionTrigger className="hover:no-underline">
                   <div className="flex items-center gap-3 flex-1">
                     <div className="flex-1 text-right">
                       <span className="font-medium">{template.name}</span>
                       {template.description && (
                         <span className="text-muted-foreground text-sm mr-2">
                           - {template.description}
                         </span>
                       )}
                     </div>
                     <Badge variant={template.is_active ? 'default' : 'secondary'}>
                       {template.is_active ? 'مفعّل' : 'معطّل'}
                     </Badge>
                     <Badge variant="outline" className="gap-1">
                       {template.target === 'student' ? (
                         <User className="h-3 w-3" />
                       ) : (
                         <Users className="h-3 w-3" />
                       )}
                       {TARGET_LABELS[template.target]}
                     </Badge>
                   </div>
                 </AccordionTrigger>
                 <AccordionContent>
                   <div className="space-y-4 pt-2">
                     <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm font-mono">
                       {template.template}
                     </div>
                     
                     {VARIABLE_HINTS[template.code] && (
                       <div className="flex flex-wrap gap-2 text-xs">
                         <span className="text-muted-foreground flex items-center gap-1">
                           <Info className="h-3 w-3" />
                           المتغيرات المتاحة:
                         </span>
                         {VARIABLE_HINTS[template.code].map((v) => (
                           <Badge key={v} variant="outline" className="font-mono">
                             {v}
                           </Badge>
                         ))}
                       </div>
                     )}
                     
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Switch
                           checked={template.is_active}
                           onCheckedChange={() => handleToggleActive(template)}
                         />
                         <Label>{template.is_active ? 'مفعّل' : 'معطّل'}</Label>
                       </div>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => openEditDialog(template)}
                         className="gap-2"
                       >
                         <Edit className="h-4 w-4" />
                         تعديل
                       </Button>
                     </div>
                   </div>
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
         </CardContent>
       </Card>
 
       {/* Edit Dialog */}
       <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>تعديل قالب: {editingTemplate?.name}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>نص الرسالة</Label>
               <Textarea
                 value={editForm.template}
                 onChange={(e) => setEditForm({ ...editForm, template: e.target.value })}
                 rows={10}
                 className="font-mono text-sm"
                 dir="rtl"
               />
               {editingTemplate && VARIABLE_HINTS[editingTemplate.code] && (
                 <div className="flex flex-wrap gap-2 text-xs">
                   <span className="text-muted-foreground">المتغيرات:</span>
                   {VARIABLE_HINTS[editingTemplate.code].map((v) => (
                     <Badge 
                       key={v} 
                       variant="outline" 
                       className="font-mono cursor-pointer hover:bg-primary/10"
                       onClick={() => {
                         // Insert variable at cursor position or end
                         setEditForm(prev => ({
                           ...prev,
                           template: prev.template + v
                         }));
                       }}
                     >
                       {v}
                     </Badge>
                   ))}
                 </div>
               )}
             </div>
 
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>المستهدف</Label>
                 <Select 
                   value={editForm.target} 
                   onValueChange={(v) => setEditForm({ ...editForm, target: v as any })}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="parent">ولي الأمر</SelectItem>
                     <SelectItem value="student">الطالب</SelectItem>
                     <SelectItem value="both">الطالب وولي الأمر</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>الحالة</Label>
                 <div className="flex items-center gap-2 h-10">
                   <Switch
                     checked={editForm.is_active}
                     onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
                   />
                   <span>{editForm.is_active ? 'مفعّل' : 'معطّل'}</span>
                 </div>
               </div>
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setEditingTemplate(null)}>
               إلغاء
             </Button>
             <Button onClick={handleSave} disabled={saving} className="gap-2">
               <Save className="h-4 w-4" />
               {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }