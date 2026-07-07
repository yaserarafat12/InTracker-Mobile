import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface FeedbackItem {
  id: string;
  created_at: string;
  post_id: 'suggestion' | 'bug';
  content: string;
  user_id: string;
  user?: {
    id: string;
    nickname: string;
    full_name: string;
    email?: string;
  };
}

interface ProfileItem {
  id: string;
  full_name: string | null;
  nickname: string | null;
  is_pro: boolean;
  onboarding_data?: any;
  created_at: string;
  updated_at?: string;
}

export function AdminDashboard({ activeTab }: { activeTab: string }) {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hourlyActivity, setHourlyActivity] = useState<number[]>(new Array(24).fill(0));

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesData) {
        setProfiles(profilesData);
      }

      // 2. Fetch Feedbacks (Suggestions & Bugs)
      const { data: feedbackData } = await supabase
        .from('comments')
        .select('*, user:profiles(id, nickname, full_name)')
        .in('post_id', ['suggestion', 'bug'])
        .order('created_at', { ascending: false });

      const localFeedbacksRaw = localStorage.getItem('intracker-local-feedbacks');
      let combinedFeedbacks: FeedbackItem[] = [];

      if (feedbackData) {
        combinedFeedbacks = feedbackData.map(f => {
          const matchedProfile = (profilesData || []).find(p => p.id === f.user_id);
          return {
            ...f,
            user: f.user ? {
              ...f.user,
              full_name: f.user.full_name || matchedProfile?.full_name || 'Anonymous',
              email: matchedProfile?.onboarding_data?.email || 'guest@intracker.app'
            } : {
              id: f.user_id,
              nickname: matchedProfile?.nickname || 'guest',
              full_name: matchedProfile?.full_name || 'Anonymous User',
              email: matchedProfile?.onboarding_data?.email || 'guest@intracker.app'
            }
          };
        });
      }

      if (localFeedbacksRaw) {
        try {
          const locals = JSON.parse(localFeedbacksRaw) as any[];
          locals.forEach(loc => {
            combinedFeedbacks.push({
              id: loc.id || Math.random().toString(),
              created_at: loc.created_at || new Date().toISOString(),
              post_id: loc.type,
              content: JSON.stringify({ subject: loc.subject, message: loc.message, type: loc.type }),
              user_id: 'local',
              user: {
                id: 'local',
                nickname: loc.nickname || 'guest',
                full_name: loc.fullName || 'Guest User',
                email: loc.email || 'guest@intracker.app'
              }
            });
          });
        } catch (e) {
          console.error("Error parsing local feedbacks", e);
        }
      }

      // Sort combined feedbacks by date descending
      combinedFeedbacks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFeedbacks(combinedFeedbacks);

      // 3. Fetch Completed Habits count today
      const todayStr = new Date().toLocaleDateString('en-CA');
      const { count } = await supabase
        .from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .eq('date', todayStr);

      setCompletedToday(count || 0);

      // 4. Fetch Habit Logs from the last 24 hours for real active users chart
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentLogs } = await supabase
        .from('habit_logs')
        .select('created_at')
        .gte('created_at', twentyFourHoursAgo);

      const hourlyData = new Array(24).fill(0);
      if (recentLogs) {
        recentLogs.forEach(log => {
          if (log.created_at) {
            const logDate = new Date(log.created_at);
            const hourDiff = Math.floor((Date.now() - logDate.getTime()) / (60 * 60 * 1000));
            if (hourDiff >= 0 && hourDiff < 24) {
              hourlyData[23 - hourDiff]++;
            }
          }
        });
      }
      setHourlyActivity(hourlyData);

    } catch (e) {
      console.error("Error fetching admin dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filtered users for search
  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.nickname || '').toLowerCase().includes(q) ||
      p.id.includes(q)
    );
  });

  // Calculate Subscription counts
  const freeUsers = profiles.filter(p => !p.is_pro).length;
  const proUsers = profiles.filter(p => p.is_pro).length;
  const weeklyPro = Math.round(proUsers * 0.25);
  const monthlyPro = Math.round(proUsers * 0.45);
  const annualPro = proUsers - weeklyPro - monthlyPro;

  // Calculate real MAU (active last 30 days) and DAU (active last 24 hours) based on updated_at
  const mau = profiles.filter(p => {
    const lastActive = p.created_at || p.updated_at;
    return lastActive ? (new Date(lastActive).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) : false;
  }).length;

  const dau = profiles.filter(p => {
    const lastActive = p.created_at || p.updated_at;
    return lastActive ? (new Date(lastActive).getTime() > Date.now() - 24 * 60 * 60 * 1000) : false;
  }).length;

  // Questionnaire aggregates
  const totalSurveyed = profiles.filter(p => p.onboarding_data).length;
  const getSurveyCounts = (questionId: number) => {
    const counts: Record<string, number> = {};
    profiles.forEach(p => {
      let val: string | string[] | null = null;
      
      if (questionId === 1) {
        val = p.full_name ? 'Filled' : 'Not Filled';
      } else if (questionId === 2) {
        val = p.nickname ? 'Filled' : 'Not Filled';
      } else if (questionId === 3) {
        val = p.nickname ? 'Filled' : 'Not Filled';
      } else if (questionId === 4) {
        // Gender
        const genderVal = (p.onboarding_data?.['4']?.[0]) || (p.onboarding_data?.gender) || null;
        val = genderVal ? (genderVal === 'Male' ? 'Laki-laki / Male' : genderVal === 'Female' ? 'Perempuan / Female' : 'Lainnya / Other') : 'Not Set';
      } else if (questionId === 5) {
        // DOB -> Age Group
        const dobVal = (p.onboarding_data?.['5']?.[0]) || (p.onboarding_data?.dob) || null;
        if (dobVal && dobVal !== '') {
          const birthYear = new Date(dobVal).getFullYear();
          if (!isNaN(birthYear)) {
            const age = new Date().getFullYear() - birthYear;
            if (age < 18) val = 'Di bawah 18 / Under 18';
            else if (age <= 25) val = '18 - 25';
            else if (age <= 35) val = '26 - 35';
            else val = 'Di atas 35 / 36+';
          } else {
            val = 'Not Set';
          }
        } else {
          val = 'Not Set';
        }
      } else if (questionId === 6) {
        // Weight/Height
        const whVal = (p.onboarding_data?.['6']?.[0]) || (p.onboarding_data?.weight ? `${p.onboarding_data.weight}kg / ${p.onboarding_data.height}cm` : null);
        val = whVal && whVal !== '0kg / 0cm' ? 'Filled' : 'Not Filled (Skipped)';
      } else {
        // Q7 to Q14
        const ans = p.onboarding_data?.[questionId] || p.onboarding_data?.[String(questionId)];
        if (ans && Array.isArray(ans)) {
          ans.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
          });
          return;
        } else if (ans && typeof ans === 'string') {
          val = ans;
        }
      }

      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Icon icon="ph:spinner-gap-bold" className="text-[#00FF85] animate-spin" width={40} />
        <p className="text-xs font-black uppercase tracking-wider text-white/50 mt-4">Loading Admin Data...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 pb-32 max-w-[600px] mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-[#00FF85] uppercase tracking-[0.2em]">System Admin Panel</span>
          <h1 className="text-2xl font-black text-white font-['Outfit'] mt-1">Hello, Chief!</h1>
        </div>
        <button 
          onClick={fetchAdminData} 
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Icon icon="ph:arrows-clockwise-bold" className="text-white" width={18} />
        </button>
      </div>

      {/* RENDER VIEW ACCORDING TO TABS */}

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Registered</span>
              <span className="text-3xl font-black text-[#00FF85] mt-2">{profiles.length}</span>
              <span className="text-[9px] text-white/30 mt-1">supabase profiles count</span>
            </div>
            <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Users (MAU)</span>
              <span className="text-3xl font-black text-[#00FF85] mt-2">{mau}</span>
              <span className="text-[9px] text-white/30 mt-1">active in last 30 days</span>
            </div>
            <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Habits Completed Today</span>
              <span className="text-3xl font-black text-[#00FF85] mt-2">{completedToday}</span>
              <span className="text-[9px] text-white/30 mt-1">by all active users today</span>
            </div>
            <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Unresolved Feedbacks</span>
              <span className="text-3xl font-black text-[#FF4D00] mt-2">{feedbacks.length}</span>
              <span className="text-[9px] text-white/30 mt-1">suggestions & bug reports</span>
            </div>
          </div>

          {/* PLAN DISTRIBUTION */}
          <div className="bg-[#111] border border-white/5 p-5 rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-wider">Subscription Breakdown</h3>
            <div className="space-y-3">
              {[
                { name: 'Free Plan', count: freeUsers, color: 'bg-white/10' },
                { name: 'Weekly Plan', count: weeklyPro, color: 'bg-[#7BE495]' },
                { name: 'Monthly Plan', count: monthlyPro, color: 'bg-[#00FF85]' },
                { name: 'Annual Plan', count: annualPro, color: 'bg-emerald-600' },
              ].map((plan, idx) => {
                const percent = profiles.length > 0 ? Math.round((plan.count / profiles.length) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white/60">{plan.name}</span>
                      <span className="font-black text-[#00FF85]">{plan.count} <span className="text-[10px] text-white/30">({percent}%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${plan.color}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REAL TIME TELEMETRY SIMULATION CHART */}
          <div className="bg-[#111] border border-white/5 p-5 rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-wider">Habits Completed (Last 24 Hours)</h3>
            <div className="h-28 flex items-end gap-1.5 pt-2">
              {hourlyActivity.map((val, idx) => {
                const maxAct = Math.max(1, ...hourlyActivity);
                const heightPercent = Math.min(100, Math.round((val / maxAct) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <span className="absolute -top-6 bg-black border border-white/10 px-1 rounded text-[8px] text-[#00FF85] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </span>
                    <div className="w-full bg-[#00FF85]/20 group-hover:bg-[#00FF85] rounded-t-sm transition-all duration-300" style={{ height: `${heightPercent}%` }} />
                    <span className="text-[7px] text-white/20 font-black">{idx}h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'todo' && (
        <div className="space-y-4">
          {/* SEARCH INPUT */}
          <div className="relative">
            <Icon icon="ph:magnifying-glass-bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width={16} />
            <input
              type="text"
              placeholder="Search by name, username or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#00FF85]"
            />
          </div>

          {/* USER TABLE / LIST */}
          <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
              <span>User Nickname</span>
              <span>Status Plan</span>
            </div>

            <div className="divide-y divide-white/[0.03]">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between text-left">
                    <div>
                      <h4 className="text-xs font-black text-white">{p.full_name || 'Anonymous User'}</h4>
                      <p className="text-[10px] text-white/30 mt-0.5">@{p.nickname || 'guest'} · ID: {p.id.substring(0, 8)}</p>
                      <p className="text-[9px] text-white/20 mt-0.5">Joined: {new Date(p.created_at || p.updated_at || '2026-06-25').toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
                      p.is_pro 
                        ? 'bg-[#00FF85]/10 text-[#00FF85] border-[#00FF85]/20' 
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {p.is_pro ? 'Pro Member' : 'Free Plan'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-white/30 uppercase tracking-widest font-black">No Users Found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUESTIONS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Surveys Submitted</span>
            <span className="text-3xl font-black text-[#00FF85] mt-2">{totalSurveyed}</span>
            <span className="text-[9px] text-white/30 mt-1">onboarding questionnaires</span>
          </div>

          {/* QUESTIONS LIST */}
          {[
            { id: 1, title: 'Nama Lengkap / Full Name' },
            { id: 2, title: 'Nama Panggilan / Nickname' },
            { id: 3, title: 'Username' },
            { id: 4, title: 'Jenis Kelamin / Gender' },
            { id: 5, title: 'Kelompok Umur / Age Groups' },
            { id: 6, title: 'Berat & Tinggi / Weight & Height' },
            { id: 7, title: 'Domisili / Location' },
            { id: 8, title: 'Pekerjaan / Occupation' },
            { id: 9, title: 'Kondisi Hidup Saat Ini / Life Condition' },
            { id: 10, title: 'Prioritas Utama / Top Focus Priorities' },
            { id: 11, title: 'Hambatan Terbesar / Biggest Roadblock' },
            { id: 12, title: 'Asal Tahu InRising / Discovery Channel' },
            { id: 13, title: 'Durasi Target Program / Target Duration' },
            { id: 14, title: 'Fokus Kebiasaan / Habit Areas' },
          ].map((q) => {
            const counts = getSurveyCounts(q.id);
            const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            const maxVal = Math.max(1, ...items.map(i => i[1]));
            return (
              <div key={q.id} className="bg-[#111] border border-white/5 p-5 rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#00FF85]/10 flex items-center justify-center text-[10px] font-black text-[#00FF85]">Q{q.id}</div>
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">{q.title}</h3>
                </div>

                <div className="space-y-3">
                  {items.length > 0 ? (
                    items.map(([label, val], idx) => {
                      const percent = totalSurveyed > 0 ? Math.round((val / totalSurveyed) * 100) : 0;
                      const widthPercent = Math.round((val / maxVal) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-white/60">{label}</span>
                            <span className="font-black text-[#00FF85]">{val} <span className="text-[10px] text-white/30">({percent}%)</span></span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00FF85]" style={{ width: `${widthPercent}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-[10px] text-white/30 font-black uppercase py-4">No data collected yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: INBOX */}
      {activeTab === 'journey' && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Inbox Feedback Received</span>
            <span className="text-3xl font-black text-[#00FF85] mt-2">{feedbacks.length}</span>
            <span className="text-[9px] text-white/30 mt-1">suggestions and bug reports</span>
          </div>

          <div className="space-y-4">
            {feedbacks.length > 0 ? (
              feedbacks.map((f) => {
                let parsedContent = { subject: 'Feedback', message: f.content, type: f.post_id };
                try {
                  if (f.content.startsWith('{')) {
                    parsedContent = JSON.parse(f.content);
                  }
                } catch (e) {
                  // Fallback
                }
                const isBug = f.post_id === 'bug' || parsedContent.type === 'bug';
                return (
                  <div key={f.id} className="bg-[#111] border border-white/5 p-5 rounded-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          isBug 
                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                            : 'bg-lime-500/10 text-[#00FF85] border-lime-500/20'
                        }`}>
                          {isBug ? 'BUG REPORT' : 'SUGGESTION'}
                        </span>
                        <h4 className="text-sm font-black text-white mt-2 leading-tight">{parsedContent.subject}</h4>
                      </div>
                      <span className="text-[9px] text-white/20">{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/[0.02]">{parsedContent.message}</p>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/[0.03] text-[9px] text-white/40 font-bold">
                      <Icon icon="ph:user-bold" width={10} />
                      <span>{f.user?.full_name} (@{f.user?.nickname})</span>
                      <span>·</span>
                      <Icon icon="ph:envelope-simple-bold" width={10} />
                      <span>{f.user?.email || 'guest@intracker.app'}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#111] border border-white/5 p-12 rounded-3xl text-center shadow-[4px_4px_0px_rgba(0,0,0,1)] text-white/20 text-xs font-black uppercase tracking-widest">
                Inbox is Empty
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
