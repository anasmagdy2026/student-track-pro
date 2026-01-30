import { useMemo, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, type UserProfile } from '@/hooks/useAdminUsers';
import { Settings as SettingsIcon, User, Lock, Eye, EyeOff, Users, Shield, Key, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

export default function Settings() {
  const { user, updatePassword } = useAuth();
  const { users, loading, isAdmin, createUser, updateUser, resetPassword } = useAdminUsers();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState<UserProfile | null>(null);

  const [createForm, setCreateForm] = useState({
    email: '',
    username: '',
    password: '',
    is_admin: false,
  });
  const [editForm, setEditForm] = useState({ username: '', email: '', is_active: true, is_admin: false });
  const [resetForm, setResetForm] = useState('');

  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
    []
  );

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'كلمة المرور غير صالحة');
      return;
    }

    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error('تعذّر تحديث كلمة المرور. أعد المحاولة.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    toast.success('تم تحديث كلمة المرور بنجاح');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({
        email: createForm.email.trim(),
        username: createForm.username.trim(),
        password: createForm.password,
        is_active: true,
        is_admin: createForm.is_admin,
      });
      toast.success('تم إنشاء المستخدم بنجاح');
      setShowCreateDialog(false);
      setCreateForm({ email: '', username: '', password: '', is_admin: false });
    } catch (err: any) {
      toast.error(err.message || 'تعذّر إنشاء المستخدم');
    }
  };

  const openEditDialog = useCallback((u: UserProfile) => {
    setEditingUser(u);
    setEditForm({
      username: u.username,
      email: u.email || '',
      is_active: u.is_active,
      is_admin: u.is_admin || false,
    });
  }, []);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateUser(editingUser.user_id, {
        username: editForm.username.trim(),
        email: editForm.email.trim() || undefined,
        is_active: editForm.is_active,
        is_admin: editForm.is_admin,
      });
      toast.success('تم تحديث بيانات المستخدم');
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.message || 'تعذّر التحديث');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetDialog) return;
    try {
      await resetPassword(showResetDialog.user_id, resetForm);
      toast.success('تم إعادة تعيين كلمة المرور');
      setShowResetDialog(null);
      setResetForm('');
    } catch (err: any) {
      toast.error(err.message || 'تعذّر إعادة تعيين كلمة المرور');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة بيانات الحساب وإعدادات النظام
          </p>
        </div>

        <Tabs defaultValue="account">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">حسابي</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>}
          </TabsList>

          <TabsContent value="account" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  الحساب
                </CardTitle>
                <CardDescription>بيانات حسابك الحالية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="email">اسم المستخدم</Label>
                  <Input id="email" value={user?.user_metadata?.username ?? user?.email ?? ''} readOnly placeholder="-" />
                  <p className="text-sm text-muted-foreground">
                    هذا هو اسم المستخدم للدخول إلى النظام.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  تغيير كلمة المرور
                </CardTitle>
                <CardDescription>تحديث كلمة المرور الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة"
                        className="pl-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                    />
                  </div>

                  <Button type="submit" className="gap-2">
                    <Lock className="h-4 w-4" />
                    تغيير كلمة المرور
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        المستخدمون
                      </CardTitle>
                      <CardDescription>إضافة وتعديل حسابات المدراء والمستخدمين</CardDescription>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <User className="h-4 w-4 ml-2" />
                      إضافة مستخدم
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-muted-foreground">جاري التحميل...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم المستخدم</TableHead>
                          <TableHead>البريد</TableHead>
                          <TableHead>الصلاحية</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.email || '-'}</TableCell>
                            <TableCell>
                              {u.is_admin ? (
                                <Badge className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  مدير
                                </Badge>
                              ) : (
                                <Badge variant="outline">مستخدم</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {u.is_active ? (
                                <Badge variant="default">نشط</Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <UserX className="h-3 w-3 ml-1" />
                                  معطّل
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(u)}>
                                  تعديل
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowResetDialog(u)}>
                                  <Key className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>أدخل بيانات المستخدم الجديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username">اسم المستخدم</Label>
                  <Input
                    id="create-username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="اترك فارغاً لتوليد بريد داخلي"
                  />
                  <p className="text-xs text-muted-foreground">
                    إذا تُرك فارغاً، سيتم توليد بريد داخلي تلقائياً
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">كلمة المرور</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={createForm.is_admin}
                    onCheckedChange={(v) => setCreateForm((p) => ({ ...p, is_admin: v }))}
                  />
                  <Label>منح صلاحيات مدير</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إنشاء</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <form onSubmit={handleUpdateUser}>
              <DialogHeader>
                <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
                <DialogDescription>تحديث معلومات {editingUser?.username}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">اسم المستخدم</Label>
                  <Input
                    id="edit-username"
                    value={editForm.username}
                    onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.is_active}
                    onCheckedChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))}
                  />
                  <Label>الحساب نشط</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.is_admin}
                    onCheckedChange={(v) => setEditForm((p) => ({ ...p, is_admin: v }))}
                  />
                  <Label>صلاحيات مدير</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={!!showResetDialog} onOpenChange={(open) => !open && (setShowResetDialog(null), setResetForm(''))}>
          <DialogContent>
            <form onSubmit={handleResetPassword}>
              <DialogHeader>
                <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
                <DialogDescription>
                  أدخل كلمة المرور الجديدة للمستخدم {showResetDialog?.username}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">كلمة المرور الجديدة</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={resetForm}
                    onChange={(e) => setResetForm(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (setShowResetDialog(null), setResetForm(''))}
                >
                  إلغاء
                </Button>
                <Button type="submit">إعادة تعيين</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
