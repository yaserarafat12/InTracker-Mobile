import React, { type ErrorInfo, type ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[InTracker] ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Get language from localStorage if possible (fallback to Indonesian/English)
      let isIndonesian = true;
      try {
        const localSettings = localStorage.getItem('intracker-user-v1');
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          const lang = parsed?.state?.settings?.language;
          if (lang && lang !== 'Bahasa Indonesia') {
            isIndonesian = false;
          }
        }
      } catch (e) {
        console.error(e);
      }

      return (
        <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col items-center justify-center p-6 font-['Inter'] relative overflow-hidden select-none">
          {/* Neon Glow Accents */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

          <div className="w-full max-w-md bg-[#16181c] border-[2.5px] border-black rounded-[28px] p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center text-center">
            {/* Warning Icon Container */}
            <div className="w-16 h-16 rounded-[22px] bg-red-500/10 border-[1.5px] border-red-500/30 flex items-center justify-center mb-6 shadow-xl">
              <Icon icon="solar:danger-bold" className="text-red-500" width={32} height={32} />
            </div>

            {/* Error Message */}
            <h1 className="text-xl font-black text-white font-['Outfit'] tracking-tight leading-tight mb-3">
              {isIndonesian ? 'Aplikasi Terhenti Sejenak' : 'App Encountered an Issue'}
            </h1>
            <p className="text-[13px] text-white/55 font-medium leading-relaxed mb-6 px-4">
              {isIndonesian 
                ? 'Jangan khawatir, data progres harian dan habit kamu tetap tersimpan dengan aman. Silakan muat ulang aplikasi di bawah ini.' 
                : 'Do not worry, your daily progress and habit logs are saved safely. Please reload the application below.'}
            </p>

            {/* Reload Button */}
            <button
              onClick={this.handleReload}
              className="w-full bg-[#00FF85] hover:bg-[#00e676] active:scale-[0.98] text-black py-4 rounded-[16px] font-black font-['Outfit'] uppercase tracking-wider text-[13px] border-[2.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all mb-4"
            >
              {isIndonesian ? 'MUAT ULANG APLIKASI' : 'RELOAD APPLICATION'}
            </button>

            {/* Diagnostic Toggle */}
            <button
              onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
              className="text-[11px] font-bold text-white/30 uppercase tracking-widest hover:text-white/50 transition-colors py-2"
            >
              {this.state.showDetails 
                ? (isIndonesian ? 'SEMBUNYIKAN DIAGNOSIS' : 'HIDE DIAGNOSTIC DETAILS')
                : (isIndonesian ? 'TAMPILKAN DIAGNOSIS' : 'SHOW DIAGNOSTIC DETAILS')}
            </button>

            {/* Diagnostic Details */}
            {this.state.showDetails && (
              <div className="w-full mt-4 text-left bg-black/45 border border-white/5 rounded-2xl p-4 max-h-48 overflow-y-auto font-mono text-[9px] text-red-400/90 leading-normal scrollbar-hide">
                <p className="font-bold mb-1">{this.state.error?.toString()}</p>
                <p className="whitespace-pre-wrap text-white/40">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
