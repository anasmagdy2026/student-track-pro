import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching payments:', error);
    
    setPayments(data as Payment[] || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addPayment = async (studentId: string, month: string, amount: number) => {
    const existingPayment = payments.find(
      p => p.student_id === studentId && p.month === month
    );

    if (existingPayment) {
      const { error } = await supabase
        .from('payments')
        .update({ 
          paid: true, 
          paid_at: new Date().toISOString(), 
          amount 
        })
        .eq('id', existingPayment.id);
      
      if (error) throw error;
      
      setPayments(prev =>
        prev.map(p =>
          p.id === existingPayment.id
            ? { ...p, paid: true, paid_at: new Date().toISOString(), amount }
            : p
        )
      );
    } else {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          student_id: studentId,
          month,
          amount,
          paid: true,
          paid_at: new Date().toISOString(),
          notified: false,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setPayments(prev => [data as Payment, ...prev]);
    }
  };

  const markAsUnpaid = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ paid: false, paid_at: null })
      .eq('id', paymentId);
    
    if (error) throw error;
    
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId ? { ...p, paid: false, paid_at: undefined } : p
      )
    );
  };

  const markAsNotified = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ notified: true })
      .eq('id', paymentId);
    
    if (error) throw error;
    
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId ? { ...p, notified: true } : p
      )
    );
  };

  const getStudentPayments = (studentId: string) => {
    return payments.filter(p => p.student_id === studentId);
  };

  const getUnpaidStudents = (month: string) => {
    return payments.filter(p => p.month === month && !p.paid);
  };

  const isMonthPaid = (studentId: string, month: string) => {
    const payment = payments.find(
      p => p.student_id === studentId && p.month === month
    );
    return payment?.paid ?? false;
  };

  const getPaymentByMonth = (studentId: string, month: string) => {
    return payments.find(
      p => p.student_id === studentId && p.month === month
    );
  };

  const getPaymentStats = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthPayments = payments.filter(p => p.month === currentMonth);
    const paid = currentMonthPayments.filter(p => p.paid).length;
    const unpaid = currentMonthPayments.filter(p => !p.paid).length;
    const totalAmount = currentMonthPayments
      .filter(p => p.paid)
      .reduce((sum, p) => sum + p.amount, 0);
    return { paid, unpaid, totalAmount };
  };

  return {
    payments,
    loading,
    addPayment,
    markAsUnpaid,
    markAsNotified,
    getStudentPayments,
    getUnpaidStudents,
    isMonthPaid,
    getPaymentByMonth,
    getPaymentStats,
    refetch: fetchData,
  };
}
