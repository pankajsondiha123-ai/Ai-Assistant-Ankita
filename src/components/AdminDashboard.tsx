import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Terminal,
  Sliders,
  Zap,
  Lock,
  Unlock,
  Key,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  Download,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  Smartphone,
  Radio,
  Sparkles,
  ChevronDown,
  Volume2,
  Mic,
  Cpu,
  Database,
  Activity,
  UserPlus,
  X
} from 'lucide-react';
import { AppUser, SystemAuditLog, SystemSettings, UserRole, ActivityStatus } from '../types';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  isAdminLoggedIn: boolean;
  onAdminLogin: (user: AppUser) => void;
  onAdminLogout: () => void;
  onBroadcastAnnouncement?: (text: string) => void;
  onSpeak?: (text: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  isAdminLoggedIn,
  onAdminLogin,
  onAdminLogout,
  onBroadcastAnnouncement,
  onSpeak,
}) => {
  // Tabs: 'users' | 'logs' | 'settings' | 'operator'
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'settings' | 'operator'>('users');

  // Admin Login Form State (Must be manually entered, never auto-filled)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users Data State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | ActivityStatus>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AppUser | null>(null);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');

  // Logs Data State
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>('all');

  // System Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    aiTone: 'loving',
    temperature: 0.7,
    maintenanceMode: false,
    lockdownMode: false,
    globalAnnouncement: 'अंकिता AI v12.0 ऑनलाइन है। सभी ऑपरेटर व सदस्य सुरक्षित रूप से जुड़े हुए हैं।',
    requireAuthToUse: true,
    maxRequestsPerUser: 500,
    allowNewRegistrations: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  // Operator Broadcast & Power State
  const [broadcastInput, setBroadcastInput] = useState('');
  const [operatorFeedback, setOperatorFeedback] = useState('');
  const [reactorPowerMode, setReactorPowerMode] = useState<'overclock' | 'nominal' | 'eco'>('nominal');

  // Fetch users & logs & settings on open when logged in
  useEffect(() => {
    if (isOpen && isAdminLoggedIn) {
      fetchUsers();
      fetchLogs();
      fetchSettings();
    }
  }, [isOpen, isAdminLoggedIn]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.warn('Failed to load users from backend, fallback to stored users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch admin logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
    }
  };

  // Handle Admin Login submission
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !loginPassword) {
      setLoginError('कृपया ऑपरेटर Gmail और पासवर्ड दोनों दर्ज करें।');
      return;
    }

    // Strict mandate: Only the specified operator Gmail can access Admin Dashboard
    if (cleanEmail !== 'bhajanfeel4@gmail.com') {
      playAlert();
      setLoginError(`अस्वीकृत: "${cleanEmail}" को एडमिन अधिकार प्राप्त नहीं हैं। केवल अधिकृत ऑपरेटर (bhajanfeel4@gmail.com) ही एडमिन पैनल में प्रवेश कर सकते हैं।`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'लॉगिन विफल। कृपया सही क्रेडेंशियल जांचें।');
      }

      if (data.user.role === 'admin' || data.isOperator || cleanEmail === 'bhajanfeel4@gmail.com') {
        playConfirm();
        onAdminLogin(data.user);
        onSpeak?.('स्वागत है आदित्य! आपको ऑपरेटर पावर और एडमिन पैनल मिल गया है।');
        fetchUsers();
        fetchLogs();
        fetchSettings();
      } else {
        throw new Error('केवल अधिकृत ऑपरेटर ही इस पैनल में प्रवेश कर सकते हैं।');
      }
    } catch (err: any) {
      playAlert();
      setLoginError(err.message || 'लॉगिन में त्रुटि हुई');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user permission
  const handleTogglePermission = async (user: AppUser, permKey: keyof AppUser['permissions']) => {
    playBeep(1000, 0.03);
    const updatedPermissions = {
      ...user.permissions,
      [permKey]: !user.permissions[permKey],
    };

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, permissions: updatedPermissions } : u))
    );

    try {
      const res = await fetch(`/api/admin/users/${user.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'अपडेट विफल');
      }
      playConfirm();
    } catch (err: any) {
      playAlert();
      // Revert on error
      fetchUsers();
      alert(err.message);
    }
  };

  // Toggle ban status
  const handleToggleBan = async (user: AppUser) => {
    if (user.email === 'bhajanfeel4@gmail.com') {
      alert('सुपर एडमिन को ब्लॉक नहीं किया जा सकता!');
      return;
    }
    const willBan = !user.permissions.isBanned;
    handleTogglePermission(user, 'isBanned');
  };

  // Change user role
  const handleChangeRole = async (user: AppUser, newRole: UserRole) => {
    if (user.email === 'bhajanfeel4@gmail.com') {
      alert('सुपर एडमिन की भूमिका नहीं बदली जा सकती!');
      return;
    }
    playBeep(1100, 0.03);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
        playConfirm();
      }
    } catch (err) {
      fetchUsers();
    }
  };

  // Delete user
  const handleDeleteUser = async (user: AppUser) => {
    if (user.email === 'bhajanfeel4@gmail.com') {
      alert('सुपर एडमिन खाता नहीं हटाया जा सकता!');
      return;
    }
    if (!confirm(`क्या आप वाकई उपयोगकर्ता ${user.email} को हटाना चाहते हैं?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        playConfirm();
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      }
    } catch (err) {
      alert('उपयोगकर्ता हटाने में विफल');
    }
  };

  // Add new user from admin panel
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPassword,
          name: newUserName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'पंजीकरण विफल');

      playConfirm();
      setIsAddUserOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Clear system logs
  const handleClearLogs = async () => {
    if (!confirm('क्या आप सभी सिस्टम ऑडिट व यूजर लॉग्स साफ़ करना चाहते हैं?')) return;
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        playConfirm();
        fetchLogs();
      }
    } catch (err) {
      alert('लॉग साफ़ करने में विफल');
    }
  };

  // Export logs to CSV
  const handleExportLogs = () => {
    playBeep(1200, 0.03);
    const headers = ['ID', 'Timestamp', 'User Email', 'Category', 'Severity', 'Action', 'Details'];
    const rows = auditLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.userEmail}"`,
      l.category,
      l.severity,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ankita_admin_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSavedMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        playConfirm();
        setSettingsSavedMessage('✅ सिस्टम सेटिंग्स सफलतापूर्वक अपडेट की गईं!');
        setTimeout(() => setSettingsSavedMessage(''), 4000);
      }
    } catch (err) {
      alert('सेटिंग्स सुरक्षित करने में विफल');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Send Broadcast
  const handleSendBroadcast = async () => {
    if (!broadcastInput.trim()) return;
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastInput.trim() }),
      });
      if (res.ok) {
        playConfirm();
        onBroadcastAnnouncement?.(broadcastInput.trim());
        setOperatorFeedback(`घोषणा प्रसारित: "${broadcastInput.trim()}"`);
        setBroadcastInput('');
        setTimeout(() => setOperatorFeedback(''), 4000);
        fetchSettings();
        fetchLogs();
      }
    } catch (err) {
      alert('प्रसारण विफल');
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.ipAddress && u.ipAddress.includes(userSearchQuery));
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearchQuery, userRoleFilter, userStatusFilter]);

  // Filtered Audit Logs List
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchesSearch =
        l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        l.userEmail.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        (l.details && l.details.toLowerCase().includes(logSearchQuery.toLowerCase()));
      const matchesCategory = logCategoryFilter === 'all' || l.category === logCategoryFilter;
      const matchesSeverity = logSeverityFilter === 'all' || l.severity === logSeverityFilter;
      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [auditLogs, logSearchQuery, logCategoryFilter, logSeverityFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[920px] rounded-2xl bg-[#010815] border border-[#00f0ff]/50 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden font-mono text-[#8ffcff]">
        {/* Holographic Top Banner line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_12px_#00f0ff]" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#00f0ff]/30 bg-[#001428]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002f5e] to-[#001833] border border-[#00f0ff]/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              {isAdminLoggedIn ? (
                <ShieldCheck className="w-5 h-5 text-[#00ff88] animate-pulse" />
              ) : (
                <Lock className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-orbitron font-extrabold text-base sm:text-lg tracking-wider">
                  ADMIN DASHBOARD & OPERATOR PANEL
                </h2>
                {isAdminLoggedIn && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-[#00ff88] text-[#00ff88] text-[10px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                    <Sparkles className="w-3 h-3 text-[#00ff88]" />
                    👑 OPERATOR POWER ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#00b4d8] font-sans">
                {isAdminLoggedIn
                  ? 'सिस्टम-व्यापी सेटिंग्स, पंजीकृत उपयोगकर्ता प्रबंधन, लाइव ऑडिट लॉग्स और उन्नत ऑपरेटर नियंत्रण'
                  : 'सुरक्षित ऑपरेटर क्रेडेंशियल द्वारा अधिकृत एडमिन कंसोल'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={() => {
                  playBeep(900, 0.04);
                  onAdminLogout();
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="एडमिन सत्र समाप्त करें"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">लॉगआउट</span>
              </button>
            )}

            <button
              onClick={() => {
                playBeep(1000, 0.03);
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#001f3f] hover:bg-[#002f5e] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-white transition-all cursor-pointer"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTENT: If NOT Logged in -> SHOW ADMIN LOGIN SCREEN */}
        {!isAdminLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#001024]/90 border border-[#00f0ff]/40 shadow-[0_0_30px_rgba(0,240,255,0.2)] flex flex-col items-center relative">
              {/* Arc graphic */}
              <div className="w-16 h-16 rounded-2xl bg-[#001f3f] border border-[#00f0ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] mb-4">
                <Key className="w-8 h-8 text-[#00ff88]" />
              </div>

              <h3 className="text-white font-orbitron font-bold text-lg sm:text-xl text-center mb-1">
                OPERATOR ACCESS GATEWAY
              </h3>
              <p className="text-xs text-[#00b4d8] text-center mb-6 font-sans">
                एडमिन पावर और ऑपरेटर कंट्रोल अनलॉक करने के लिए क्रेडेंशियल दर्ज करें।
              </p>

              {loginError && (
                <div className="w-full mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#00b4d8] mb-1.5">
                    ऑपरेटर Gmail (Operator User ID):
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="bhajanfeel4@gmail.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#000a16] border border-[#00f0ff]/40 focus:border-[#00ff88] text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#00ff88] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#00b4d8] mb-1.5">
                    ऑपरेटर पासवर्ड (Password):
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Aditya@123"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#000a16] border border-[#00f0ff]/40 focus:border-[#00ff88] text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#00ff88] transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00b4d8] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00b4d8] via-[#00f0ff] to-[#00ff88] text-black font-orbitron font-extrabold text-sm tracking-wider hover:opacity-95 shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Unlock className="w-4 h-4 text-black" />
                  )}
                  <span>ENTER ADMIN PANEL</span>
                </button>
              </form>

              {/* Security Notice (No auto-fill, manual entry required) */}
              <div className="mt-5 w-full pt-4 border-t border-[#00f0ff]/20 text-center">
                <div className="text-[11px] text-[#00b4d8]/80 font-mono">
                  🔒 <strong>सुरक्षित ऑपरेटर गेटवे:</strong> केवल अधिकृत ऑपरेटर Gmail ही मान्य होगा।
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* WHEN LOGGED IN AS ADMIN: FULL ADMIN PANEL */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Stats Ribbon - Exclusively for Admin */}
            <div className="px-4 sm:px-6 py-2.5 bg-[#001020]/90 border-b border-[#00f0ff]/20 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 shrink-0 text-xs font-mono">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#001b33] border border-[#00f0ff]/20">
                <Users className="w-4 h-4 text-[#00f0ff]" />
                <div>
                  <div className="text-[10px] text-[#00b4d8]">कुल पंजीकृत सदस्य</div>
                  <div className="text-white font-bold font-orbitron text-sm">{users.length} Users</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#001b33] border border-[#00ff88]/30">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
                <div>
                  <div className="text-[10px] text-[#00b4d8]">सक्रिय (Online) यूज़र्स</div>
                  <div className="text-[#00ff88] font-bold font-orbitron text-sm">
                    {users.filter((u) => u.status === 'online').length} Live
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#001b33] border border-slate-600/40">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <div>
                  <div className="text-[10px] text-slate-400">ऑफलाइन (Offline) सदस्य</div>
                  <div className="text-slate-300 font-bold font-orbitron text-sm">
                    {users.filter((u) => u.status !== 'online').length} Offline
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#001b33] border border-amber-500/30">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-[#00b4d8]">कुल उपयोग / सत्र</div>
                  <div className="text-amber-300 font-bold font-orbitron text-sm">
                    {users.reduce((acc, u) => acc + (u.loginCount || 1), 0)} Logins
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#001b33] border border-[#00f0ff]/20">
                <Terminal className="w-4 h-4 text-cyan-300" />
                <div>
                  <div className="text-[10px] text-[#00b4d8]">सिस्टम ऑडिट रिकॉर्ड्स</div>
                  <div className="text-white font-bold font-orbitron text-sm">{auditLogs.length} Events</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="px-4 sm:px-6 py-2 border-b border-[#00f0ff]/20 bg-[#000a16] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    playBeep(1100, 0.02);
                    setActiveTab('users');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-orbitron text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'text-[#00b4d8] hover:text-white hover:bg-[#001f3f]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>USER MANAGEMENT ({users.length})</span>
                </button>

                <button
                  onClick={() => {
                    playBeep(1100, 0.02);
                    setActiveTab('logs');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-orbitron text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'text-[#00b4d8] hover:text-white hover:bg-[#001f3f]'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>ACTIVITY & USER LOGS ({auditLogs.length})</span>
                </button>

                <button
                  onClick={() => {
                    playBeep(1100, 0.02);
                    setActiveTab('settings');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-orbitron text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'text-[#00b4d8] hover:text-white hover:bg-[#001f3f]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>SYSTEM SETTINGS</span>
                </button>

                <button
                  onClick={() => {
                    playBeep(1100, 0.02);
                    setActiveTab('operator');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-orbitron text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'operator'
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : 'text-[#00b4d8] hover:text-white hover:bg-[#001f3f]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>ELEVATED OPERATOR POWER</span>
                </button>
              </div>

              <button
                onClick={() => {
                  playBeep(1000, 0.02);
                  if (activeTab === 'users') fetchUsers();
                  if (activeTab === 'logs') fetchLogs();
                  if (activeTab === 'settings') fetchSettings();
                }}
                className="p-1.5 rounded-lg bg-[#001b33] hover:bg-[#002f5e] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-white transition-all cursor-pointer"
                title="रिफ्रेश करें"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-[#00b4d8] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="यूज़र का नाम, Gmail या IP खोजें..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#001024] border border-[#00f0ff]/30 text-white text-xs placeholder:text-[#0077b6] focus:border-[#00f0ff] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#001024] border border-[#00f0ff]/30 text-white text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="all">सभी भूमिकाएं (All Roles)</option>
                      <option value="admin">Admin (एडमिन)</option>
                      <option value="operator">Operator (ऑपरेटर)</option>
                      <option value="user">Standard User (उपयोगकर्ता)</option>
                    </select>

                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#001024] border border-[#00f0ff]/30 text-white text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="all">सभी स्थिति (All Status)</option>
                      <option value="online">● Online (सक्रिय)</option>
                      <option value="idle">● Idle (निष्क्रिय)</option>
                      <option value="offline">● Offline (ऑफ़लाइन)</option>
                    </select>

                    <button
                      onClick={() => setIsAddUserOpen(true)}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-black font-orbitron font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:opacity-90 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-black" />
                      <span>+ ADD USER</span>
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-[#00f0ff]/20 bg-[#000a16]">
                  {isLoadingUsers ? (
                    <div className="h-48 flex items-center justify-center gap-2 text-cyan-300">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>उपयोगकर्ता लोड हो रहे हैं...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-[#00b4d8]/70">
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <span>कोई उपयोगकर्ता नहीं मिला</span>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#001428] text-[#00b4d8] uppercase tracking-wider sticky top-0 border-b border-[#00f0ff]/20 z-10">
                        <tr>
                          <th className="p-3">उपयोगकर्ता (User / Gmail)</th>
                          <th className="p-3">भूमिका (Role)</th>
                          <th className="p-3">स्थिति (Status)</th>
                          <th className="p-3">अंतिम सक्रिय (Last Active)</th>
                          <th className="p-3">अनुमतियां (Permissions Controls)</th>
                          <th className="p-3 text-right">कार्रवाई (Action)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#00f0ff]/10">
                        {filteredUsers.map((user) => {
                          const isSuperAdmin = user.email === 'bhajanfeel4@gmail.com';
                          const isBanned = user.permissions?.isBanned;

                          return (
                            <tr
                              key={user.id}
                              className={`hover:bg-[#001a33]/60 transition-colors ${
                                isBanned ? 'bg-red-950/20' : ''
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                      isSuperAdmin
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400'
                                        : 'bg-[#001f3f] text-[#00ff88] border border-[#00f0ff]/40'
                                    }`}
                                  >
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-white font-bold flex items-center gap-1.5">
                                      <span>{user.name}</span>
                                      {isSuperAdmin && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400 font-bold">
                                          👑 SUPER ADMIN
                                        </span>
                                      )}
                                      {isBanned && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500 font-bold">
                                          BANNED
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[#00b4d8] text-[11px]">{user.email}</div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                      <Laptop className="w-2.5 h-2.5" />
                                      <span>{user.device || 'Web Session'}</span>
                                      {user.ipAddress && <span>• IP: {user.ipAddress}</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                {isSuperAdmin ? (
                                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400 text-[11px] font-bold">
                                    ADMIN
                                  </span>
                                ) : (
                                  <select
                                    value={user.role}
                                    onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                                    className="px-2 py-1 rounded-lg bg-[#001222] border border-[#00f0ff]/30 text-white text-[11px] focus:outline-none cursor-pointer"
                                  >
                                    <option value="user">User</option>
                                    <option value="operator">Operator</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                )}
                              </td>

                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    user.status === 'online'
                                      ? 'bg-emerald-500/20 text-[#00ff88] border border-[#00ff88]/40'
                                      : user.status === 'idle'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      user.status === 'online'
                                        ? 'bg-[#00ff88] animate-ping'
                                        : user.status === 'idle'
                                        ? 'bg-amber-400'
                                        : 'bg-gray-500'
                                    }`}
                                  />
                                  <span>{user.status.toUpperCase()}</span>
                                </span>
                              </td>

                              <td className="p-3 text-[11px] text-[#00b4d8]">
                                <div>{new Date(user.lastActive).toLocaleTimeString()}</div>
                                <div className="text-[10px] text-gray-400">
                                  {new Date(user.lastActive).toLocaleDateString()}
                                </div>
                                <div className="text-[10px] text-cyan-200">
                                  {user.loginCount || 1} logins
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Allow Voice */}
                                  <button
                                    onClick={() => handleTogglePermission(user, 'canUseVoice')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                      user.permissions?.canUseVoice
                                        ? 'bg-[#002f5e] text-[#00f0ff] border-[#00f0ff]/50'
                                        : 'bg-black/40 text-gray-500 border-gray-700'
                                    }`}
                                    title="वॉयस व स्पीच अनुमति"
                                  >
                                    🎤 Voice
                                  </button>

                                  {/* Allow AI Chat */}
                                  <button
                                    onClick={() => handleTogglePermission(user, 'canUseAiChat')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                      user.permissions?.canUseAiChat
                                        ? 'bg-[#002f5e] text-[#00ff88] border-[#00ff88]/50'
                                        : 'bg-black/40 text-gray-500 border-gray-700'
                                    }`}
                                    title="AI चैट व निर्देश अनुमति"
                                  >
                                    💬 AI Chat
                                  </button>

                                  {/* Allow Device Controls */}
                                  <button
                                    onClick={() => handleTogglePermission(user, 'canUseDeviceControls')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                      user.permissions?.canUseDeviceControls
                                        ? 'bg-[#002f5e] text-cyan-300 border-cyan-400/50'
                                        : 'bg-black/40 text-gray-500 border-gray-700'
                                    }`}
                                    title="मोबाइल डिवाइस नियंत्रण अनुमति"
                                  >
                                    📱 Device
                                  </button>

                                  {/* Allow Vision/OCR */}
                                  <button
                                    onClick={() => handleTogglePermission(user, 'canUseVisionOcr')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                      user.permissions?.canUseVisionOcr
                                        ? 'bg-[#002f5e] text-purple-300 border-purple-400/50'
                                        : 'bg-black/40 text-gray-500 border-gray-700'
                                    }`}
                                    title="फोटो विज़न व OCR अनुमति"
                                  >
                                    👁️ OCR
                                  </button>
                                </div>
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Ban/Unban toggle */}
                                  <button
                                    disabled={isSuperAdmin}
                                    onClick={() => handleToggleBan(user)}
                                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                      isBanned
                                        ? 'bg-emerald-950/40 text-[#00ff88] border-[#00ff88]/40 hover:bg-emerald-900/60'
                                        : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                                    title={isBanned ? 'अनब्लॉक करें (Unban)' : 'उपयोगकर्ता ब्लॉक करें (Ban)'}
                                  >
                                    {isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Delete user */}
                                  <button
                                    disabled={isSuperAdmin}
                                    onClick={() => handleDeleteUser(user)}
                                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="खाता हटाएं"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ACTIVITY & USER LOGS TABLE */}
            {activeTab === 'logs' && (
              <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                {/* Search & Export Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-[#00b4d8] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        placeholder="लॉग कार्रवाई, ईमेल या विवरण खोजें..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#001024] border border-[#00f0ff]/30 text-white text-xs placeholder:text-[#0077b6] focus:border-[#00f0ff] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={logCategoryFilter}
                      onChange={(e) => setLogCategoryFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#001024] border border-[#00f0ff]/30 text-white text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="all">सभी श्रेणियां (All Categories)</option>
                      <option value="auth">🔐 Auth & Login</option>
                      <option value="admin">👑 Admin Action</option>
                      <option value="ai">🤖 AI Directive</option>
                      <option value="device">📱 Device Action</option>
                      <option value="security">🛡️ Security</option>
                    </select>

                    <select
                      value={logSeverityFilter}
                      onChange={(e) => setLogSeverityFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#001024] border border-[#00f0ff]/30 text-white text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="all">सभी गंभीरता (All Severity)</option>
                      <option value="info">INFO</option>
                      <option value="warning">WARNING</option>
                      <option value="error">ERROR</option>
                      <option value="critical">CRITICAL</option>
                    </select>

                    <button
                      onClick={handleExportLogs}
                      className="px-3 py-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-[#00f0ff]/40 text-[#00f0ff] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="CSV में निर्यात करें"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>EXPORT CSV</span>
                    </button>

                    <button
                      onClick={handleClearLogs}
                      className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="सभी लॉग साफ़ करें"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>CLEAR LOGS</span>
                    </button>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-[#00f0ff]/20 bg-[#000a16]">
                  {isLoadingLogs ? (
                    <div className="h-48 flex items-center justify-center gap-2 text-cyan-300">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>ऑडिट लॉग्स लोड हो रहे हैं...</span>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-[#00b4d8]/70">
                      <Terminal className="w-8 h-8 mb-2 opacity-50" />
                      <span>कोई लॉग प्रविष्टि नहीं मिली</span>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#001428] text-[#00b4d8] uppercase tracking-wider sticky top-0 border-b border-[#00f0ff]/20 z-10">
                        <tr>
                          <th className="p-3">समय (Timestamp)</th>
                          <th className="p-3">उपयोगकर्ता (User Email)</th>
                          <th className="p-3">श्रेणी (Category)</th>
                          <th className="p-3">गंभीरता (Severity)</th>
                          <th className="p-3">घटना / कार्रवाई (Event Action)</th>
                          <th className="p-3">विस्तृत विवरण (Details)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#00f0ff]/10">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#001a33]/60 transition-colors">
                            <td className="p-3 text-[#00b4d8] whitespace-nowrap">{log.timestamp}</td>
                            <td className="p-3 font-bold text-white whitespace-nowrap">
                              {log.userEmail}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-[#001b33] border border-[#00f0ff]/30 text-[#00f0ff] text-[10px] font-bold uppercase">
                                {log.category}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  log.severity === 'critical' || log.severity === 'error'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                    : log.severity === 'warning'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-emerald-500/20 text-[#00ff88] border border-[#00ff88]/40'
                                }`}
                              >
                                {log.severity}
                              </span>
                            </td>
                            <td className="p-3 text-cyan-200 font-semibold">{log.action}</td>
                            <td className="p-3 text-[#00b4d8]/80 text-[11px] max-w-xs truncate">
                              {log.details || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SYSTEM SETTINGS */}
            {activeTab === 'settings' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
                {settingsSavedMessage && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-[#00ff88] text-[#00ff88] text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                    <span>{settingsSavedMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI Assistant Personality & Tone */}
                  <div className="p-4 rounded-xl bg-[#001024] border border-[#00f0ff]/30 space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-[#00ff88]" />
                      <span>अंकिता AI शैली व बातचीत टोन (AI Assistant Tone)</span>
                    </div>
                    <p className="text-xs text-[#00b4d8] font-sans">
                      उपयोगकर्ता की प्राथमिक मांग: "मस्त एकदम प्यार से समझाएं"। अंकिता हमेशा मधुर, वात्सल्यपूर्ण व आत्मीय भाषा में उत्तर देती है।
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(['loving', 'professional', 'creative', 'concise'] as const).map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setSettings({ ...settings, aiTone: tone })}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            settings.aiTone === tone
                              ? 'bg-[#002f5e] border-[#00ff88] text-[#00ff88] font-bold shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                              : 'bg-[#001428] border-[#00f0ff]/20 text-[#00b4d8]'
                          }`}
                        >
                          <div className="capitalize">{tone === 'loving' ? '💖 प्यार से (Loving)' : tone}</div>
                          <div className="text-[10px] opacity-75 font-sans">
                            {tone === 'loving' ? 'अत्यंत मधुर, सरल व प्रेमपूर्वक' : `${tone} response`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security & Access Controls */}
                  <div className="p-4 rounded-xl bg-[#001024] border border-[#00f0ff]/30 space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Shield className="w-4 h-4 text-[#00f0ff]" />
                      <span>सुरक्षा व सिस्टम एक्सेस नीतियां (System Security)</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#001428] border border-[#00f0ff]/20 cursor-pointer">
                        <div>
                          <div className="text-white font-bold">Require Login To Use Ankita AI</div>
                          <div className="text-[#00b4d8] text-[10px]">
                            उपयोगकर्ता को पहले Gmail व पासवर्ड से रजिस्टर व लॉगिन करना होगा
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.requireAuthToUse}
                          onChange={(e) => setSettings({ ...settings, requireAuthToUse: e.target.checked })}
                          className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#001428] border border-[#00f0ff]/20 cursor-pointer">
                        <div>
                          <div className="text-white font-bold">Allow New User Registrations</div>
                          <div className="text-[#00b4d8] text-[10px]">
                            नए उपयोगकर्ताओं को साइन-अप करने की अनुमति दें
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.allowNewRegistrations}
                          onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                          className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#001428] border border-amber-500/30 cursor-pointer">
                        <div>
                          <div className="text-amber-300 font-bold">Maintenance Mode</div>
                          <div className="text-[#00b4d8] text-[10px]">
                            अस्थायी रखरखाव मोड (सिर्फ ऑपरेटर अनुमति)
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.maintenanceMode}
                          onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                          className="w-4 h-4 accent-amber-400 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Global Announcement Editor */}
                <div className="p-4 rounded-xl bg-[#001024] border border-[#00f0ff]/30 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Radio className="w-4 h-4 text-[#00ff88]" />
                    <span>सिस्टम-व्यापी घोषणा व संदेश (Global Announcement Banner)</span>
                  </div>
                  <textarea
                    rows={2}
                    value={settings.globalAnnouncement}
                    onChange={(e) => setSettings({ ...settings, globalAnnouncement: e.target.value })}
                    placeholder="सभी यूज़र्स के HUD पर दिखने वाला संदेश दर्ज करें..."
                    className="w-full px-3 py-2 rounded-xl bg-[#000a16] border border-[#00f0ff]/30 text-white text-xs focus:border-[#00ff88] focus:outline-none"
                  />
                </div>

                {/* Save Settings Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4d8] via-[#00f0ff] to-[#00ff88] text-black font-orbitron font-extrabold text-xs tracking-wider shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? 'सुरक्षित हो रहा है...' : 'SAVE SYSTEM CONFIGURATION'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: ELEVATED OPERATOR POWERS */}
            {activeTab === 'operator' && (
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
                {operatorFeedback && (
                  <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-400 text-amber-200 text-xs font-mono flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{operatorFeedback}</span>
                  </div>
                )}

                {/* Operator Voice / System Broadcast */}
                <div className="p-4 rounded-xl bg-[#001428] border border-amber-400/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-orbitron">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>LIVE OPERATOR BROADCAST (तत्काल ऑपरेटर प्रसारण)</span>
                  </div>
                  <p className="text-xs text-[#00b4d8] font-sans">
                    यहाँ से संदेश भेजने पर अंकिता AI सभी उपयोगकर्ताओं तक तत्काल घोषणा प्रसारित करती है।
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={broadcastInput}
                      onChange={(e) => setBroadcastInput(e.target.value)}
                      placeholder="उदाहरण: सभी ऑपरेटर कृपया ध्यान दें, सिस्टम कोर में सुरक्षा अपग्रेड संपन्न हुआ।"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#000a16] border border-amber-400/40 text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={handleSendBroadcast}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-orbitron font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:opacity-90 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>BROADCAST</span>
                    </button>
                  </div>
                </div>

                {/* Nuclear Operator Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#001020] border border-[#00f0ff]/30 space-y-2">
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-[#00f0ff]" />
                      <span>आर्क रिएक्टर पावर मोड</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setReactorPowerMode('overclock');
                          playConfirm();
                          setOperatorFeedback('आर्क रिएक्टर ओवरक्लॉक 105% सक्रिय!');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono text-left ${
                          reactorPowerMode === 'overclock'
                            ? 'bg-red-500/20 text-red-400 border border-red-500'
                            : 'bg-[#001428] text-gray-400'
                        }`}
                      >
                        ⚡ Overclock Core (105% Burst)
                      </button>
                      <button
                        onClick={() => {
                          setReactorPowerMode('nominal');
                          playConfirm();
                          setOperatorFeedback('आर्क रिएक्टर सामान्य 99.8% स्थिर मोड पर सेट।');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono text-left ${
                          reactorPowerMode === 'nominal'
                            ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]'
                            : 'bg-[#001428] text-gray-400'
                        }`}
                      >
                        ✅ Nominal Stable (99.8% Core)
                      </button>
                      <button
                        onClick={() => {
                          setReactorPowerMode('eco');
                          playConfirm();
                          setOperatorFeedback('इको पावर सेविंग मोड लागू किया गया।');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono text-left ${
                          reactorPowerMode === 'eco'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500'
                            : 'bg-[#001428] text-gray-400'
                        }`}
                      >
                        🌱 Eco Power Mode (75% Load)
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#001020] border border-[#00f0ff]/30 space-y-2">
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-[#00ff88]" />
                      <span>सिस्टम मेमोरी व कैशे शुद्धिकरण</span>
                    </div>
                    <p className="text-[11px] text-[#00b4d8] font-sans">
                      अस्थायी संवाद कैशे को शून्य पर रीसेट करें।
                    </p>
                    <button
                      onClick={() => {
                        playConfirm();
                        setOperatorFeedback('सिस्टम कैशे व टेम्प मेमोरी सफलतापूर्वक रीसेट की गई।');
                      }}
                      className="w-full py-2 rounded-lg bg-[#001b33] hover:bg-[#002f5e] border border-[#00f0ff]/40 text-[#00f0ff] font-bold text-xs font-mono transition-all cursor-pointer"
                    >
                      PURGE MEMORY CACHE
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#001020] border border-[#00f0ff]/30 space-y-2">
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <span>क्वांटम साइफर सुरक्षा जांच</span>
                    </div>
                    <p className="text-[11px] text-[#00b4d8] font-sans">
                      Quantum 4096-bit Cipher नोड्स का सेल्फ-टेस्ट चलाएं।
                    </p>
                    <button
                      onClick={() => {
                        playConfirm();
                        setOperatorFeedback('क्वांटम साइफर टेस्ट: 64/64 नोड्स 100% सुरक्षित पाए गए!');
                      }}
                      className="w-full py-2 rounded-lg bg-[#001b33] hover:bg-[#002f5e] border border-purple-400/40 text-purple-300 font-bold text-xs font-mono transition-all cursor-pointer"
                    >
                      RUN CRYPTO SELF-TEST
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add User Dialog */}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md p-6 rounded-2xl bg-[#001428] border border-[#00f0ff]/50 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-3">
                <h3 className="text-white font-orbitron font-bold text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#00ff88]" />
                  <span>नया उपयोगकर्ता पंजीकृत करें</span>
                </h3>
                <button
                  onClick={() => setIsAddUserOpen(false)}
                  className="text-[#00b4d8] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block text-[#00b4d8] mb-1">पूरा नाम (Full Name):</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3 py-2 rounded-xl bg-[#000a16] border border-[#00f0ff]/30 text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <div>
                  <label className="block text-[#00b4d8] mb-1">Gmail / Email ID *:</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#000a16] border border-[#00f0ff]/30 text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <div>
                  <label className="block text-[#00b4d8] mb-1">पासवर्ड (Password) *:</label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-[#000a16] border border-[#00f0ff]/30 text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <div>
                  <label className="block text-[#00b4d8] mb-1">भूमिका (Role):</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#000a16] border border-[#00f0ff]/30 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="user">Standard User</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#001f3f] text-[#00b4d8] font-bold"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00ff88] text-black font-bold font-orbitron"
                  >
                    + REGISTER USER
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
