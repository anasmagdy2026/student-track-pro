import { useLocalStorage } from './useLocalStorage';
import { Payment } from '@/types';

export function usePayments() {
  const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);

  const addPayment = (studentId: string, month: string, amount: number) => {
    const existingIndex = payments.findIndex(
      p => p.studentId === studentId && p.month === month
    );

    if (existingIndex >= 0) {
      setPayments(prev =>
        prev.map((p, i) =>
          i === existingIndex
            ? { ...p, paid: true, paidAt: new Date().toISOString(), amount }
            : p
        )
      );
    } else {
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        studentId,
        month,
        amount,
        paid: true,
        paidAt: new Date().toISOString(),
        notified: false,
      };
      setPayments(prev => [...prev, newPayment]);
    }
  };

  const markAsUnpaid = (paymentId: string) => {
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId ? { ...p, paid: false, paidAt: undefined } : p
      )
    );
  };

  const markAsNotified = (paymentId: string) => {
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId ? { ...p, notified: true } : p
      )
    );
  };

  const getStudentPayments = (studentId: string) => {
    return payments.filter(p => p.studentId === studentId);
  };

  const getUnpaidStudents = (month: string) => {
    return payments.filter(p => p.month === month && !p.paid);
  };

  const isMonthPaid = (studentId: string, month: string) => {
    const payment = payments.find(
      p => p.studentId === studentId && p.month === month
    );
    return payment?.paid ?? false;
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
    addPayment,
    markAsUnpaid,
    markAsNotified,
    getStudentPayments,
    getUnpaidStudents,
    isMonthPaid,
    getPaymentStats,
  };
}
