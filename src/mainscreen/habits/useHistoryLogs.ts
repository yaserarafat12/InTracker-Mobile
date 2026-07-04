import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface HistoryLog {
  habit_id: string;
  status: 'completed' | 'skipped';
  intensity_value?: number;
}

/**
 * Fetches habit logs for a specific date.
 * Returns null if date is today (use live data instead).
 */
export function useHistoryLogs(selectedDate: Date) {
  const [logs, setLogs] = useState<HistoryLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const refetch = () => setTrigger(prev => prev + 1);

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  };

  useEffect(() => {
    if (isToday()) {
      setLogs(null);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const dateStr = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

        if (localStorage.getItem('guest_mode') === 'true') {
          const localLogsStr = localStorage.getItem('guest_habit_logs') || '[]';
          const allLocalLogs = JSON.parse(localLogsStr);
          const filtered = allLocalLogs.filter((l: any) => l.date === dateStr);
          setLogs(filtered);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLogs([]); return; }

        const { data, error } = await supabase
          .from('habit_logs')
          .select('habit_id, status, intensity_value')
          .eq('user_id', user.id)
          .eq('date', dateStr);

        if (error) {
          console.error('[History] Error fetching logs:', error);
          setLogs([]);
        } else {
          setLogs(data || []);
        }
      } catch (err) {
        console.error('[History] Fetch error:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedDate, trigger]);

  return { logs, loading, isHistorical: !isToday(), refetch };
}
