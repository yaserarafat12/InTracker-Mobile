import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useUIStore } from '../store/useUIStore';
import { useTranslation } from '../i18n';

type SettingsView = 
  | 'menu' 
  | 'profile' 
  | 'premium' 
  | 'preferences' 
  | 'support'
  | 'timezone'
  | 'theme'
  | 'language'
  | 'sleep'
  | 'reminders';

const getAgeFromDOB = (dobString: string) => {
  if (!dobString) return '';
  const parts = dobString.split('/');
  if (parts.length !== 3) return '';
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
  const birthDate = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  const language = useUserStore.getState().settings.language;
  const suffix = language === 'Bahasa Indonesia' ? ' tahun' : ' years old';
  return isNaN(age) || age < 0 ? '' : ` (${age}${suffix})`;
};

const getGMTOffset = (timeZone: string) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' });
    const tz = formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value;
    return tz ? tz.replace(':00', '').replace('+0', '+').replace('-0', '-') : 'GMT+0';
  } catch { return 'GMT+0'; }
};

const timeZoneList = [
  { city: 'Abidjan', zone: 'Africa/Abidjan' },
  { city: 'Accra', zone: 'Africa/Accra' },
  { city: 'Addis Ababa', zone: 'Africa/Addis_Ababa' },
  { city: 'Algiers', zone: 'Africa/Algiers' },
  { city: 'Asmara', zone: 'Africa/Asmara' },
  { city: 'Bamako', zone: 'Africa/Bamako' },
  { city: 'Bangui', zone: 'Africa/Bangui' },
  { city: 'Banjul', zone: 'Africa/Banjul' },
  { city: 'Jakarta', zone: 'Asia/Jakarta' },
  { city: 'Jayapura', zone: 'Asia/Jayapura' },
  { city: 'Makassar', zone: 'Asia/Makassar' },
  { city: 'Singapore', zone: 'Asia/Singapore' },
  { city: 'Tokyo', zone: 'Asia/Tokyo' },
  { city: 'Seoul', zone: 'Asia/Seoul' },
  { city: 'Bangkok', zone: 'Asia/Bangkok' },
  { city: 'Manila', zone: 'Asia/Manila' },
  { city: 'Sydney', zone: 'Australia/Sydney' },
  { city: 'London', zone: 'Europe/London' },
  { city: 'Paris', zone: 'Europe/Paris' },
  { city: 'Berlin', zone: 'Europe/Berlin' },
  { city: 'New York', zone: 'America/New_York' },
  { city: 'Los Angeles', zone: 'America/Los_Angeles' },
  { city: 'Dubai', zone: 'Asia/Dubai' },
  { city: 'Mumbai', zone: 'Asia/Kolkata' },
  { city: 'Moscow', zone: 'Europe/Moscow' },
];

