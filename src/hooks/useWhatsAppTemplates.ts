 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface WhatsAppTemplate {
   id: string;
   code: string;
   name: string;
   description: string | null;
   template: string;
   is_active: boolean;
   target: 'parent' | 'student' | 'both';
   created_at: string;
   updated_at: string;
 }
 
 export function useWhatsAppTemplates() {
   const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchTemplates = useCallback(async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from('whatsapp_templates')
       .select('*')
       .order('code');
     
     if (error) {
       console.error('Error fetching templates:', error);
     } else {
       setTemplates(data as WhatsAppTemplate[]);
     }
     setLoading(false);
   }, []);
 
   useEffect(() => {
     fetchTemplates();
   }, [fetchTemplates]);
 
   const getTemplateByCode = (code: string) => {
     return templates.find(t => t.code === code);
   };
 
   const updateTemplate = async (id: string, updates: Partial<Pick<WhatsAppTemplate, 'template' | 'is_active' | 'target'>>) => {
     const { error } = await supabase
       .from('whatsapp_templates')
       .update(updates)
       .eq('id', id);
     
     if (error) throw error;
     
     setTemplates(prev => 
       prev.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)
     );
   };
 
   return {
     templates,
     loading,
     getTemplateByCode,
     updateTemplate,
     refetch: fetchTemplates,
   };
 }