const MONTH_NAMES = {
  'Bahasa Indonesia': [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ],
  'English': [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
};

export const SettingsOverlay = () => {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();
  const { 
    profile, 
    settings, 
    updateSettings, 
    isProActive, 
    addDailyPass, 
    addStreakFreeze,
    subscriptionPlan,
    setSubscriptionPlan
  } = useUserStore();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const isPro = isProActive();
  const isLight = settings.theme === 'Light';

  const [currentView, setCurrentView] = useState<SettingsView>('menu');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states initialized from Zustand settings
  const [firstName, setFirstName] = useState(settings.firstName);
  const [lastName, setLastName] = useState(settings.lastName);
  const [nickname, setNickname] = useState(settings.nickname);
  const [username, setUsername] = useState(settings.username);
  const [email, setEmail] = useState(settings.email);
  const [gender, setGender] = useState(settings.gender);
  const [dob, setDob] = useState(settings.dob);
  const [weight, setWeight] = useState(settings.weight);
  const [height, setHeight] = useState(settings.height);
  const [country, setCountry] = useState(settings.country);
  const [avatarUrl, setAvatarUrl] = useState(settings.avatarUrl || '');
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Support states
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Promo code & plan selection
  const [promoCode, setPromoCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'logout' | 'delete' | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedTz, setSelectedTz] = useState(settings.timezone || 'Asia/Jakarta');
  const [tzSearch, setTzSearch] = useState('');
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);

  // Premium checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cc' | 'gopay' | 'va'>('gopay');

  // DOB Wheel Picker States
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showWheelMode, setShowWheelMode] = useState(false);
  const [selDay, setSelDay] = useState(15);
  const [selMonth, setSelMonth] = useState(6);
  const [selYear, setSelYear] = useState(2008);

  const dayScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<any>(null);

  // Sync scroll positions when Picker opens and wheel mode is active
  useEffect(() => {
    if (showDobPicker && showWheelMode) {
      const timer = setTimeout(() => {
        if (dayScrollRef.current) {
          dayScrollRef.current.scrollTop = (selDay - 1) * 44;
        }
        if (monthScrollRef.current) {
          monthScrollRef.current.scrollTop = (selMonth - 1) * 44;
        }
        if (yearScrollRef.current) {
          yearScrollRef.current.scrollTop = (2015 - selYear) * 44;
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [showDobPicker, showWheelMode]);

  // Sync wheel state with dob change from input or settings sync
  useEffect(() => {
    if (dob && dob.includes('/')) {
      const parts = dob.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(d)) setSelDay(d);
        if (!isNaN(m)) setSelMonth(m);
        if (!isNaN(y)) setSelYear(y);
      }
    }
  }, [dob]);

  const daysInMonth = useMemo(() => {
    return new Date(selYear, selMonth, 0).getDate();
  }, [selMonth, selYear]);

  useEffect(() => {
    if (selDay > daysInMonth) {
      setSelDay(daysInMonth);
      setDob(`${daysInMonth.toString().padStart(2, '0')}/${selMonth.toString().padStart(2, '0')}/${selYear}`);
    }
  }, [daysInMonth, selDay, selMonth, selYear]);

  const handleWheelScroll = (e: React.UIEvent<HTMLDivElement>, type: 'day' | 'month' | 'year') => {
    const target = e.currentTarget;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const index = Math.round(target.scrollTop / 44);
      if (type === 'day') {
        const d = index + 1;
        if (d >= 1 && d <= daysInMonth && d !== selDay) {
          setSelDay(d);
          setDob(`${d.toString().padStart(2, '0')}/${selMonth.toString().padStart(2, '0')}/${selYear}`);
        }
      } else if (type === 'month') {
        const m = index + 1;
        if (m >= 1 && m <= 12 && m !== selMonth) {
          setSelMonth(m);
          const maxDays = new Date(selYear, m, 0).getDate();
          const d = selDay > maxDays ? maxDays : selDay;
          if (selDay > maxDays) setSelDay(maxDays);
          setDob(`${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${selYear}`);
        }
      } else if (type === 'year') {
        const y = 2015 - index;
        if (y >= 1940 && y <= 2015 && y !== selYear) {
          setSelYear(y);
          const maxDays = new Date(y, selMonth, 0).getDate();
          const d = selDay > maxDays ? maxDays : selDay;
          if (selDay > maxDays) setSelDay(maxDays);
          setDob(`${d.toString().padStart(2, '0')}/${selMonth.toString().padStart(2, '0')}/${y}`);
        }
      }
    }, 90);
  };

  // Sync state with store updates when overlay opens or settings change
  useEffect(() => {
    if (isSettingsOpen) {
      setFirstName(settings.firstName);
      setLastName(settings.lastName);
      setEmail(settings.email);
      setGender(settings.gender);
      setDob(settings.dob);
      setWeight(settings.weight);
      setHeight(settings.height);
      setCountry(settings.country);
      setNickname(settings.nickname);
      setUsername(settings.username);
      setSelectedTz(settings.timezone || 'Asia/Jakarta');
      setAvatarUrl(settings.avatarUrl || '');
    }
  }, [isSettingsOpen, settings]);

  if (!isSettingsOpen) return null;

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleNavigate = (path: string) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setSettingsOpen(false);
    navigate(path);
  };

  const handleSaveProfile = async () => {
    // Check username uniqueness
    const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanedUsername) {
      triggerToast(language === 'Bahasa Indonesia' ? 'Username tidak boleh kosong' : 'Username cannot be empty');
      return;
    }

    if (localStorage.getItem('guest_mode') !== 'true') {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if username is taken by another user
          const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('nickname', cleanedUsername)
            .maybeSingle();

          if (existingUser && existingUser.id !== user.id) {
            triggerToast(language === 'Bahasa Indonesia' ? 'Username sudah digunakan' : 'Username is already taken');
            return;
          }

          // Update profiles database:
          // database nickname = unique username
          // database full_name = nickname (Display Name / Nama User)
          const { error: updateError } = await supabase.from('profiles').update({
            nickname: cleanedUsername,
            full_name: nickname.trim(),
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);

          if (updateError) throw updateError;
        }
      } catch (err: any) {
        console.error("Error saving profile:", err);
        triggerToast(err.message || (language === 'Bahasa Indonesia' ? 'Gagal memperbarui profil' : 'Failed to update profile'));
        return;
      }
    }

    updateSettings({
      firstName,
      lastName,
      nickname,
      username: cleanedUsername,
      email,
      gender,
      dob,
      weight,
      height,
      country,
      avatarUrl
    });

    triggerToast(language === 'Bahasa Indonesia' ? 'Profil berhasil diperbarui' : 'Profile updated successfully');
    setCurrentView('menu');
  };

  const handleToggle = async (key: keyof typeof settings) => {
    const newVal = !settings[key];
    updateSettings({ [key]: newVal });
    if (navigator.vibrate) navigator.vibrate(10);

    // Dynamic browser & mobile system notifications
    if (['dailyReminder', 'weeklySummary', 'newFeatures'].includes(key)) {
      if (newVal) {
        // 1. Mobile Capacitor Local Notifications Permission request
        const win = window as any;
        if (win.Capacitor?.isPluginAvailable('LocalNotifications')) {
          try {
            const LocalNotifications = win.Capacitor.Plugins.LocalNotifications;
            await LocalNotifications.requestPermissions();
          } catch (e) {
            console.error("[InTracker] Capacitor requestPermissions failed:", e);
          }
        }

        // 2. Web Browser Notification request & immediate confirmation
        if ('Notification' in window) {
          try {
            let permission = Notification.permission;
            if (permission === 'default') {
              permission = await Notification.requestPermission();
            }
            if (permission === 'granted') {
              let title = "InTracker Alert Enabled";
              let body = "You have enabled alerts.";
              if (key === 'dailyReminder') {
                title = "Daily Habit Reminder";
                body = `Daily reminders are active. We will nudge you at ${settings.dailyReminderTime || '08:00 PM'}.`;
              } else if (key === 'weeklySummary') {
                title = "Weekly Summary Reports";
                body = "Success reports will be generated every Monday.";
              } else if (key === 'newFeatures') {
                title = "Incomplete Habit Alerts";
                body = "You will get alerted if any habits are left incomplete before midnight.";
              }
              new Notification(title, { body, icon: "/logo.png" });
            } else {
              triggerToast(language === 'Bahasa Indonesia' ? 'Notifikasi sistem diblokir' : 'System notifications are blocked');
            }
          } catch (err) {
            console.error("Notification API failed:", err);
            triggerToast(language === 'Bahasa Indonesia' ? 'Notifikasi simulasi diaktifkan' : 'Simulated notification enabled');
          }
        } else {
          triggerToast(language === 'Bahasa Indonesia' ? 'Notifikasi tidak didukung di browser ini' : 'Notifications not supported in this browser');
        }
      }
    }
  };

  const handleSaveTimezone = () => {
    updateSettings({ timezone: selectedTz });
    triggerToast(language === 'Bahasa Indonesia' ? 'Zona waktu berhasil diperbarui' : 'Time zone updated successfully');
    setCurrentView('menu');
  };

  const handleSyncLocation = () => {
    setIsSyncingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setSelectedTz(localTz);
          triggerToast('Synced timezone from device location!');
          setIsSyncingLocation(false);
        },
        (error) => {
          console.error("Location error:", error);
          triggerToast('Failed to get location. Using system timezone instead.');
          const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setSelectedTz(localTz);
          setIsSyncingLocation(false);
        },
        { timeout: 5000 }
      );
    } else {
      triggerToast('Location not supported. Using system timezone.');
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setSelectedTz(localTz);
      setIsSyncingLocation(false);
    }
  };

  const handleStartNewProgram = async () => {
    const confirm = window.confirm("Start a new program? This will re-run the onboarding questions.");
    if (!confirm) return;

    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          onboarding_completed: false
        }).eq('id', user.id);
      }
    } catch (e) {
      console.error(e);
    }
    handleNavigate('/questions/1');
  };

  const handleResetProgram = async () => {
    const confirm = window.confirm("Are you sure you want to reset your program? All your habits, streaks, and progress stats will be permanently wiped.");
    if (!confirm) return;

    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('habits').delete().eq('user_id', user.id);
        await supabase.from('habit_logs').delete().eq('user_id', user.id);
        await supabase.from('user_stats').delete().eq('user_id', user.id);
        await supabase.from('profiles').update({
          streak_count: 0,
          streak_freeze_count: 3,
          onboarding_completed: false
        }).eq('id', user.id);
      }
    } catch (err) {
      console.error(err);
    }
    localStorage.clear();
    window.location.href = '/questions/0';
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      triggerToast('Passwords do not match');
      return;
    }

    if (localStorage.getItem('guest_mode') === 'true') {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('Password simulated update (Guest)');
      setCurrentView('menu');
      return;
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        triggerToast(error.message);
      } else {
        triggerToast('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentView('menu');
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Failed to update password');
    }
  };

  const handleRedeemPromo = () => {
    if (!promoCode.trim()) return;
    setPromoCode('');
    triggerToast(language === 'Bahasa Indonesia' ? 'Kode promo berhasil digunakan' : 'Promo code applied successfully');
  };

  const handleSendSupport = () => {
    if (!supportMessage.trim()) return;
    setSupportSubject('');
    setSupportMessage('');
    triggerToast(language === 'Bahasa Indonesia' ? 'Pesan terkirim ke tim support' : 'Message sent to team');
    setCurrentView('menu');
  };

  const handleSendFeedback = () => {
    if (feedbackRating === 0) return;
    setFeedbackRating(0);
    setFeedbackText('');
    triggerToast(language === 'Bahasa Indonesia' ? 'Terima kasih atas masukan Anda!' : 'Thank you for your feedback!');
    setCurrentView('menu');
  };

  const handleConfirmPayment = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsProcessingPayment(true);
    
    // Simulate payment processing for 1.8 seconds
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
      
      // Grant subscription plan after success animation
      setTimeout(() => {
        if (checkoutPlan) {
          setSubscriptionPlan(checkoutPlan as any);
          const planLabel = t(`settings.plan${checkoutPlan.charAt(0).toUpperCase() + checkoutPlan.slice(1)}Label`);
          triggerToast(t('settings.planSubscribedSuccess').replace('{plan}', planLabel));
        }
        setIsCheckoutOpen(false);
        setPaymentSuccess(false);
        setSelectedPlan(null);
      }, 2000);
    }, 1800);
  };

  const menuSections = [
    { id: 'profile', label: 'Profile details', icon: 'solar:user-bold', desc: 'Edit personal stats & details' },
    { id: 'devices', label: 'Device integration', icon: 'solar:devices-bold', desc: 'Sync health & fitness trackers' },
    { id: 'notifications', label: 'Notifications', icon: 'solar:bell-bold', desc: 'Manage alerts & daily reminder' },
    { id: 'security', label: 'Security & login', icon: 'solar:lock-keyhole-bold', desc: 'Password & biometric options' },
    { id: 'premium', label: 'Manage plan', icon: 'solar:ticket-bold', desc: 'Subscriptions & supply freeze' },
    { id: 'preferences', label: 'App preferences', icon: 'solar:settings-bold', desc: 'Language, theme & units' },
    { id: 'support', label: 'Help & support', icon: 'solar:chat-round-line-bold', desc: 'FAQs, contact team & feedback' },
    { id: 'about', label: 'About InTracker', icon: 'solar:info-circle-bold', desc: 'Legal, terms & system info' },
  ] as const;

  const faqs = [
    { q: 'Gimana cara mulai tracking habit?', a: 'Buka tab Habits, tekan tombol + di pojok kanan atas untuk tambah habit baru. Pilih kategori, atur frekuensi, lalu selesaikan setiap hari untuk jaga streak-mu.' },
    { q: 'Apa itu Streak dan gimana cara jaganya?', a: 'Streak adalah jumlah hari berturut-turut kamu menyelesaikan habit. Kamu harus menyelesaikan habit setiap hari agar streak tidak reset. Tersedia Streak Freeze di supply untuk proteksi 1 hari.' },
    { q: 'Apa fungsi fitur Journey?', a: 'Journey adalah mood log harian. Kamu bisa catat perasaan, energi, dan refleksi singkat setiap hari. Data ini terakumulasi di Analytics untuk melihat tren emosimu dari waktu ke waktu.' },
    { q: 'Apa itu XP dan level di InTracker?', a: 'XP (Experience Points) didapat dari menyelesaikan habit, todo, dan aktivitas lainnya. Semakin banyak XP, semakin tinggi levelmu. Level mencerminkan konsistensi dan progressmu secara keseluruhan.' },
    { q: 'Gimana cara pakai fitur Todo / Target?', a: 'Buka tab Todo dari beranda. Tambah task baru dengan tombol +, atur deadline dan prioritas. Task yang selesai akan otomatis diarsipkan setelah 24 jam untuk menjaga tampilan tetap bersih.' },
    { q: 'Apa itu Weekly Summary?', a: 'Weekly Summary adalah rekap mingguan otomatis yang merangkum habit yang diselesaikan, streak terbaik, mood rata-rata, dan pencapaian selama 7 hari terakhir. Bisa diakses dari tab Analytics.' },
  ];

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 35 }}
          className={`fixed inset-0 z-[100] flex flex-col overflow-hidden font-['Outfit'] select-none transition-colors duration-300 ${
            isLight
              ? 'bg-[#F2F2F7] text-black'
              : 'bg-gradient-to-b from-[#181513] via-[#141210] to-[#0f0e0d] text-white'
          }`}
        >
          {/* TOAST NOTIFICATION */}
          <AnimatePresence>
            {successToast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 bg-[#7BE495] text-black border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] rounded-xl flex items-center gap-2 text-xs font-bold whitespace-nowrap"
              >
                <Icon icon="ph:check-bold" width={14} />
                <span>{successToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HEADER */}
          <div className={`px-6 py-5 flex items-center justify-between border-b relative z-20 h-20 ${
            isLight ? 'border-[#e0e0e0]' : 'border-[#222]'
          }`}>
            {/* Left Button Slot */}
            <div className="w-10 flex items-center justify-start">
              {currentView !== 'menu' && (
                <button
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    setCurrentView('menu');
                  }}
                  className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    settings.theme === 'Light'
                      ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                      : 'bg-black border-white text-white shadow-[3px_3px_0px_rgba(255,255,255,1)]'
                  }`}
                >
                  <Icon icon="ph:arrow-left-bold" width={18} height={18} />
                </button>
              )}
            </div>

            {/* Center Title Slot */}
            <div className="flex-1 text-center px-4">
              <h2 className={`text-lg font-black leading-tight ${isLight ? 'text-black' : 'text-white'}`}>
                {currentView === 'menu' && t('settings.header')}
                {currentView === 'profile' && t('settings.profileDetails')}
                {currentView === 'premium' && t('settings.managePlan')}
                {currentView === 'theme' && t('settings.displayTheme')}
                {currentView === 'language' && t('settings.appLanguage')}
                {currentView === 'sleep' && t('settings.sleepMode')}
                {currentView === 'reminders' && t('settings.reminderAlerts')}
                {currentView === 'support' && t('settings.supportInfo')}
                {currentView === 'timezone' && t('settings.timeZone')}
              </h2>
            </div>

            {/* Right Button Slot */}
            <div className="w-10 flex items-center justify-end">
              <button
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  setCurrentView('menu');
                  setSettingsOpen(false);
                }}
                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  settings.theme === 'Light'
                    ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                    : 'bg-black border-white text-white shadow-[3px_3px_0px_rgba(255,255,255,1)]'
                }`}
              >
                <Icon icon="ph:x-bold" width={16} height={16} />
              </button>
            </div>
          </div>

          {/* CONTENT SCROLLABLE */}
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 space-y-6 relative z-10 scrollbar-hide">
            
            {/* VIEW: MENU */}
            {currentView === 'menu' && (
              <>
                 {/* PROFILE CARD */}
                 <div className="flex items-center justify-between py-3">
                   <div 
                     onClick={() => {
                       if (navigator.vibrate) navigator.vibrate(10);
                       setCurrentView('profile');
                     }}
                     className="flex items-center gap-3 cursor-pointer group"
                   >
                     <div className="w-12 h-12 rounded-full border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex-shrink-0 overflow-hidden bg-[#7BE495] flex items-center justify-center relative group-hover:scale-105 transition-transform">
                       {avatarUrl ? (
                         <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-black font-black text-lg">
                           {(nickname || firstName || 'B').substring(0, 1).toUpperCase()}
                         </span>
                       )}
                     </div>
                     <div>
                       <p className={`text-base font-black leading-tight group-hover:text-[#00FF85] transition-colors ${isLight ? 'text-black' : 'text-white'}`}>
                         {nickname || profile?.nickname || 'InTracker User'}
                       </p>
                       <p className={`text-[11px] mt-0.5 ${isLight ? 'text-black/40' : 'text-white/40'}`}>
                         {email || profile?.full_name || 'user@intracker.co'}
                       </p>
                     </div>
                   </div>
                  <button
                    onClick={() => setCurrentView('premium')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black border tracking-wider ${
                      isPro
                        ? 'bg-[#7BE495] text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                        : isLight ? 'bg-[#e8e8e8] text-black/50 border-[#ccc]' : 'bg-[#111] text-white/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {subscriptionPlan === 'weekly' ? 'WEEKLY' :
                     subscriptionPlan === 'monthly' ? 'MONTHLY' :
                     subscriptionPlan === 'annual' ? 'ANNUAL' :
                     'FREE'}
                  </button>
                </div>

                {/* DIVIDER HELPER */}
                {(() => {
                  const RowItem = ({ icon, label, desc, onClick, danger }: { icon: string; label: string; desc?: string; onClick: () => void; danger?: boolean }) => (
                    <button
                      onClick={onClick}
                      className={`w-full flex items-center justify-between px-1 py-3 border-b last:border-0 transition-colors text-left ${
                        isLight ? 'border-[#e5e5e5] hover:bg-black/[0.03]' : 'border-[#141414] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-950/30' : isLight ? 'bg-[#f0f0f0] border border-[#ddd]' : 'bg-[#141414] border border-[#222]'}`}>
                          <Icon icon={icon} className={danger ? 'text-red-500/70' : 'text-[#7BE495]'} width={15} />
                        </div>
                        <div>
                          <span className={`text-xs font-bold leading-none ${danger ? 'text-red-500/70' : isLight ? 'text-black' : 'text-white'}`}>{label}</span>
                          {desc && <p className={`text-[10px] mt-0.5 leading-none ${isLight ? 'text-black/40' : 'text-white/30'}`}>{desc}</p>}
                        </div>
                      </div>
                      <Icon icon="ph:caret-right-bold" className={isLight ? 'text-black/30' : 'text-white/30'} width={14} />
                    </button>
                  );

                  return (
                    <div className="space-y-6 pt-2">
                      {/* Navigations Card */}
                      <div className="bg-[#0b0b0b] border border-[#1c1c1c] rounded-2xl px-3 overflow-hidden">
                        <RowItem 
                          icon="solar:user-bold" 
                          label={t('settings.menu.profile')} 
                          desc={t('settings.menu.profileDesc')} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('profile'); }} 
                        />
                        <RowItem 
                          icon="solar:ticket-bold" 
                          label={t('settings.menu.plan')} 
                          desc={isPro ? t('settings.menu.planDescPro') : t('settings.menu.planDescFree')} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('premium'); }} 
                        />
                        <RowItem 
                          icon="solar:sun-bold" 
                          label={t('settings.menu.theme')} 
                          desc={`${t('settings.menu.themeDesc')} ${settings.theme || 'System'}`} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('theme'); }} 
                        />
                        <RowItem 
                          icon="solar:global-bold" 
                          label={t('settings.menu.timezone')} 
                          desc={(settings.timezone || 'Asia/Jakarta').split('/').pop()?.replace(/_/g, ' ') || 'Asia/Jakarta'} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('timezone'); }} 
                        />
                        <RowItem 
                          icon="ph:translate-bold" 
                          label={t('settings.menu.language')} 
                          desc={settings.language || 'English'} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('language'); }} 
                        />
                        <RowItem 
                          icon="solar:sleeping-bold" 
                          label={t('settings.menu.sleep')} 
                          desc={settings.programPaused ? t('settings.menu.sleepDescActive') : t('settings.menu.sleepDescInactive')} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('sleep'); }} 
                        />
                        <RowItem 
                          icon="solar:bell-bold" 
                          label={t('settings.menu.reminders')} 
                          desc={settings.dailyReminder ? t('settings.menu.remindersDescActive') : t('settings.menu.remindersDescInactive')} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('reminders'); }} 
                        />
                        <RowItem 
                          icon="solar:chat-round-line-bold" 
                          label={t('settings.menu.support')} 
                          desc={t('settings.menu.supportDesc')} 
                          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setCurrentView('support'); }} 
                        />
                      </div>

                      {/* Journey Actions Card */}
                      <div className="bg-[#0b0b0b] border border-[#1c1c1c] rounded-2xl px-3 overflow-hidden">
                        <RowItem 
                          icon="solar:play-bold" 
                          label={t('settings.menu.startNew')} 
                          desc={t('settings.menu.startNewDesc')} 
                          onClick={handleStartNewProgram} 
                        />
                        <RowItem 
                          icon="solar:trash-bin-trash-bold" 
                          label={t('settings.menu.reset')} 
                          desc={t('settings.menu.resetDesc')} 
                          danger
                          onClick={handleResetProgram} 
                        />
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* VIEW: PROFILE */}
            {currentView === 'profile' && (
              <section className="space-y-5">
                {/* PROFILE PICTURE SELECTOR */}
                <div className="flex flex-col items-center justify-center py-2 relative">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('profile-avatar-input')?.click()}>
                    <div className="w-24 h-24 rounded-full border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden bg-[#7BE495] flex items-center justify-center relative">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-black font-black text-3xl">
                          {(nickname || firstName || 'B').substring(0, 1).toUpperCase()}
                        </span>
                      )}
                      
                      {/* Overlay hover effect */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Icon icon="ph:camera-bold" width={24} />
                      </div>
                    </div>

                    {/* Edit button badge */}
                    <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-[#00FF85] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      <Icon icon="ph:pencil-simple-bold" className="text-black" width={16} />
                    </div>
                  </div>

                  <input
                    id="profile-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setCropImageSrc(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                  <p className="text-[10px] text-white/40 mt-3.5 uppercase tracking-wider font-black">
                    {language === 'Bahasa Indonesia' ? 'Ketuk untuk mengganti foto' : 'Tap to change photo'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.firstName')}</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.lastName')}</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.username')}</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40 text-[#7BE495]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.nickname')}</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Nama Panggilan"
                      className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.emailAddress')}</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      placeholder="name@email.com"
                      className="w-full bg-[#0c0c0c]/50 border border-[#222] text-white/40 cursor-not-allowed rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.gender')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                            gender === g 
                              ? 'bg-[#7BE495] text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                              : 'bg-[#0c0c0c] border-[#222] text-white/60 hover:border-[#333]'
                          }`}
                        >
                          {g === 'Male' ? t('settings.male') : g === 'Female' ? t('settings.female') : t('settings.other')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.dob')}{getAgeFromDOB(dob)}</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(10);
                        setShowDobPicker(!showDobPicker);
                      }}
                      className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3.5 text-xs font-semibold text-left flex items-center justify-between hover:border-white/20 transition-colors"
                    >
                      <span className={dob ? "text-white" : "text-white/30"}>
                        {dob || "DD/MM/YYYY"}
                      </span>
                      <Icon 
                        icon={showDobPicker ? "solar:alt-arrow-up-bold-duotone" : "solar:alt-arrow-down-bold-duotone"} 
                        className="text-[#7BE495]" 
                        width={18} 
                      />
                    </button>

                    {/* Inline Calendar Sheet Picker */}
                    <AnimatePresence>
                      {showDobPicker && (() => {
                        const activeMonths = MONTH_NAMES[language as keyof typeof MONTH_NAMES] || MONTH_NAMES['English'];
                        const isIndo = language === 'Bahasa Indonesia';

                        const handlePrevMonth = () => {
                          if (navigator.vibrate) navigator.vibrate(10);
                          let newMonth = selMonth - 1;
                          let newYear = selYear;
                          if (newMonth < 1) {
                            newMonth = 12;
                            newYear = selYear - 1;
                          }
                          if (newYear >= 1940) {
                            setSelYear(newYear);
                            setSelMonth(newMonth);
                            const maxDays = new Date(newYear, newMonth, 0).getDate();
                            const d = selDay > maxDays ? maxDays : selDay;
                            if (selDay > maxDays) setSelDay(maxDays);
                            setDob(`${d.toString().padStart(2, '0')}/${newMonth.toString().padStart(2, '0')}/${newYear}`);
                          }
                        };

                        const handleNextMonth = () => {
                          if (navigator.vibrate) navigator.vibrate(10);
                          let newMonth = selMonth + 1;
                          let newYear = selYear;
                          if (newMonth > 12) {
                            newMonth = 1;
                            newYear = selYear + 1;
                          }
                          if (newYear <= 2015) {
                            setSelYear(newYear);
                            setSelMonth(newMonth);
                            const maxDays = new Date(newYear, newMonth, 0).getDate();
                            const d = selDay > maxDays ? maxDays : selDay;
                            if (selDay > maxDays) setSelDay(maxDays);
                            setDob(`${d.toString().padStart(2, '0')}/${newMonth.toString().padStart(2, '0')}/${newYear}`);
                          }
                        };

                        const firstWeekday = new Date(selYear, selMonth - 1, 1).getDay();
                        const blanks = Array.from({ length: firstWeekday }, (_, i) => null);
                        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                        const gridItems = [...blanks, ...days];

                        const weekdays = isIndo 
                          ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
                          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                        return (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="relative bg-[#262626] border border-white/10 rounded-2xl p-4 w-full max-w-[340px] select-none shadow-[4px_4px_0px_rgba(0,0,0,1)] mx-auto flex flex-col gap-2.5">
                              {/* Header Row */}
                              <div className="flex justify-between items-center px-0.5 pb-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.vibrate) navigator.vibrate(10);
                                    setShowWheelMode(!showWheelMode);
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-black font-['Outfit'] text-white hover:text-[#7BE495] transition-colors"
                                >
                                  <span>{activeMonths[selMonth - 1]} {selYear}</span>
                                  <Icon 
                                    icon={showWheelMode ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-right-bold"} 
                                    className="text-[#7BE495]" 
                                    width={14} 
                                  />
                                </button>

                                {/* Back/Next Month Navigation */}
                                {!showWheelMode ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handlePrevMonth}
                                      className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-md text-white hover:border-white/20 active:scale-90 transition-transform"
                                    >
                                      <Icon icon="ph:caret-left-bold" width={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleNextMonth}
                                      className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-md text-white hover:border-white/20 active:scale-90 transition-transform"
                                    >
                                      <Icon icon="ph:caret-right-bold" width={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (navigator.vibrate) navigator.vibrate(10);
                                      setShowWheelMode(false);
                                    }}
                                    className="text-xs font-black font-['Outfit'] text-white/50 hover:text-white transition-colors"
                                  >
                                    {isIndo ? 'Kembali' : 'Back'}
                                  </button>
                                )}
                              </div>

                              {/* Body Area */}
                              <div className="relative min-h-[180px] flex items-center justify-center">
                                {showWheelMode ? (
                                  /* 3D Wheel Picker Mode */
                                  <div className="relative bg-black/40 border border-white/[0.05] rounded-lg flex gap-0 h-[180px] w-full overflow-hidden py-0 px-1 select-none shadow-[inset_0_4px_10px_rgba(0,0,0,0.8),inset_0_-4px_10px_rgba(0,0,0,0.8)]">
                                    {/* Apple-style Lens Selector */}
                                    <div className="absolute top-[68px] left-1 right-1 h-11 bg-white/[0.03] border-y border-white/[0.08] pointer-events-none rounded-lg z-20" />
                                    
                                    {/* Fade overlays */}
                                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#262626] via-[#262626]/80 to-transparent pointer-events-none z-20" />
                                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#262626] via-[#262626]/80 to-transparent pointer-events-none z-20" />

                                    {/* Column: Month */}
                                    <div 
                                      ref={monthScrollRef} 
                                      onScroll={(e) => handleWheelScroll(e, 'month')} 
                                      className="snap-y snap-mandatory overflow-y-auto scrollbar-hide h-full flex-1 text-center relative z-10 border-r border-white/[0.05]"
                                    >
                                      <div className="h-[68px] shrink-0 pointer-events-none" />
                                      {activeMonths.map((name, i) => {
                                        const val = i + 1;
                                        const isSelected = selMonth === val;
                                        return (
                                          <div 
                                            key={i} 
                                            className={`snap-center h-11 flex items-center justify-center text-xs font-black transition-colors duration-200 ${
                                              isSelected ? 'text-[#7BE495]' : 'text-white/30'
                                            }`}
                                          >
                                            {name}
                                          </div>
                                        );
                                      })}
                                      <div className="h-[68px] shrink-0 pointer-events-none" />
                                    </div>
                        
                                    {/* Column: Year */}
                                    <div 
                                      ref={yearScrollRef} 
                                      onScroll={(e) => handleWheelScroll(e, 'year')} 
                                      className="snap-y snap-mandatory overflow-y-auto scrollbar-hide h-full flex-1 text-center relative z-10"
                                    >
                                      <div className="h-[68px] shrink-0 pointer-events-none" />
                                      {Array.from({ length: 76 }, (_, i) => {
                                        const val = 2015 - i;
                                        const isSelected = selYear === val;
                                        return (
                                          <div 
                                            key={i} 
                                            className={`snap-center h-11 flex items-center justify-center text-[15px] font-black transition-colors duration-200 ${
                                              isSelected ? 'text-[#7BE495]' : 'text-white/30'
                                            }`}
                                          >
                                            {val}
                                          </div>
                                        );
                                      })}
                                      <div className="h-[68px] shrink-0 pointer-events-none" />
                                    </div>
                                  </div>
                                ) : (
                                  /* Grid Day Mode */
                                  <div className="w-full flex flex-col gap-2">
                                    {/* Weekdays Row */}
                                    <div className="grid grid-cols-7 text-center">
                                      {weekdays.map((wd, i) => (
                                        <span key={i} className="text-[9px] font-black text-white/30 uppercase tracking-wider">
                                          {wd}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Days Grid */}
                                    <div className="grid grid-cols-7 gap-1 mt-1 justify-items-center">
                                      {gridItems.map((val, i) => {
                                        if (val === null) {
                                          return <div key={i} className="w-7 h-7" />;
                                        }
                                        const isSelected = selDay === val;
                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                              if (navigator.vibrate) navigator.vibrate(10);
                                              setSelDay(val);
                                              setDob(`${val.toString().padStart(2, '0')}/${selMonth.toString().padStart(2, '0')}/${selYear}`);
                                            }}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                                              isSelected 
                                                ? 'bg-[#7BE495] text-black border border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]' 
                                                : 'text-white/80 hover:bg-white/5 active:scale-90'
                                            }`}
                                          >
                                            {val}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                        {t('settings.weight')} ({settings.weightUnit === 'Metric' ? 'kg' : 'lbs'})
                      </label>
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="70"
                        className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                        {t('settings.height')} ({settings.heightUnit === 'Metric' ? 'cm' : 'inches'})
                      </label>
                      <input
                        type="text"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="175"
                        className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.country')}</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Indonesia"
                      className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40"
                    />
                  </div>
                </div>

              </section>
            )}

            {/* VIEW: PREMIUM */}
            {currentView === 'premium' && (() => {
              const PLAN_LEVELS: Record<string, number> = {
                free: 0,
                weekly: 1,
                monthly: 2,
                annual: 3,
              };

              const currentPlan = subscriptionPlan || 'free';

              const plans = [
                {
                  id: 'free',
                  badge: null,
                  name: t('settings.planFreeName'),
                  sub: t('settings.planFreeSub'),
                  price: 'Rp0',
                  originalPrice: 'Rp0',
                  discount: '',
                },
                {
                  id: 'weekly',
                  badge: null,
                  name: t('settings.planWeeklyName'),
                  sub: t('settings.planWeeklySub'),
                  price: 'Rp10.000',
                  originalPrice: 'Rp20.000',
                  discount: '50% OFF',
                },
                {
                  id: 'monthly',
                  badge: null,
                  name: t('settings.planMonthlyName'),
                  sub: t('settings.planMonthlySub'),
                  price: 'Rp30.000',
                  originalPrice: 'Rp60.000',
                  discount: '50% OFF',
                },
                {
                  id: 'annual',
                  badge: t('settings.planBestBadge'),
                  name: t('settings.planAnnualName'),
                  sub: t('settings.planAnnualSub'),
                  price: 'Rp300.000',
                  originalPrice: 'Rp600.000',
                  discount: '50% OFF',
                },
              ];
              return (
                <section className="space-y-6">
                  {/* Shimmer keyframe */}
                  <style>{`
                    @keyframes price-shimmer {
                      0%   { background-position: -200% center; }
                      100% { background-position: 200% center; }
                    }
                    .price-shimmer {
                      background: linear-gradient(
                        90deg,
                        #7BE495 0%,
                        #b8f5cc 35%,
                        #ffffff 50%,
                        #b8f5cc 65%,
                        #7BE495 100%
                      );
                      background-size: 200% auto;
                      -webkit-background-clip: text;
                      background-clip: text;
                      -webkit-text-fill-color: transparent;
                      animation: price-shimmer 2.4s linear infinite;
                    }
                    .price-shimmer-static {
                      background: linear-gradient(90deg, #7BE495 0%, #b8f5cc 50%, #7BE495 100%);
                      -webkit-background-clip: text;
                      background-clip: text;
                      -webkit-text-fill-color: transparent;
                    }
                    
                    /* Light Mode Readability & Contrast Overrides */
                    :root:not(.dark) .price-shimmer {
                      background: linear-gradient(
                        90deg,
                        #047857 0%,
                        #059669 35%,
                        #10b981 50%,
                        #059669 65%,
                        #047857 100%
                      );
                      background-size: 200% auto;
                      -webkit-background-clip: text;
                      background-clip: text;
                      -webkit-text-fill-color: transparent;
                      animation: price-shimmer 2.4s linear infinite;
                    }
                    :root:not(.dark) .price-shimmer-static {
                      background: linear-gradient(90deg, #047857 0%, #059669 50%, #047857 100%);
                      -webkit-background-clip: text;
                      background-clip: text;
                      -webkit-text-fill-color: transparent;
                    }
                    :root:not(.dark) .light-theme-active-badge {
                      color: #047857 !important;
                      border-color: rgba(4, 120, 87, 0.3) !important;
                      background-color: rgba(4, 120, 87, 0.1) !important;
                    }
                    :root:not(.dark) .light-theme-plan-badge {
                      color: #047857 !important;
                    }
                  `}</style>
 
                  <div className="space-y-3">
                    <h4 className={`text-[10px] font-black uppercase tracking-wider px-1 ${isLight ? 'text-black/40' : 'text-white/40'}`}>{t('settings.menu.planDescFree')}</h4>
 
                    <div className="space-y-3">
                      {plans.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        const isCurrent = plan.id === currentPlan;
                        const isDowngrade = PLAN_LEVELS[plan.id] < PLAN_LEVELS[currentPlan];
                        return (
                          <div key={plan.id}>
                            {/* CARD */}
                            <button
                              onClick={() => setSelectedPlan(plan.id)}
                              disabled={isCurrent || isDowngrade}
                              className={`w-full text-left rounded-2xl p-4 flex items-center justify-between transition-all duration-200 ${
                                isCurrent
                                  ? isLight
                                    ? 'bg-[#e8f5ee] border border-[#7BE495]/60'
                                    : 'bg-[#0a2012]/30 border border-[#7BE495]/40 shadow-[inset_0_0_12px_rgba(123,228,149,0.05)]'
                                  : isSelected
                                  ? isLight
                                    ? 'bg-[#f0fbf4] border border-[#7BE495] shadow-[0_0_20px_rgba(123,228,149,0.2)]'
                                    : 'bg-[#0a1a0d] border border-[#7BE495] shadow-[0_0_20px_rgba(123,228,149,0.2)]'
                                  : isDowngrade
                                  ? isLight
                                    ? 'bg-[#f5f5f5] border border-[#ddd] opacity-50 cursor-not-allowed'
                                    : 'bg-[#0b0b0b] border border-[#222] opacity-50 cursor-not-allowed'
                                  : isLight
                                    ? 'bg-white border border-[#e0e0e0] hover:border-[#ccc]'
                                    : 'bg-[#0b0b0b] border border-[#222] hover:border-[#333]'
                              }`}
                            >
                              {/* LEFT: plan info */}
                              <div className="flex flex-col gap-0.5">
                                {plan.badge && (
                                  <span className="text-[10px] font-black text-[#7BE495] uppercase tracking-wider light-theme-plan-badge">{plan.badge}</span>
                                )}
                                <span className={`text-sm font-black ${isCurrent || isSelected ? (isLight ? 'text-black' : 'text-white') : (isLight ? 'text-black/80' : 'text-white/80')}`}>{plan.name}</span>
                                <span className={`text-[10px] max-w-[160px] leading-relaxed ${isLight ? 'text-black/50' : 'text-white/40'}`}>{plan.sub}</span>
                              </div>

                              {/* RIGHT: discount badge (if any) + price or status */}
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {/* Discount badge — in the right column, above the price */}
                                {!isCurrent && plan.discount && (
                                  <div
                                    className={`px-2 py-0.5 rounded-md transition-opacity duration-200 ${isDowngrade ? 'opacity-50' : ''}`}
                                    style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%)' }}
                                  >
                                    <span className="text-[9px] font-black leading-none tracking-wide" style={{ color: '#ecfdf5' }}>
                                      {plan.discount.replace(' OFF', '')}
                                    </span>
                                  </div>
                                )}

                                {isCurrent ? (
                                  <span className="text-xs font-black text-[#7BE495] bg-[#7BE495]/10 px-2.5 py-1.5 rounded-lg border border-[#7BE495]/30 uppercase tracking-wider light-theme-active-badge">
                                    {t('settings.planCurrent')}
                                  </span>
                                ) : (
                                  <>
                                    <span className={`text-base font-black ${isSelected ? 'price-shimmer' : 'price-shimmer-static'}`}>
                                      {plan.price}
                                    </span>
                                    {plan.id !== 'free' && (
                                      <span className={`text-[10px] line-through ${isLight ? 'text-black/30 decoration-black/30' : 'text-white/30 decoration-white/40'}`}>
                                        {plan.originalPrice}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`border rounded-[24px] p-5 space-y-3 mt-6 ${isLight ? 'bg-white border-[#e0e0e0]' : 'bg-[#0b0b0b] border-[#222]'}`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-black/40' : 'text-white/40'}`}>{t('settings.promoCode')}</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder={t('settings.enterCode')}
                        className={`flex-1 border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#7BE495]/40 ${
                          isLight
                            ? 'bg-[#f5f5f5] border-[#e0e0e0] text-[#047857] placeholder:text-black/20'
                            : 'bg-[#0c0c0c] border-[#222] text-[#7BE495] placeholder:text-white/20'
                        }`}
                      />
                      <button
                        onClick={handleRedeemPromo}
                        className="px-5 bg-[#7BE495] text-black font-black text-xs rounded-xl border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-[#6dd685]"
                      >
                        {t('settings.redeemBtn')}
                      </button>
                    </div>
                  </div>
                </section>
              );
            })()}



            {/* VIEW: SUPPORT & INFO */}
            {currentView === 'support' && (
              <section className="space-y-6">
                {/* ACCORDION FAQ */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-wider px-1">{t('settings.faqTitle')}</h4>
                  <div className="space-y-2">
                    {faqs.map((faq, index) => (
                      <div key={index} className="bg-[#0b0b0b] border border-[#222] rounded-xl overflow-hidden">
                        <button
                          onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                          className="w-full flex items-center justify-between p-4 text-left"
                        >
                          <span className="text-xs font-bold text-white">{faq.q}</span>
                          <Icon 
                            icon="solar:alt-arrow-down-bold" 
                            className={`text-white/40 transition-transform duration-200 ${activeFaq === index ? 'rotate-180' : ''}`}
                            width={16} 
                          />
                        </button>
                        <AnimatePresence>
                          {activeFaq === index && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-4 text-[11px] text-white/50 leading-relaxed border-t border-[#111] pt-3">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONTACT FORM */}
                <div className="bg-[#0b0b0b] border border-[#222] rounded-[24px] p-5 space-y-4">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.contactSupportTitle')}</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder={t('settings.subjectPlaceholder')}
                      className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40"
                    />
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder={t('settings.messagePlaceholder')}
                      rows={3}
                      className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40 resize-none"
                    />
                    <button
                      onClick={handleSendSupport}
                      className="w-full py-3 bg-[#111] hover:bg-[#161616] text-[#7BE495] border border-[#222] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Icon icon="solar:plain-bold" width={14} />
                      <span>{t('settings.sendMessageBtn')}</span>
                    </button>
                  </div>
                </div>

                {/* USER FEEDBACK */}
                <div className="bg-[#0b0b0b] border border-[#222] rounded-[24px] p-5 space-y-4">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-wider">{t('settings.rateAppTitle')}</h4>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 focus:outline-none"
                      >
                        <Icon 
                          icon="solar:star-bold" 
                          className={star <= feedbackRating ? 'text-[#7BE495]' : 'text-neutral-700'} 
                          width={28} 
                        />
                      </button>
                    ))}
                  </div>
                  {feedbackRating > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={t('settings.feedbackPlaceholder')}
                        rows={2}
                        className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#7BE495]/40 resize-none"
                      />
                      <button
                        onClick={handleSendFeedback}
                        className="w-full py-3 bg-[#7BE495] text-black font-black text-xs rounded-xl border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                      >
                        {t('settings.submitFeedbackBtn')}
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* APP SYSTEM & LEGAL INFO */}
                <div className="bg-[#0b0b0b] border border-[#222] rounded-[24px] p-5 space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-black border border-[#222] flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      <Icon icon="solar:settings-bold" className="text-[#7BE495]" width={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight">InTracker Mobile</h4>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {t('settings.aboutDesc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); triggerToast('Opening Privacy Policy...'); }}
                    className="w-full flex items-center justify-between p-4 bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl hover:border-[#333] transition-colors"
                  >
                    <span className="text-xs font-bold text-white">{t('settings.privacyPolicy')}</span>
                    <Icon icon="solar:alt-arrow-right-bold" className="text-white/20" width={16} />
                  </a>

                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); triggerToast('Opening Terms of Service...'); }}
                    className="w-full flex items-center justify-between p-4 bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl hover:border-[#333] transition-colors"
                  >
                    <span className="text-xs font-bold text-white">{t('settings.termsOfService')}</span>
                    <Icon icon="solar:alt-arrow-right-bold" className="text-white/20" width={16} />
                  </a>
                </div>
              </section>
            )}

            {/* VIEW: TIMEZONE */}
            {currentView === 'timezone' && (
              <div className="space-y-6 flex flex-col h-full text-left">
                {/* CURRENT SECTION */}
                <div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{t('settings.timezoneCurrent')}</span>
                  <p className="text-[11px] text-white/40 mt-1 mb-3">{t('settings.timezoneCurrentDesc')}</p>
                  
                  <div className="bg-[#0b0b0b] border border-[#1c1c1c] rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-white block">
                        {(selectedTz || 'Asia/Jakarta').split('/').pop()?.replace(/_/g, ' ') || 'Unknown City'}
                      </span>
                      <span className="text-xs text-white/40 block mt-1">{selectedTz || 'Asia/Jakarta'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-[#1a1a1a] border border-white/10 text-white/80 font-black text-[10px] uppercase tracking-wider rounded-lg">
                        {getGMTOffset(selectedTz || 'Asia/Jakarta')}
                      </span>
                      <button
                        onClick={handleSyncLocation}
                        disabled={isSyncingLocation}
                        className="w-9 h-9 rounded-xl bg-[#141414] border border-[#222] flex items-center justify-center text-[#7BE495] hover:bg-[#1a1a1a] transition-all"
                        title="Sync using Location"
                      >
                        {isSyncingLocation ? (
                          <Icon icon="line-md:loading-twotone-loop" width={16} />
                        ) : (
                          <Icon icon="solar:gps-bold" width={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CHANGE TIME ZONE SECTION */}
                <div className="flex-1 flex flex-col min-h-0">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-3">{t('settings.timezoneChange')}</span>
                  
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" width={16} />
                    <input
                      type="text"
                      value={tzSearch}
                      onChange={(e) => setTzSearch(e.target.value)}
                      placeholder={t('settings.timezoneSearchPlaceholder')}
                      className="w-full bg-[#0b0b0b] border border-[#1c1c1c] rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold text-white placeholder:text-white/20 focus:outline-none focus:border-[#7BE495]/40 transition-colors"
                    />
                  </div>

                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2 pb-6 max-h-[280px]">
                    {timeZoneList
                      .filter(item => 
                        item.city.toLowerCase().includes(tzSearch.toLowerCase()) || 
                        item.zone.toLowerCase().includes(tzSearch.toLowerCase())
                      )
                      .map((item) => {
                        const isSelected = selectedTz === item.zone;
                        return (
                          <button
                            key={item.zone}
                            onClick={() => setSelectedTz(item.zone)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                              isSelected
                                ? 'bg-[#0a1a0d] border-[#7BE495] text-white shadow-[0_0_15px_rgba(123,228,149,0.15)]'
                                : 'bg-[#0b0b0b] border-[#1c1c1c] text-white/70 hover:border-[#2b2b2b]'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-black block">{item.city}</span>
                              <span className="text-[10px] text-white/30 block mt-0.5">{item.zone}</span>
                            </div>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-[#7BE495]' : 'text-white/30'}`}>
                              {getGMTOffset(item.zone)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: DISPLAY THEME */}
            {currentView === 'theme' && (
              <div className="space-y-6 text-left">
                <div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{t('settings.themeTitle').toUpperCase()}</span>
                  <p className="text-[11px] text-white/40 mt-1 mb-4">{t('settings.themeDesc')}</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(['Light', 'Dark', 'System'] as const).map((themeVal) => {
                      const isActive = settings.theme === themeVal;
                      const label = themeVal === 'Light' 
                        ? (language === 'Bahasa Indonesia' ? 'Terang' : 'Light') 
                        : themeVal === 'Dark' 
                        ? (language === 'Bahasa Indonesia' ? 'Gelap' : 'Dark') 
                        : (language === 'Bahasa Indonesia' ? 'Sistem' : 'System');
                      return (
                        <button
                          key={themeVal}
                          onClick={() => {
                            updateSettings({ theme: themeVal });
                            if (themeVal === 'Dark') {
                              document.documentElement.classList.add('dark');
                            } else if (themeVal === 'Light') {
                              document.documentElement.classList.remove('dark');
                            } else {
                              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                              if (prefersDark) {
                                document.documentElement.classList.add('dark');
                              } else {
                                document.documentElement.classList.remove('dark');
                              }
                            }
                            if (navigator.vibrate) navigator.vibrate(10);
                            triggerToast(language === 'Bahasa Indonesia' ? `Beralih ke Mode ${label}` : `Switched to ${themeVal} Mode`);
                          }}
                          className={`py-5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-2.5 ${
                            isActive
                              ? 'bg-[#7BE495] text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                              : 'bg-[#0c0c0c] border-[#222] text-white/60 hover:border-[#333]'
                          }`}
                        >
                          <Icon 
                            icon={themeVal === 'Light' ? 'solar:sun-bold' : themeVal === 'Dark' ? 'solar:moon-bold' : 'solar:settings-bold'} 
                            width={22} 
                            height={22} 
                          />
                          <span className="text-[11px]">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: LANGUAGE */}
            {currentView === 'language' && (() => {
              const languages = [
                { code: 'en', label: 'English', native: 'English' },
                { code: 'id', label: 'Bahasa Indonesia', native: 'Indonesia' },
                { code: 'es', label: 'Español', native: 'Español' },
                { code: 'zh', label: 'Chinese', native: '中文' },
                { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                { code: 'ar', label: 'Arabic', native: 'العربية' },
                { code: 'pt', label: 'Portuguese', native: 'Português' },
                { code: 'fr', label: 'Français', native: 'Français' },
                { code: 'ja', label: 'Japanese', native: '日本語' },
                { code: 'de', label: 'Deutsch', native: 'Deutsch' },
              ];
              return (
                <div className="space-y-6 text-left">
                  <div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{t('settings.appLanguage').toUpperCase()}</span>
                    <p className="text-[11px] text-white/40 mt-1 mb-4">{t('settings.appLanguageDesc')}</p>
                    
                    <div className="space-y-2">
                      {languages.map((lang) => {
                        const isActive = settings.language === lang.label;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => {
                              updateSettings({ language: lang.label });
                              if (navigator.vibrate) navigator.vibrate(10);
                              triggerToast(language === 'Bahasa Indonesia' ? `Bahasa diubah ke ${lang.label}` : `Language set to ${lang.label}`);
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                              isActive
                                ? 'bg-[#0a1a0d] border-[#7BE495] text-white shadow-[0_0_15px_rgba(123,228,149,0.15)]'
                                : 'bg-[#0b0b0b] border-[#1c1c1c] text-white/70 hover:border-[#2b2b2b]'
                            }`}
                          >
                            <span className="text-xs font-black">{lang.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-white/30">{lang.native}</span>
                              {isActive && <Icon icon="ph:check-bold" width={14} className="text-[#7BE495]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* VIEW: SLEEP MODE */}
            {currentView === 'sleep' && (
              <div className="space-y-6 text-left">
                <div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{t('settings.sleepTitle').toUpperCase()}</span>
                  <p className="text-[11px] text-white/40 mt-1 mb-4">{t('settings.sleepDesc')}</p>
                  
                  <div className="bg-[#0b0b0b] border border-[#1c1c1c] rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex flex-col text-left pr-4">
                      <span className="text-sm font-black text-white">{t('settings.sleepPauseLabel')}</span>
                      <span className="text-[10px] text-white/40 mt-1.5 leading-relaxed">
                        {t('settings.sleepPauseDesc')}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const newVal = !settings.programPaused;
                        const todayStr = new Date().toLocaleDateString('en-CA');
                        let updatedPaused = [...(settings.pausedDays || [])];
                        if (!newVal) {
                          updatedPaused = updatedPaused.filter(d => d !== todayStr);
                        } else {
                          if (!updatedPaused.includes(todayStr)) {
                            updatedPaused.push(todayStr);
                          }
                        }
                        updateSettings({ 
                          programPaused: newVal,
                          pausedDays: updatedPaused
                        });
                        if (navigator.vibrate) navigator.vibrate(10);
                        triggerToast(newVal 
                          ? (language === 'Bahasa Indonesia' ? 'Program dijeda (Mode Tidur aktif) 💤' : 'Program paused (Sleep Mode active) 💤') 
                          : (language === 'Bahasa Indonesia' ? 'Program dilanjutkan! 🔥' : 'Program resumed! 🔥')
                        );
                      }}
                      className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                        settings.programPaused ? 'bg-[#7BE495]' : 'bg-[#222]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform duration-200 ${
                          settings.programPaused ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: REMINDERS & ALERTS */}
            {currentView === 'reminders' && (
              <div className="space-y-6 text-left">
                <div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{t('settings.remindersTitle').toUpperCase()}</span>
                  <p className="text-[11px] text-white/40 mt-1 mb-4">{t('settings.remindersDesc')}</p>
                  
                  <div className="bg-[#0b0b0b] border border-[#1c1c1c] rounded-2xl p-5 space-y-5">
                    {/* Item 1: Daily Reminder */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex flex-col text-left pr-4">
                        <span className="text-xs font-bold text-white">{t('settings.dailyReminderTitle')}</span>
                        <span className="text-[10px] text-white/40 mt-1">{t('settings.dailyReminderDesc')}</span>
                      </div>
                      <button
                        onClick={() => handleToggle('dailyReminder')}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                          settings.dailyReminder ? 'bg-[#7BE495]' : 'bg-[#222]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform duration-200 ${
                            settings.dailyReminder ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Daily Reminder Time input */}
                    {settings.dailyReminder && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="py-2.5 flex items-center justify-between border-t border-[#1c1c1c]"
                      >
                        <span className="text-xs font-bold text-white/60">{t('settings.reminderTimeLabel')}</span>
                        <input
                          type="time"
                          value={settings.dailyReminderTime.includes('AM') || settings.dailyReminderTime.includes('PM') ? "20:00" : settings.dailyReminderTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSettings({ dailyReminderTime: val });
                          }}
                          className="bg-black border border-[#222] rounded-lg px-2.5 py-1.5 text-xs text-[#7BE495] font-black focus:outline-none"
                        />
                      </motion.div>
                    )}

                    {/* Item 2: Weekly Summary */}
                    <div className="flex items-center justify-between py-1 border-t border-[#1c1c1c] pt-5">
                      <div className="flex flex-col text-left pr-4">
                        <span className="text-xs font-bold text-white">{t('settings.weeklySummaryTitle')}</span>
                        <span className="text-[10px] text-white/40 mt-1">{t('settings.weeklySummaryDesc')}</span>
                      </div>
                      <button
                        onClick={() => handleToggle('weeklySummary')}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                          settings.weeklySummary ? 'bg-[#7BE495]' : 'bg-[#222]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform duration-200 ${
                            settings.weeklySummary ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Item 3: Incomplete Habits */}
                    <div className="flex items-center justify-between py-1 border-t border-[#1c1c1c] pt-5">
                      <div className="flex flex-col text-left pr-4">
                        <span className="text-xs font-bold text-white">{t('settings.incompleteHabitsTitle')}</span>
                        <span className="text-[10px] text-white/40 mt-1">{t('settings.incompleteHabitsDesc')}</span>
                      </div>
                      <button
                        onClick={() => handleToggle('newFeatures')}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                          settings.newFeatures ? 'bg-[#7BE495]' : 'bg-[#222]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform duration-200 ${
                            settings.newFeatures ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOG OUT / ACTIONS */}
            {currentView === 'menu' && (
              <section className="pt-6 border-t border-[#1c1c1c] flex flex-col gap-4">
                <button
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    setConfirmAction('logout');
                  }}
                  className="w-full py-4 bg-[#ef4444] text-black font-black text-xs rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000]"
                >
                  <Icon icon="ph:sign-out-bold" width={16} />
                  <span>{t('settings.logout')}</span>
                </button>
                
                <button
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    setConfirmAction('delete');
                  }}
                  className="w-full py-4 bg-[#1e1515] text-[#ef4444] font-black text-xs rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000]"
                >
                  <Icon icon="ph:trash-bold" width={16} />
                  <span>{t('settings.deleteAccount')}</span>
                </button>
              </section>
            )}


          </div>

          {/* STICKY FOOTER FOR PROFILE, PREMIUM PLAN, TIMEZONE & OTHER SUBVIEWS */}
          {['profile', 'premium', 'timezone', 'theme', 'language', 'sleep', 'reminders'].includes(currentView) && (
            <div className="border-t border-[#1c1c1c] bg-[#070707]/90 backdrop-blur-xl px-6 py-4 flex-shrink-0 z-20 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
              {currentView === 'profile' && (
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-4 bg-[#7BE495] text-black font-black text-sm rounded-xl border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all"
                >
                  <Icon icon="solar:diskette-bold" width={18} />
                  <span>{t('settings.saveProfile')}</span>
                </button>
              )}
              {currentView === 'premium' && (
                <button
                  onClick={() => {
                    if (!selectedPlan) { triggerToast(t('settings.planSelectFirst')); return; }
                    if (selectedPlan === 'free') {
                      setSubscriptionPlan('free');
                      setSelectedPlan(null);
                      triggerToast(t('settings.planRevertedFree'));
                      return;
                    }
                    // Open checkout bottom sheet instead of instantly granting
                    setCheckoutPlan(selectedPlan);
                    setIsCheckoutOpen(true);
                    setPaymentSuccess(false);
                    setIsProcessingPayment(false);
                  }}
                  className="w-full py-4 bg-[#7BE495] text-black font-black text-sm rounded-xl border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all"
                >
                  <Icon icon="solar:wallet-money-bold" width={18} />
                  <span>
                    {selectedPlan
                      ? (language === 'Bahasa Indonesia'
                          ? `Langganan ${selectedPlan === 'free' ? 'Free Plan' : selectedPlan === 'weekly' ? 'Mingguan' : selectedPlan === 'monthly' ? 'Bulanan' : 'Tahunan'}`
                          : (language === 'Arabic'
                              ? `الاشتراك في ${selectedPlan === 'free' ? 'الخطة المجانية' : t(`settings.plan${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}Label`)}`
                              : `Subscribe to ${selectedPlan === 'free' ? 'Free Plan' : t(`settings.plan${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}Label`)}`))
                      : t('settings.planChoose')}
                  </span>
                </button>
              )}
              {currentView === 'timezone' && (
                <button
                  onClick={handleSaveTimezone}
                  className="w-full py-4 bg-[#7BE495] text-black font-black text-sm rounded-xl border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all"
                >
                  <Icon icon="solar:diskette-bold" width={18} />
                  <span>{t('settings.saveProfile')}</span>
                </button>
              )}
              {['theme', 'language', 'sleep', 'reminders'].includes(currentView) && (
                <button
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    setCurrentView('menu');
                  }}
                  className="w-full py-4 bg-[#7BE495] text-black font-black text-sm rounded-xl border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all"
                >
                  <span>{t('settings.backBtn')}</span>
                </button>
              )}
            </div>
          )}

          {/* CONFIRMATION DIALOG (NEOBRUTALIST STYLE) */}
          <AnimatePresence>
            {confirmAction && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="w-full max-w-[320px] bg-[#16181c] border-[3px] border-black rounded-[24px] p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden"
                >
                  {/* Top Accent line */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-[#ef4444]" />

                  <div className="w-14 h-14 rounded-2xl bg-black border-2 border-black shadow-[4px_4px_0px_#ef4444] flex items-center justify-center mx-auto mb-4 mt-2">
                    <Icon 
                      icon={confirmAction === 'delete' ? 'ph:warning-bold' : 'ph:sign-out-bold'} 
                      className="text-[#ef4444]" 
                      width={28} 
                    />
                  </div>

                  <h3 className="text-base font-black text-white uppercase tracking-wider font-['Outfit'] mb-2">
                    {confirmAction === 'delete' ? t('settings.deleteAccountTitle') : t('settings.logoutTitle')}
                  </h3>

                  <p className="text-xs text-white/50 leading-relaxed mb-6 px-2">
                    {confirmAction === 'delete' 
                      ? t('settings.deleteAccountConfirm') 
                      : t('settings.logoutConfirm')}
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setConfirmAction(null)}
                      className="flex-1 py-3 bg-white text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] uppercase tracking-wider transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000]"
                    >
                      {t('settings.cancel')}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        if (confirmAction === 'logout') {
                          setConfirmAction(null);
                          if (navigator.vibrate) navigator.vibrate(20);
                          try {
                            const { supabase } = await import('../lib/supabase');
                            await supabase.auth.signOut();
                          } catch (err) {
                            console.error("Sign out error:", err);
                          }
                          localStorage.clear();
                          window.location.href = '/login';
                        } else {
                          // Delete account simulation
                          setConfirmAction(null);
                          triggerToast('Request penghapusan akun berhasil dikirim');
                        }
                      }}
                      className="flex-1 py-3 bg-[#ef4444] text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] uppercase tracking-wider transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000]"
                    >
                      {confirmAction === 'delete' ? t('settings.confirmDelete') : t('settings.confirmLogout')}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MOCK CHECKOUT BOTTOM SHEET */}
          <AnimatePresence>
            {isCheckoutOpen && (
              <div className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (!isProcessingPayment) setIsCheckoutOpen(false);
                  }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative w-full max-w-md bg-[#16181c] border-[2px] border-black rounded-[32px] p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-30"
                >
                  <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
                  
                  {paymentSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-20 h-20 rounded-full bg-[#00FF85]/10 border-[1.5px] border-[#00FF85]/30 flex items-center justify-center mb-6 shadow-xl animate-pulse">
                        <Icon icon="solar:check-circle-bold" className="text-[#00FF85]" width={48} height={48} />
                      </div>
                      <h4 className="text-xl font-black font-['Outfit'] text-white uppercase tracking-wider mb-2">
                        {language === 'Bahasa Indonesia' ? 'PEMBAYARAN BERHASIL!' : 'PAYMENT SUCCESSFUL!'}
                      </h4>
                      <p className="text-xs text-white/40 leading-relaxed px-6">
                        {language === 'Bahasa Indonesia' 
                          ? 'Terima kasih! Akun Anda kini aktif sebagai anggota premium.' 
                          : 'Thank you! Your account is now active as a premium member.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h4 className="text-[16px] font-black font-['Outfit'] text-[#7BE495] uppercase tracking-wider mb-1">
                          {language === 'Bahasa Indonesia' ? 'Konfirmasi Pembayaran' : 'Checkout Premium'}
                        </h4>
                        <p className="text-[11px] text-white/40">{language === 'Bahasa Indonesia' ? 'Selesaikan langganan Anda' : 'Complete your subscription'}</p>
                      </div>

                      {/* Plan detail card */}
                      <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-white/40 font-bold uppercase tracking-wider">{language === 'Bahasa Indonesia' ? 'PAKET PILIHAN' : 'SELECTED PLAN'}</span>
                          <span className="text-sm font-black text-white uppercase tracking-tight">
                            InTracker {checkoutPlan === 'weekly' ? 'Weekly' : checkoutPlan === 'monthly' ? 'Monthly' : 'Annual'}
                          </span>
                        </div>
                        <span className="text-lg font-black text-[#7BE495]">
                          {checkoutPlan === 'weekly' ? 'Rp10.000' : checkoutPlan === 'monthly' ? 'Rp30.000' : 'Rp300.000'}
                        </span>
                      </div>

                      {/* Payment Methods */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
                          {language === 'Bahasa Indonesia' ? 'PILIH METODE PEMBAYARAN' : 'SELECT PAYMENT METHOD'}
                        </span>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'gopay', label: 'GoPay / OVO', icon: 'solar:wallet-bold' },
                            { id: 'va', label: 'Bank Transfer', icon: 'solar:card-transfer-bold' },
                            { id: 'cc', label: 'Credit Card', icon: 'solar:card-bold' }
                          ].map((method) => (
                            <button
                              key={method.id}
                              onClick={() => {
                                if (!isProcessingPayment) setSelectedPaymentMethod(method.id as any);
                              }}
                              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                                selectedPaymentMethod === method.id
                                  ? 'bg-[#7BE495]/10 border-[#7BE495] text-[#7BE495]'
                                  : 'bg-[#0b0b0b] border-[#222] text-white/45 hover:text-white/60'
                              }`}
                            >
                              <Icon icon={method.icon} width={18} />
                              <span className="text-[8px] font-black uppercase tracking-wider leading-none">{method.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={handleConfirmPayment}
                        disabled={isProcessingPayment}
                        className="w-full py-4 bg-[#7BE495] hover:bg-[#6dd685] disabled:opacity-50 text-black font-black text-sm rounded-xl border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all mt-4"
                      >
                        {isProcessingPayment ? (
                          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <>
                            <Icon icon="solar:wallet-money-bold" width={18} />
                            <span>{language === 'Bahasa Indonesia' ? 'BAYAR SEKARANG' : 'PAY NOW'}</span>
                          </>
                        )}
                      </button>

                      {/* Cancel */}
                      {!isProcessingPayment && (
                        <button
                          onClick={() => setIsCheckoutOpen(false)}
                          className="w-full text-center text-[#E3DAC9]/40 text-[11px] font-bold font-['Outfit'] uppercase tracking-wider pt-2"
                        >
                          {language === 'Bahasa Indonesia' ? 'BATALKAN' : 'CANCEL'}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {cropImageSrc && (
            <AvatarCropModal
              src={cropImageSrc}
              language={language}
              onCrop={(croppedImg) => {
                setAvatarUrl(croppedImg);
                setCropImageSrc(null);
              }}
              onCancel={() => setCropImageSrc(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── AVATAR CROP MODAL ───────────────────────────────────────────────────────
interface AvatarCropModalProps {
  src: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
  language: string;
}

function AvatarCropModal({ src, onCrop, onCancel, language }: AvatarCropModalProps) {
  const { settings } = useUserStore();
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle dragging start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setStartX(clientX - panX);
    setStartY(clientY - panY);
  };

  // Handle dragging move
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setPanX(clientX - startX);
    setPanY(clientY - startY);
  };

  // Handle dragging end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle Crop Execution
  const handleCrop = () => {
    if (!viewportRef.current || !imgRef.current) return;

    const viewportRect = viewportRef.current.getBoundingClientRect();
    const imgRect = imgRef.current.getBoundingClientRect();

    // Crop box size (70% of viewport width)
    const cropSize = viewportRect.width * 0.7;

    // Calculate crop box coordinates relative to viewport
    const x_crop = (viewportRect.width - cropSize) / 2;
    const y_crop = (viewportRect.height - cropSize) / 2;

    // Calculate image position relative to crop box
    const dx = imgRect.left - (viewportRect.left + x_crop);
    const dy = imgRect.top - (viewportRect.top + y_crop);

    // Canvas size (300x300 for high quality)
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background fill
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 300, 300);

      // Clip as circle so the exported image has a clean crop
      ctx.beginPath();
      ctx.arc(150, 150, 150, 0, 2 * Math.PI);
      ctx.clip();

      // Scale factor from viewport crop circle to canvas
      const f = 300 / cropSize;

      // Draw the image
      ctx.drawImage(
        imgRef.current,
        dx * f,
        dy * f,
        imgRect.width * f,
        imgRect.height * f
      );

      // Export as Data URL
      const croppedDataUrl = canvas.toDataURL('image/png');
      onCrop(croppedDataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-[340px] bg-[#1c1e22] border-[3px] border-black rounded-[32px] p-6 shadow-[8px_8px_0px_rgba(0,255,133,0.2)] flex flex-col gap-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-md font-black font-['Outfit'] text-white uppercase tracking-wider">
            {language === 'Bahasa Indonesia' ? 'Sesuaikan Foto' : 'Adjust Photo'}
          </h3>
          <button 
            onClick={onCancel} 
            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              settings.theme === 'Light'
                ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                : 'bg-black border-white text-white shadow-[3px_3px_0px_rgba(255,255,255,1)]'
            }`}
          >
            <Icon icon="ph:x-bold" width={14} />
          </button>
        </div>

        {/* Viewport Area */}
        <div
          ref={viewportRef}
          className="w-full aspect-square relative rounded-2xl overflow-hidden bg-[#0c0c0c] border border-white/10 cursor-move touch-none select-none flex items-center justify-center"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Image */}
          <img
            ref={imgRef}
            src={src}
            alt="To Crop"
            className="pointer-events-none select-none max-w-full max-h-full"
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          />

          {/* Dark overlay mask with transparent circle in middle */}
          <div className="absolute inset-0 pointer-events-none w-full h-full">
            <svg className="w-full h-full text-black/70 fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z M 50 15 A 35 35 0 1 0 50 85 A 35 35 0 1 0 50 15 Z" fillRule="evenodd" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="#00FF85" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-wider">
            <span>Zoom</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon icon="ph:minus-bold" className="text-white/40" width={14} />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-[#00FF85] bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
            />
            <Icon icon="ph:plus-bold" className="text-white/40" width={14} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={onCancel}
            className="py-3.5 bg-black/40 border border-white/10 rounded-xl font-bold text-xs text-white/70 hover:text-white uppercase tracking-wider"
          >
            {language === 'Bahasa Indonesia' ? 'Batal' : 'Cancel'}
          </button>
          <button
            onClick={handleCrop}
            className="py-3.5 bg-[#00FF85] border border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-xl font-black text-xs text-black uppercase tracking-wider active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)]"
          >
            {language === 'Bahasa Indonesia' ? 'Gunakan' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
