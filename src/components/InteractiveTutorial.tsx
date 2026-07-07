import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useUserStore } from '../store/useUserStore';
import { useHabitStore } from '../store/useHabitStore';
import { useTranslation } from '../i18n';

// Mascot expressions
type MascotExpression = 'welcome' | 'guide' | 'thinking' | 'success';

interface Step {
  selector: string | null; // target DOM query selector
  clickTarget?: string; // target element to listen for clicks to advance
  title: string;
  desc: string;
  expression: MascotExpression;
  actionText?: string; // If provided, user must click "Lanjut" button in instruction box
  expectedTab?: string; // If tab matches, we can auto-advance
  tab?: string; // Tab that this step should be viewed on
  hideGlow?: boolean;
  hideArrow?: boolean;
}

interface InteractiveTutorialProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSettingsOpen: boolean;
  toggleSettings: () => void;
  onStepChange?: (step: number) => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  activeTab,
  setActiveTab,
  isSettingsOpen,
  toggleSettings,
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [maxStep, setMaxStep] = useState<number>(0);

  // Sync maxStep with currentStep when moving forward
  useEffect(() => {
    if (currentStep > maxStep) {
      setMaxStep(currentStep);
    }
  }, [currentStep, maxStep]);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const updateTimerRef = useRef<number | null>(null);

  const { settings } = useUserStore();
  const programDuration = settings?.programDuration || 90;
  const isLight = settings?.theme === 'Light';
  const { language } = useTranslation();

  // Check completed status on mount
  useEffect(() => {
    const isCompleted = localStorage.getItem('interactive_tutorial_completed') === 'true';
    if (isCompleted) {
      setCompleted(true);
    } else {
      localStorage.setItem('interactive_tutorial_active', 'true');
    }
  }, []);

  // ─── Localized label helper ───────────────────────────────────────────────
  // Returns the correct translation per language, falls back to English.
  const L = useMemo(() => {
    type LangMap = Record<string, string>;
    const pick = (map: LangMap): string => map[language] ?? map['English'];
    return {
      // ── Step 0 ──────────────────────────────────────────────────────────────
      s0_title: pick({ 'English': 'Hello, I\'m Rise!', 'Bahasa Indonesia': 'Halo, Aku Rise!', 'Español': '¡Hola, soy Rise!', 'Chinese': '你好，我是Rise！', 'Hindi': 'हैलो, मैं Rise हूँ!', 'Arabic': 'مرحباً، أنا Rise!', 'Portuguese': 'Olá, eu sou Rise!', 'Français': 'Salut, je suis Rise !', 'Japanese': 'こんにちは、Riseです！', 'Deutsch': 'Hallo, ich bin Rise!' }),
      s0_desc: pick({ 'English': `Welcome to InRising!\nFollow this quick tour to master the features of your ${programDuration}-day program.`, 'Bahasa Indonesia': `Selamat datang di InRising!\nIkuti petualangan singkat untuk menguasai fitur program ${programDuration} hari pilihanmu.`, 'Español': `¡Bienvenido a InRising!\nSigue este breve recorrido para dominar las funciones de tu programa de ${programDuration} días.`, 'Chinese': `欢迎来到InRising！\n跟随这个简短的导览，掌握你${programDuration}天计划的所有功能。`, 'Hindi': `InRising में आपका स्वागत है!\nअपने ${programDuration}-दिन के प्रोग्राम की विशेषताओं को समझने के लिए इस त्वरित दौरे का अनुसरण करें।`, 'Arabic': `مرحباً بك في InRising!\nاتبع هذه الجولة السريعة لإتقان ميزات برنامجك لمدة ${programDuration} يومًا.`, 'Portuguese': `Bem-vindo ao InRising!\nSiga este tour rápido para dominar os recursos do seu programa de ${programDuration} dias.`, 'Français': `Bienvenue sur InRising !\nSuivez ce bref tour pour maîtriser les fonctionnalités de votre programme de ${programDuration} jours.`, 'Japanese': `InRisingへようこそ！\nこの簡単なツアーで${programDuration}日間プログラムの機能をマスターしましょう。`, 'Deutsch': `Willkommen bei InRising!\nFolge dieser kurzen Tour, um die Funktionen deines ${programDuration}-Tage-Programms zu meistern.` }),
      s0_action: pick({ 'English': 'Start Tour', 'Bahasa Indonesia': 'Mulai Petualangan', 'Español': 'Comenzar', 'Chinese': '开始', 'Hindi': 'शुरू करें', 'Arabic': 'ابدأ', 'Portuguese': 'Começar', 'Français': 'Commencer', 'Japanese': '始める', 'Deutsch': 'Starten' }),
      // ── Step 1 ──────────────────────────────────────────────────────────────
      s1_title: pick({ 'English': 'Habit Card Interaction', 'Bahasa Indonesia': 'Interaksi Kartu Habit', 'Español': 'Interacción de tarjeta de hábito', 'Chinese': '习惯卡片互动', 'Hindi': 'हैबिट कार्ड इंटरैक्शन', 'Arabic': 'تفاعل بطاقة العادة', 'Portuguese': 'Interação do cartão de hábito', 'Français': 'Interaction de la carte d\'habitude', 'Japanese': '習慣カードのインタラクション', 'Deutsch': 'Habit-Karten-Interaktion' }),
      s1_desc: pick({ 'English': 'Double-tap a habit card to mark it as completed for today.', 'Bahasa Indonesia': 'Ketuk dua kali kartu habit untuk menandai selesai hari ini.', 'Español': 'Toca dos veces la tarjeta de hábito para marcarla como completada hoy.', 'Chinese': '双击习惯卡片，将其标记为今天已完成。', 'Hindi': 'आज के लिए पूरा करने के रूप में चिह्नित करने के लिए हैबिट कार्ड को दो बार टैप करें।', 'Arabic': 'انقر مرتين على بطاقة العادة لتحديدها كمكتملة اليوم.', 'Portuguese': 'Toque duas vezes no cartão de hábito para marcá-lo como concluído hoje.', 'Français': 'Appuyez deux fois sur la carte d\'habitude pour la marquer comme terminée aujourd\'hui.', 'Japanese': '習慣カードをダブルタップして今日完了済みにしましょう。', 'Deutsch': 'Tippe zweimal auf eine Habit-Karte, um sie als heute erledigt zu markieren.' }),
      // ── Step 2 ──────────────────────────────────────────────────────────────
      s2_title: pick({ 'English': 'Create Your First Habit', 'Bahasa Indonesia': 'Buat Habit Pertama', 'Español': 'Crea tu primer hábito', 'Chinese': '创建你的第一个习惯', 'Hindi': 'अपनी पहली आदत बनाएं', 'Arabic': 'أنشئ عادتك الأولى', 'Portuguese': 'Crie seu primeiro hábito', 'Français': 'Créez votre première habitude', 'Japanese': '最初の習慣を作る', 'Deutsch': 'Erstelle deine erste Gewohnheit' }),
      s2_desc: pick({ 'English': 'Tap the green plus button to create your first custom habit.', 'Bahasa Indonesia': 'Ketuk tombol tambah hijau untuk membuat habit baru pertamamu.', 'Español': 'Toca el botón verde + para crear tu primer hábito personalizado.', 'Chinese': '点击绿色加号按钮创建你的第一个自定义习惯。', 'Hindi': 'अपनी पहली कस्टम आदत बनाने के लिए हरे प्लस बटन पर टैप करें।', 'Arabic': 'انقر على زر + الأخضر لإنشاء أول عادة مخصصة لك.', 'Portuguese': 'Toque no botão verde + para criar seu primeiro hábito personalizado.', 'Français': 'Appuyez sur le bouton vert + pour créer votre première habitude personnalisée.', 'Japanese': '緑のプラスボタンをタップして最初のカスタム習慣を作成しましょう。', 'Deutsch': 'Tippe auf den grünen + Knopf, um deine erste Gewohnheit zu erstellen.' }),
      // ── Step 3 ──────────────────────────────────────────────────────────────
      s3_title: pick({ 'English': 'Select "Daily Hydration"', 'Bahasa Indonesia': 'Pilih "Hidrasi Harian"', 'Español': 'Selecciona "Hidratación Diaria"', 'Chinese': '选择"每日补水"', 'Hindi': '"दैनिक जलयोजन" चुनें', 'Arabic': 'اختر "الترطيب اليومي"', 'Portuguese': 'Selecione "Hidratação Diária"', 'Français': 'Sélectionnez "Hydratation Quotidienne"', 'Japanese': '「毎日の水分補給」を選択', 'Deutsch': '"Tägliche Hydration" auswählen' }),
      s3_desc: pick({ 'English': 'Choose the "Daily Hydration" habit as the starting point of your routine.', 'Bahasa Indonesia': 'Pilih habit "Hidrasi Harian" sebagai langkah awal kebiasaanmu.', 'Español': 'Elige el hábito "Hidratación Diaria" como punto de partida de tu rutina.', 'Chinese': '选择"每日补水"习惯作为你的例行公事的起点。', 'Hindi': '"दैनिक जलयोजन" आदत को अपनी दिनचर्या के शुरुआती बिंदु के रूप में चुनें।', 'Arabic': 'اختر عادة "الترطيب اليومي" كنقطة بداية لروتينك.', 'Portuguese': 'Escolha o hábito "Hidratação Diária" como ponto de partida de sua rotina.', 'Français': 'Choisissez l\'habitude "Hydratation Quotidienne" comme point de départ de votre routine.', 'Japanese': 'ルーティンの出発点として「毎日の水分補給」習慣を選択しましょう。', 'Deutsch': 'Wähle die Gewohnheit "Tägliche Hydration" als Ausgangspunkt deiner Routine.' }),
      // ── Step 4 ──────────────────────────────────────────────────────────────
      s4_title: pick({ 'English': 'Set Glass Target', 'Bahasa Indonesia': 'Atur Target Gelas', 'Español': 'Establecer objetivo de vasos', 'Chinese': '设置喝水目标', 'Hindi': 'गिलास लक्ष्य निर्धारित करें', 'Arabic': 'تحديد هدف الأكواب', 'Portuguese': 'Definir meta de copos', 'Français': 'Définir l\'objectif de verres', 'Japanese': 'グラスの目標を設定', 'Deutsch': 'Gläserziel festlegen' }),
      s4_desc: pick({ 'English': 'Tap the water intensity button to adjust your daily glass target.', 'Bahasa Indonesia': 'Ketuk tombol intensitas air untuk menyesuaikan target gelas.', 'Español': 'Toca el botón de intensidad para ajustar tu objetivo diario de vasos.', 'Chinese': '点击强度按钮调整你的每日喝水目标。', 'Hindi': 'अपने दैनिक ग्लास लक्ष्य को समायोजित करने के लिए पानी की तीव्रता बटन पर टैप करें।', 'Arabic': 'انقر على زر الشدة لضبط هدفك اليومي من الأكواب.', 'Portuguese': 'Toque no botão de intensidade para ajustar sua meta diária de copos.', 'Français': 'Appuyez sur le bouton d\'intensité pour ajuster votre objectif quotidien de verres.', 'Japanese': '強度ボタンをタップして毎日のグラスの目標を調整しましょう。', 'Deutsch': 'Tippe auf den Intensitätsknopf, um dein tägliches Gläserziel anzupassen.' }),
      // ── Step 5 ──────────────────────────────────────────────────────────────
      s5_title: pick({ 'English': 'Select Quantity', 'Bahasa Indonesia': 'Tentukan Jumlah', 'Español': 'Seleccionar cantidad', 'Chinese': '选择数量', 'Hindi': 'मात्रा चुनें', 'Arabic': 'حدد الكمية', 'Portuguese': 'Selecionar quantidade', 'Français': 'Sélectionner la quantité', 'Japanese': '数量を選択', 'Deutsch': 'Menge auswählen' }),
      s5_desc: pick({ 'English': 'Choose your daily water target and tap Done.', 'Bahasa Indonesia': 'Pilih jumlah gelas air harian lalu klik tombol Done.', 'Español': 'Elige tu objetivo diario de agua y toca Listo.', 'Chinese': '选择你的每日饮水目标，然后点击完成。', 'Hindi': 'अपना दैनिक जल लक्ष्य चुनें और Done बटन पर टैप करें।', 'Arabic': 'اختر هدفك اليومي من الماء واضغط على تم.', 'Portuguese': 'Escolha sua meta diária de água e toque em Concluído.', 'Français': 'Choisissez votre objectif quotidien d\'eau et appuyez sur Terminé.', 'Japanese': '毎日の水の目標を選択してDoneをタップしましょう。', 'Deutsch': 'Wähle dein tägliches Wasserziel und tippe auf Fertig.' }),
      // ── Step 6 ──────────────────────────────────────────────────────────────
      s6_title: pick({ 'English': 'Save Habit', 'Bahasa Indonesia': 'Simpan Habit', 'Español': 'Guardar hábito', 'Chinese': '保存习惯', 'Hindi': 'आदत सहेजें', 'Arabic': 'احفظ العادة', 'Portuguese': 'Salvar hábito', 'Français': 'Sauvegarder l\'habitude', 'Japanese': '習慣を保存', 'Deutsch': 'Gewohnheit speichern' }),
      s6_desc: pick({ 'English': 'Choose your schedule type and tap the ADD button.', 'Bahasa Indonesia': 'Tentukan tipe jadwal harianmu lalu ketuk tombol ADD.', 'Español': 'Elige el tipo de horario y toca el botón AGREGAR.', 'Chinese': '选择你的日程类型，然后点击ADD按钮。', 'Hindi': 'अपना अनुसूची प्रकार चुनें और ADD बटन पर टैप करें।', 'Arabic': 'اختر نوع الجدول الزمني واضغط على زر إضافة.', 'Portuguese': 'Escolha o tipo de agenda e toque no botão ADICIONAR.', 'Français': 'Choisissez le type de planning et appuyez sur le bouton AJOUTER.', 'Japanese': 'スケジュールタイプを選択してADDボタンをタップしましょう。', 'Deutsch': 'Wähle deinen Zeitplantyp und tippe auf den HINZUFÜGEN-Knopf.' }),
      // ── Step 7 ──────────────────────────────────────────────────────────────
      s7_title: pick({ 'English': 'Go to To-Do List', 'Bahasa Indonesia': 'Lanjut ke To-Do List', 'Español': 'Ir a la lista de tareas', 'Chinese': '前往待办事项', 'Hindi': 'टू-डू सूची पर जाएं', 'Arabic': 'انتقل إلى قائمة المهام', 'Portuguese': 'Ir para a lista de tarefas', 'Français': 'Aller à la liste de tâches', 'Japanese': 'ToDoリストへ', 'Deutsch': 'Zur To-Do-Liste' }),
      s7_desc: pick({ 'English': 'Tap the To-Do List tab in the bottom navigation bar.', 'Bahasa Indonesia': 'Ketuk tab menu To-Do List di navigasi bawah.', 'Español': 'Toca la pestaña de lista de tareas en la barra de navegación inferior.', 'Chinese': '点击底部导航栏中的待办事项选项卡。', 'Hindi': 'नीचे नेविगेशन बार में To-Do List टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب قائمة المهام في شريط التنقل السفلي.', 'Portuguese': 'Toque na aba de lista de tarefas na barra de navegação inferior.', 'Français': 'Appuyez sur l\'onglet de liste de tâches dans la barre de navigation inférieure.', 'Japanese': '下部ナビゲーションバーのToDoリストタブをタップしましょう。', 'Deutsch': 'Tippe auf den To-Do-Liste-Tab in der unteren Navigationsleiste.' }),
      // ── Step 8 ──────────────────────────────────────────────────────────────
      s8_title: pick({ 'English': 'Manage Daily Tasks', 'Bahasa Indonesia': 'Kelola Tugas Harian', 'Español': 'Gestionar tareas diarias', 'Chinese': '管理日常任务', 'Hindi': 'दैनिक कार्य प्रबंधित करें', 'Arabic': 'إدارة المهام اليومية', 'Portuguese': 'Gerenciar tarefas diárias', 'Français': 'Gérer les tâches quotidiennes', 'Japanese': '毎日のタスクを管理', 'Deutsch': 'Tägliche Aufgaben verwalten' }),
      s8_desc: pick({ 'English': 'Type your first task here and tap the checkmark icon.', 'Bahasa Indonesia': 'Tulis tugas pertamamu di sini lalu ketuk icon centang.', 'Español': 'Escribe tu primera tarea aquí y toca el ícono de marca de verificación.', 'Chinese': '在这里输入你的第一个任务，然后点击复选标记图标。', 'Hindi': 'यहां अपना पहला कार्य टाइप करें और चेकमार्क आइकन पर टैप करें।', 'Arabic': 'اكتب مهمتك الأولى هنا ثم انقر على أيقونة علامة الاختيار.', 'Portuguese': 'Digite sua primeira tarefa aqui e toque no ícone de marcação.', 'Français': 'Tapez votre première tâche ici et appuyez sur l\'icône de coche.', 'Japanese': 'ここに最初のタスクを入力してチェックマークアイコンをタップしましょう。', 'Deutsch': 'Tippe hier deine erste Aufgabe ein und tippe auf das Häkchen-Symbol.' }),
      // ── Step 9 ──────────────────────────────────────────────────────────────
      s9_title: pick({ 'English': 'Complete Tasks', 'Bahasa Indonesia': 'Selesaikan Tugas', 'Español': 'Completar tareas', 'Chinese': '完成任务', 'Hindi': 'कार्य पूर्ण करें', 'Arabic': 'إكمال المهام', 'Portuguese': 'Concluir tarefas', 'Français': 'Terminer les tâches', 'Japanese': 'タスクを完了する', 'Deutsch': 'Aufgaben abschließen' }),
      s9_desc: pick({ 'English': 'Check the task checkbox after you complete it.', 'Bahasa Indonesia': 'Centang kotak tugas setelah kamu menyelesaikannya.', 'Español': 'Marca la casilla de verificación de la tarea después de completarla.', 'Chinese': '完成任务后勾选任务复选框。', 'Hindi': 'कार्य पूरा करने के बाद कार्य चेकबॉक्स को चेक करें।', 'Arabic': 'ضع علامة في مربع الاختيار للمهمة بعد إكمالها.', 'Portuguese': 'Marque a caixa de seleção da tarefa depois de concluí-la.', 'Français': 'Cochez la case de la tâche après l\'avoir terminée.', 'Japanese': 'タスクを完了したらチェックボックスにチェックを入れましょう。', 'Deutsch': 'Markiere das Kontrollkästchen der Aufgabe, nachdem du sie abgeschlossen hast.' }),
      // ── Step 10 ─────────────────────────────────────────────────────────────
      s10_title: pick({ 'English': 'Completed Tasks History', 'Bahasa Indonesia': 'Riwayat Tugas Selesai', 'Español': 'Historial de tareas completadas', 'Chinese': '已完成任务历史', 'Hindi': 'पूर्ण कार्य इतिहास', 'Arabic': 'سجل المهام المكتملة', 'Portuguese': 'Histórico de tarefas concluídas', 'Français': 'Historique des tâches terminées', 'Japanese': '完了タスクの履歴', 'Deutsch': 'Verlauf abgeschlossener Aufgaben' }),
      s10_desc: pick({ 'English': 'Swipe right or tap the Done tab to view completed tasks.', 'Bahasa Indonesia': 'Geser ke kanan atau ketuk tab Done untuk melihat tugas selesai.', 'Español': 'Desliza hacia la derecha o toca la pestaña Hecho para ver tareas completadas.', 'Chinese': '向右滑动或点击完成选项卡查看已完成的任务。', 'Hindi': 'पूर्ण कार्यों को देखने के लिए दाईं ओर स्वाइप करें या Done टैब पर टैप करें।', 'Arabic': 'اسحب لليمين أو انقر على علامة تبويب تم لعرض المهام المكتملة.', 'Portuguese': 'Deslize para a direita ou toque na aba Concluído para ver as tarefas concluídas.', 'Français': 'Glissez vers la droite ou appuyez sur l\'onglet Terminé pour voir les tâches terminées.', 'Japanese': '右にスワイプするかDoneタブをタップして完了したタスクを表示しましょう。', 'Deutsch': 'Wische nach rechts oder tippe auf den Fertig-Tab, um abgeschlossene Aufgaben zu sehen.' }),
      // ── Step 11 ─────────────────────────────────────────────────────────────
      s11_title: pick({ 'English': 'Open Analytics', 'Bahasa Indonesia': 'Buka Analitik', 'Español': 'Abrir analíticas', 'Chinese': '打开分析', 'Hindi': 'एनालिटिक्स खोलें', 'Arabic': 'فتح التحليلات', 'Portuguese': 'Abrir análises', 'Français': 'Ouvrir les analyses', 'Japanese': '分析を開く', 'Deutsch': 'Analytik öffnen' }),
      s11_desc: pick({ 'English': 'Tap the Analytics tab in the bottom navigation bar.', 'Bahasa Indonesia': 'Ketuk tab menu Analitik di navigasi bawah.', 'Español': 'Toca la pestaña de analíticas en la barra de navegación inferior.', 'Chinese': '点击底部导航栏中的分析选项卡。', 'Hindi': 'नीचे नेविगेशन बार में Analytics टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب التحليلات في شريط التنقل السفلي.', 'Portuguese': 'Toque na aba de análises na barra de navegação inferior.', 'Français': 'Appuyez sur l\'onglet Analyses dans la barre de navigation inférieure.', 'Japanese': '下部ナビゲーションバーの分析タブをタップしましょう。', 'Deutsch': 'Tippe auf den Analytics-Tab in der unteren Navigationsleiste.' }),
      // ── Step 12 ─────────────────────────────────────────────────────────────
      s12_title: pick({ 'English': 'Charts & History', 'Bahasa Indonesia': 'Grafik & Histori', 'Español': 'Gráficos e historial', 'Chinese': '图表与历史', 'Hindi': 'चार्ट और इतिहास', 'Arabic': 'الرسوم البيانية والسجل', 'Portuguese': 'Gráficos e histórico', 'Français': 'Graphiques et historique', 'Japanese': 'チャートと履歴', 'Deutsch': 'Diagramme & Verlauf' }),
      s12_desc: pick({ 'English': 'Tap the "Daily Hydration" card to view your progress charts.', 'Bahasa Indonesia': 'Ketuk kartu "Hidrasi Harian" untuk melihat grafik progres.', 'Español': 'Toca la tarjeta "Hidratación Diaria" para ver los gráficos de progreso.', 'Chinese': '点击"每日补水"卡片查看进度图表。', 'Hindi': 'प्रगति चार्ट देखने के लिए "दैनिक जलयोजन" कार्ड पर टैप करें।', 'Arabic': 'انقر على بطاقة "الترطيب اليومي" لعرض مخططات التقدم.', 'Portuguese': 'Toque no cartão "Hidratação Diária" para ver os gráficos de progresso.', 'Français': 'Appuyez sur la carte "Hydratation Quotidienne" pour voir les graphiques de progression.', 'Japanese': '「毎日の水分補給」カードをタップして進捗チャートを表示しましょう。', 'Deutsch': 'Tippe auf die Karte "Tägliche Hydration", um deine Fortschrittsgrafiken zu sehen.' }),
      // ── Step 13 ─────────────────────────────────────────────────────────────
      s13_title: pick({ 'English': 'Weekly Progress Chart', 'Bahasa Indonesia': 'Grafik Progres Mingguan', 'Español': 'Gráfico de progreso semanal', 'Chinese': '每周进度图', 'Hindi': 'साप्ताहिक प्रगति चार्ट', 'Arabic': 'مخطط التقدم الأسبوعي', 'Portuguese': 'Gráfico de progresso semanal', 'Français': 'Graphique de progression hebdomadaire', 'Japanese': '週次進捗チャート', 'Deutsch': 'Wöchentliches Fortschrittsdiagramm' }),
      s13_desc: pick({ 'English': 'This is your weekly progress chart. Green bars indicate days you successfully completed the habit.', 'Bahasa Indonesia': 'Ini adalah grafik progres mingguanmu. Bar hijau menunjukkan hari di mana kamu berhasil menyelesaikan habit.', 'Español': 'Este es tu gráfico de progreso semanal. Las barras verdes indican los días en que completaste con éxito el hábito.', 'Chinese': '这是你的每周进度图。绿色柱子表示你成功完成习惯的天数。', 'Hindi': 'यह आपका साप्ताहिक प्रगति चार्ट है। हरी पट्टियाँ उन दिनों को इंगित करती हैं जब आपने सफलतापूर्वक आदत पूरी की।', 'Arabic': 'هذا هو مخطط تقدمك الأسبوعي. تشير الأشرطة الخضراء إلى الأيام التي أكملت فيها العادة بنجاح.', 'Portuguese': 'Este é seu gráfico de progresso semanal. As barras verdes indicam os dias em que você concluiu o hábito com sucesso.', 'Français': 'Voici votre graphique de progression hebdomadaire. Les barres vertes indiquent les jours où vous avez complété l\'habitude.', 'Japanese': 'これはあなたの週次進捗チャートです。緑のバーは習慣を成功裏に完了した日を示しています。', 'Deutsch': 'Dies ist dein wöchentliches Fortschrittsdiagramm. Grüne Balken zeigen Tage, an denen du die Gewohnheit erfolgreich abgeschlossen hast.' }),
      // ── Step 14 ─────────────────────────────────────────────────────────────
      s14_title: pick({ 'English': '90-Day Progress Tracker', 'Bahasa Indonesia': 'Rekam Jejak 90 Hari', 'Español': 'Seguimiento de 90 días', 'Chinese': '90天进度追踪', 'Hindi': '90-दिन की प्रगति ट्रैकर', 'Arabic': 'متتبع التقدم لـ 90 يومًا', 'Portuguese': 'Rastreador de 90 dias', 'Français': 'Suivi de 90 jours', 'Japanese': '90日間の進捗トラッカー', 'Deutsch': '90-Tage-Fortschrittstracker' }),
      s14_desc: pick({ 'English': 'This is your 90-day habit calendar. Green boxes show the days you stayed disciplined!', 'Bahasa Indonesia': 'Ini adalah kalender program habit 90 hari. Kotak yang berwarna hijau menandakan hari di mana kamu disiplin mencapainya!', 'Español': 'Este es tu calendario de hábitos de 90 días. ¡Las casillas verdes muestran los días que mantuviste la disciplina!', 'Chinese': '这是你的90天习惯日历。绿色方框显示你坚持纪律的日子！', 'Hindi': 'यह आपका 90-दिन का आदत कैलेंडर है। हरे बॉक्स उन दिनों को दिखाते हैं जब आपने अनुशासन बनाए रखा!', 'Arabic': 'هذا هو تقويم عاداتك لمدة 90 يومًا. تظهر المربعات الخضراء الأيام التي حافظت فيها على الانضباط!', 'Portuguese': 'Este é seu calendário de hábitos de 90 dias. As caixas verdes mostram os dias em que você manteve a disciplina!', 'Français': 'Voici votre calendrier d\'habitudes de 90 jours. Les cases vertes montrent les jours où vous avez maintenu votre discipline !', 'Japanese': 'これはあなたの90日間の習慣カレンダーです。緑のボックスは規律を守った日を示しています！', 'Deutsch': 'Dies ist dein 90-Tage-Gewohnheitskalender. Grüne Boxen zeigen die Tage, an denen du diszipliniert warst!' }),
      // ── Step 15 ─────────────────────────────────────────────────────────────
      s15_title: pick({ 'English': 'RPG Stats Attributes', 'Bahasa Indonesia': 'Atribut Stats RPG', 'Español': 'Atributos de estadísticas RPG', 'Chinese': 'RPG属性统计', 'Hindi': 'RPG स्टैट्स गुण', 'Arabic': 'سمات إحصائيات RPG', 'Portuguese': 'Atributos de estatísticas RPG', 'Français': 'Attributs des statistiques RPG', 'Japanese': 'RPGステータス属性', 'Deutsch': 'RPG-Statistik-Attribute' }),
      s15_desc: pick({ 'English': 'Your stats grow when you complete habits. Tap the Stats icon to open.', 'Bahasa Indonesia': 'Stats meningkat saat menyelesaikan habit. Ketuk ikon Stats untuk membuka.', 'Español': 'Tus estadísticas crecen cuando completas hábitos. Toca el ícono de Estadísticas para abrir.', 'Chinese': '完成习惯时你的属性会增长。点击统计图标打开。', 'Hindi': 'जब आप आदतें पूरी करते हैं तो आपके आँकड़े बढ़ते हैं। खोलने के लिए Stats आइकन पर टैप करें।', 'Arabic': 'تنمو إحصائياتك عند إكمال العادات. انقر على أيقونة الإحصائيات لفتحها.', 'Portuguese': 'Suas estatísticas crescem quando você conclui hábitos. Toque no ícone de Estatísticas para abrir.', 'Français': 'Vos statistiques grandissent quand vous complétez des habitudes. Appuyez sur l\'icône Statistiques pour ouvrir.', 'Japanese': '習慣を完了するとステータスが成長します。Statsアイコンをタップして開きましょう。', 'Deutsch': 'Deine Statistiken wachsen, wenn du Gewohnheiten abschließt. Tippe auf das Stats-Symbol, um es zu öffnen.' }),
      // ── Step 16 ─────────────────────────────────────────────────────────────
      s16_title: pick({ 'English': 'RPG System & Attributes', 'Bahasa Indonesia': 'Sistem RPG & Atribut', 'Español': 'Sistema RPG y atributos', 'Chinese': 'RPG系统与属性', 'Hindi': 'RPG सिस्टम और गुण', 'Arabic': 'نظام RPG والسمات', 'Portuguese': 'Sistema RPG e atributos', 'Français': 'Système RPG et attributs', 'Japanese': 'RPGシステムと属性', 'Deutsch': 'RPG-System & Attribute' }),
      s16_desc: pick({ 'English': 'Your character\'s Level and XP rise as you complete daily habits. You also earn stat points like Focus, Discipline, and Strength!', 'Bahasa Indonesia': 'Level dan XP karaktermu akan naik seiring penyelesaian habit harian. Kamu juga mendapatkan poin stats seperti Fokus, Disiplin, dan Kekuatan!', 'Español': 'El nivel y XP de tu personaje aumentan al completar hábitos diarios. ¡También ganas puntos de estadísticas como Enfoque, Disciplina y Fuerza!', 'Chinese': '完成每日习惯时，你的角色等级和XP会上升。你还会获得专注、纪律和力量等属性点！', 'Hindi': 'दैनिक आदतें पूरी करने पर आपके चरित्र का Level और XP बढ़ता है। आप Focus, Discipline, और Strength जैसे स्टैट पॉइंट भी अर्जित करते हैं!', 'Arabic': 'يرتفع مستوى شخصيتك وXP مع إكمال العادات اليومية. كما تكسب نقاط إحصائيات مثل التركيز والانضباط والقوة!', 'Portuguese': 'O nível e XP do seu personagem aumentam ao concluir hábitos diários. Você também ganha pontos de estatística como Foco, Disciplina e Força!', 'Français': 'Le niveau et les XP de votre personnage augmentent en complétant des habitudes quotidiennes. Vous gagnez aussi des points de statistiques comme Focus, Discipline et Force !', 'Japanese': '毎日の習慣を完了すると、キャラクターのレベルとXPが上がります。フォーカス、規律、強さなどのスタットポイントも獲得できます！', 'Deutsch': 'Das Level und XP deines Charakters steigen, wenn du tägliche Gewohnheiten abschließt. Du verdienst auch Statuspunkte wie Fokus, Disziplin und Stärke!' }),
      // ── Step 17 ─────────────────────────────────────────────────────────────
      s17_title: pick({ 'English': 'Weekly Report', 'Bahasa Indonesia': 'Laporan Mingguan', 'Español': 'Informe semanal', 'Chinese': '每周报告', 'Hindi': 'साप्ताहिक रिपोर्ट', 'Arabic': 'التقرير الأسبوعي', 'Portuguese': 'Relatório semanal', 'Français': 'Rapport hebdomadaire', 'Japanese': '週次レポート', 'Deutsch': 'Wochenbericht' }),
      s17_desc: pick({ 'English': 'Tap the Recap tab to open your daily activity summary.', 'Bahasa Indonesia': 'Ketuk tab Recap untuk membuka rangkuman aktivitas harian.', 'Español': 'Toca la pestaña Resumen para abrir tu resumen de actividades diarias.', 'Chinese': '点击回顾选项卡打开你的每日活动摘要。', 'Hindi': 'अपना दैनिक गतिविधि सारांश खोलने के लिए Recap टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب الملخص لفتح ملخص نشاطك اليومي.', 'Portuguese': 'Toque na aba Resumo para abrir seu resumo de atividades diárias.', 'Français': 'Appuyez sur l\'onglet Récapitulatif pour ouvrir votre résumé d\'activités quotidiennes.', 'Japanese': 'Recapタブをタップして毎日のアクティビティの概要を開きましょう。', 'Deutsch': 'Tippe auf den Recap-Tab, um deine tägliche Aktivitätszusammenfassung zu öffnen.' }),
      // ── Step 18 ─────────────────────────────────────────────────────────────
      s18_title: pick({ 'English': 'Activity Recap', 'Bahasa Indonesia': 'Rangkuman Aktivitas', 'Español': 'Resumen de actividades', 'Chinese': '活动回顾', 'Hindi': 'गतिविधि सारांश', 'Arabic': 'ملخص النشاط', 'Portuguese': 'Resumo de atividades', 'Français': 'Récapitulatif des activités', 'Japanese': 'アクティビティの概要', 'Deutsch': 'Aktivitätszusammenfassung' }),
      s18_desc: pick({ 'English': 'Here you can view your daily activity calendar with full stats for habits, to-do list, and journal.', 'Bahasa Indonesia': 'Di sini kamu bisa melihat kalender aktivitas harian beserta statistik performa habit harian, to-do list, dan jurnalmu secara lengkap.', 'Español': 'Aquí puedes ver tu calendario de actividades diarias con estadísticas completas de hábitos, lista de tareas y diario.', 'Chinese': '在这里你可以查看你的每日活动日历以及习惯、待办事项和日记的完整统计数据。', 'Hindi': 'यहां आप आदतों, टू-डू सूची और जर्नल के पूर्ण आँकड़ों के साथ अपना दैनिक गतिविधि कैलेंडर देख सकते हैं।', 'Arabic': 'هنا يمكنك عرض تقويم نشاطك اليومي مع إحصائيات كاملة للعادات وقائمة المهام والمجلة.', 'Portuguese': 'Aqui você pode ver seu calendário de atividades diárias com estatísticas completas de hábitos, lista de tarefas e diário.', 'Français': 'Ici, vous pouvez voir votre calendrier d\'activités quotidiennes avec des statistiques complètes sur les habitudes, la liste de tâches et le journal.', 'Japanese': 'ここでは習慣、ToDoリスト、ジャーナルの完全な統計と共に毎日のアクティビティカレンダーを確認できます。', 'Deutsch': 'Hier kannst du deinen täglichen Aktivitätskalender mit vollständigen Statistiken für Gewohnheiten, To-Do-Liste und Tagebuch sehen.' }),
      // ── Step 19 ─────────────────────────────────────────────────────────────
      s19_title: pick({ 'English': 'Start Daily Journal', 'Bahasa Indonesia': 'Mulai Jurnal Harian', 'Español': 'Iniciar diario diario', 'Chinese': '开始每日日记', 'Hindi': 'दैनिक जर्नल शुरू करें', 'Arabic': 'ابدأ يومياتك اليومية', 'Portuguese': 'Iniciar diário diário', 'Français': 'Commencer le journal quotidien', 'Japanese': '毎日のジャーナルを始める', 'Deutsch': 'Tägliches Tagebuch beginnen' }),
      s19_desc: pick({ 'English': 'Tap the Journey tab in the bottom navigation bar.', 'Bahasa Indonesia': 'Ketuk tab Journey di navigasi bawah.', 'Español': 'Toca la pestaña Journey en la barra de navegación inferior.', 'Chinese': '点击底部导航栏中的旅程选项卡。', 'Hindi': 'नीचे नेविगेशन बार में Journey टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب الرحلة في شريط التنقل السفلي.', 'Portuguese': 'Toque na aba Journey na barra de navegação inferior.', 'Français': 'Appuyez sur l\'onglet Journey dans la barre de navigation inférieure.', 'Japanese': '下部ナビゲーションバーのJourneyタブをタップしましょう。', 'Deutsch': 'Tippe auf den Journey-Tab in der unteren Navigationsleiste.' }),
      // ── Step 20 ─────────────────────────────────────────────────────────────
      s20_title: pick({ 'English': 'Journey — Record Your Path', 'Bahasa Indonesia': 'Journey — Rekam Perjalananmu', 'Español': 'Journey — Registra tu camino', 'Chinese': '旅程——记录你的历程', 'Hindi': 'Journey — अपना रास्ता रिकॉर्ड करें', 'Arabic': 'Journey — سجل مسيرتك', 'Portuguese': 'Journey — Registre seu caminho', 'Français': 'Journey — Enregistrez votre parcours', 'Japanese': 'Journey — あなたの歩みを記録', 'Deutsch': 'Journey — Deinen Weg aufzeichnen' }),
      s20_desc: pick({ 'English': 'Journey is where you log each day of your program. Record your feelings, save moments, and write personal notes.', 'Bahasa Indonesia': 'Journey adalah tempat kamu mencatat setiap hari dalam programmu. Di sini kamu bisa merekam perasaan, menyimpan momen, dan menulis catatan harian.', 'Español': 'Journey es donde registras cada día de tu programa. Registra tus sentimientos, guarda momentos y escribe notas personales.', 'Chinese': '旅程是你记录程序每一天的地方。记录你的感受，保存时刻，并写下个人笔记。', 'Hindi': 'Journey वह जगह है जहाँ आप अपने प्रोग्राम के हर दिन को लॉग करते हैं। अपनी भावनाओं को रिकॉर्ड करें, पलों को सहेजें और व्यक्तिगत नोट्स लिखें।', 'Arabic': 'Journey هو المكان الذي تسجل فيه كل يوم من برنامجك. سجل مشاعرك واحفظ اللحظات واكتب ملاحظات شخصية.', 'Portuguese': 'Journey é onde você registra cada dia do seu programa. Registre seus sentimentos, salve momentos e escreva notas pessoais.', 'Français': 'Journey est l\'endroit où vous enregistrez chaque jour de votre programme. Enregistrez vos sentiments, sauvegardez des moments et écrivez des notes personnelles.', 'Japanese': 'Journeyはプログラムの毎日を記録する場所です。感情を記録し、瞬間を保存し、個人的なメモを書きましょう。', 'Deutsch': 'Journey ist der Ort, an dem du jeden Tag deines Programms aufzeichnest. Zeichne deine Gefühle auf, speichere Momente und schreibe persönliche Notizen.' }),
      // ── Step 21 ─────────────────────────────────────────────────────────────
      s21_title: pick({ 'English': 'Feeling — Record Your Mood', 'Bahasa Indonesia': 'Feeling — Rekam Suasana Hati', 'Español': 'Feeling — Registra tu estado de ánimo', 'Chinese': '心情——记录你的情绪', 'Hindi': 'Feeling — अपना मूड रिकॉर्ड करें', 'Arabic': 'Feeling — سجل مزاجك', 'Portuguese': 'Feeling — Registre seu humor', 'Français': 'Feeling — Enregistrez votre humeur', 'Japanese': 'Feeling — 気分を記録する', 'Deutsch': 'Feeling — Deine Stimmung aufzeichnen' }),
      s21_desc: pick({ 'English': 'Every day, choose the emoji that best represents your feelings. Your mood is saved as emotional data for your journey.', 'Bahasa Indonesia': 'Setiap hari, pilih emoji yang paling mewakili perasaanmu. Mood ini tersimpan sebagai data emosional perjalananmu.', 'Español': 'Cada día, elige el emoji que mejor represente tus sentimientos. Tu estado de ánimo se guarda como datos emocionales para tu viaje.', 'Chinese': '每天，选择最能代表你感受的表情符号。你的情绪被保存为你旅程的情感数据。', 'Hindi': 'हर दिन, वह इमोजी चुनें जो आपकी भावनाओं का सबसे अच्छे से प्रतिनिधित्व करती हो। आपका मूड आपकी यात्रा के लिए भावनात्मक डेटा के रूप में सहेजा जाता है।', 'Arabic': 'كل يوم، اختر الرمز التعبيري الذي يمثل مشاعرك بشكل أفضل. يتم حفظ مزاجك كبيانات عاطفية لرحلتك.', 'Portuguese': 'Todo dia, escolha o emoji que melhor representa seus sentimentos. Seu humor é salvo como dados emocionais para sua jornada.', 'Français': 'Chaque jour, choisissez l\'emoji qui représente le mieux vos sentiments. Votre humeur est sauvegardée comme données émotionnelles pour votre parcours.', 'Japanese': '毎日、あなたの感情を最もよく表す絵文字を選んでください。あなたの気分はジャーニーの感情データとして保存されます。', 'Deutsch': 'Wähle jeden Tag das Emoji, das deine Gefühle am besten beschreibt. Deine Stimmung wird als emotionale Daten für deine Reise gespeichert.' }),
      // ── Step 22 ─────────────────────────────────────────────────────────────
      s22_title: pick({ 'English': 'Capture Moments', 'Bahasa Indonesia': 'Abadikan Momen', 'Español': 'Captura momentos', 'Chinese': '捕捉瞬间', 'Hindi': 'पलों को कैद करें', 'Arabic': 'التقط اللحظات', 'Portuguese': 'Capture momentos', 'Français': 'Capturer des moments', 'Japanese': '瞬間を捉える', 'Deutsch': 'Momente festhalten' }),
      s22_desc: pick({ 'English': 'Add photos from your day to capture precious moments. These photos will become visual memories of your journey.', 'Bahasa Indonesia': 'Tambahkan foto dari harimu untuk mengabadikan momen berharga. Foto-foto ini akan menjadi kenangan visual perjalananmu.', 'Español': 'Agrega fotos de tu día para capturar momentos preciosos. Estas fotos se convertirán en recuerdos visuales de tu viaje.', 'Chinese': '添加当天的照片来捕捉珍贵的瞬间。这些照片将成为你旅程的视觉记忆。', 'Hindi': 'कीमती पलों को कैद करने के लिए अपने दिन की तस्वीरें जोड़ें। ये तस्वीरें आपकी यात्रा की दृश्य यादें बन जाएंगी।', 'Arabic': 'أضف صوراً من يومك لالتقاط اللحظات الثمينة. ستصبح هذه الصور ذكريات بصرية لرحلتك.', 'Portuguese': 'Adicione fotos do seu dia para capturar momentos preciosos. Essas fotos se tornarão memórias visuais da sua jornada.', 'Français': 'Ajoutez des photos de votre journée pour capturer des moments précieux. Ces photos deviendront des souvenirs visuels de votre parcours.', 'Japanese': '貴重な瞬間を捉えるために、その日の写真を追加しましょう。これらの写真はジャーニーの視覚的な思い出になります。', 'Deutsch': 'Füge Fotos von deinem Tag hinzu, um kostbare Momente festzuhalten. Diese Fotos werden visuelle Erinnerungen deiner Reise.' }),
      // ── Step 23 ─────────────────────────────────────────────────────────────
      s23_title: pick({ 'English': 'Journal / Note', 'Bahasa Indonesia': 'Jurnal / Note', 'Español': 'Diario / Nota', 'Chinese': '日记/笔记', 'Hindi': 'जर्नल / नोट', 'Arabic': 'المجلة / الملاحظة', 'Portuguese': 'Diário / Nota', 'Français': 'Journal / Note', 'Japanese': 'ジャーナル / ノート', 'Deutsch': 'Tagebuch / Notiz' }),
      s23_desc: pick({ 'English': 'Write your daily notes here. Reflect on what you learned, felt, or achieved today. These notes are completely private.', 'Bahasa Indonesia': 'Tulis catatan harianmu di sini. Refleksikan apa yang kamu pelajari, rasakan, atau capai hari ini. Catatan ini hanya bisa kamu baca sendiri.', 'Español': 'Escribe tus notas diarias aquí. Reflexiona sobre lo que aprendiste, sentiste o lograste hoy. Estas notas son completamente privadas.', 'Chinese': '在这里写下你的每日笔记。反思今天学到的、感受到的或实现的。这些笔记完全是私密的。', 'Hindi': 'यहाँ अपने दैनिक नोट्स लिखें। आज आपने जो सीखा, महसूस किया, या हासिल किया उस पर विचार करें। ये नोट्स पूरी तरह से निजी हैं।', 'Arabic': 'اكتب ملاحظاتك اليومية هنا. فكر فيما تعلمته وشعرت به أو حققته اليوم. هذه الملاحظات خاصة تماماً.', 'Portuguese': 'Escreva suas notas diárias aqui. Reflita sobre o que você aprendeu, sentiu ou alcançou hoje. Essas notas são completamente privadas.', 'Français': 'Écrivez vos notes quotidiennes ici. Réfléchissez à ce que vous avez appris, ressenti ou accompli aujourd\'hui. Ces notes sont complètement privées.', 'Japanese': 'ここに毎日のメモを書きましょう。今日学んだこと、感じたこと、達成したことを振り返りましょう。これらのメモは完全にプライベートです。', 'Deutsch': 'Schreibe hier deine täglichen Notizen. Reflektiere, was du heute gelernt, gefühlt oder erreicht hast. Diese Notizen sind vollständig privat.' }),
      // ── Step 24 ─────────────────────────────────────────────────────────────
      s24_title: pick({ 'English': 'Visit Global Feed', 'Bahasa Indonesia': 'Kunjungi Global Feed', 'Español': 'Visitar el feed global', 'Chinese': '访问全球动态', 'Hindi': 'Global Feed देखें', 'Arabic': 'زيارة الموجز العالمي', 'Portuguese': 'Visitar feed global', 'Français': 'Visiter le fil global', 'Japanese': 'グローバルフィードを見る', 'Deutsch': 'Globalen Feed besuchen' }),
      s24_desc: pick({ 'English': 'Tap the Global tab in the bottom navigation bar.', 'Bahasa Indonesia': 'Ketuk tab Global di navigasi bawah.', 'Español': 'Toca la pestaña Global en la barra de navegación inferior.', 'Chinese': '点击底部导航栏中的全局选项卡。', 'Hindi': 'नीचे नेविगेशन बार में Global टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب Global في شريط التنقل السفلي.', 'Portuguese': 'Toque na aba Global na barra de navegação inferior.', 'Français': 'Appuyez sur l\'onglet Global dans la barre de navigation inférieure.', 'Japanese': '下部ナビゲーションバーのGlobalタブをタップしましょう。', 'Deutsch': 'Tippe auf den Global-Tab in der unteren Navigationsleiste.' }),
      // ── Step 25 ─────────────────────────────────────────────────────────────
      s25_title: pick({ 'English': 'Community Global Feed', 'Bahasa Indonesia': 'Global Feed Komunitas', 'Español': 'Feed global de la comunidad', 'Chinese': '社区全球动态', 'Hindi': 'समुदाय Global Feed', 'Arabic': 'الموجز العالمي للمجتمع', 'Portuguese': 'Feed global da comunidade', 'Français': 'Fil global de la communauté', 'Japanese': 'コミュニティのグローバルフィード', 'Deutsch': 'Globaler Community-Feed' }),
      s25_desc: pick({ 'English': 'Here you can view progress posts from other users in your region, show support, and share your own progress.', 'Bahasa Indonesia': 'Di sini kamu bisa melihat postingan progres dari pengguna lain di region-mu, memberikan dukungan, dan berbagi progresmu sendiri.', 'Español': 'Aquí puedes ver publicaciones de progreso de otros usuarios en tu región, dar apoyo y compartir tu propio progreso.', 'Chinese': '在这里你可以看到你所在地区其他用户的进度帖子，给予支持并分享你自己的进度。', 'Hindi': 'यहां आप अपने क्षेत्र के अन्य उपयोगकर्ताओं की प्रगति पोस्ट देख सकते हैं, समर्थन दे सकते हैं और अपनी प्रगति साझा कर सकते हैं।', 'Arabic': 'هنا يمكنك رؤية منشورات التقدم من مستخدمين آخرين في منطقتك وتقديم الدعم ومشاركة تقدمك الخاص.', 'Portuguese': 'Aqui você pode ver postagens de progresso de outros usuários em sua região, mostrar suporte e compartilhar seu próprio progresso.', 'Français': 'Ici, vous pouvez voir les publications de progression d\'autres utilisateurs dans votre région, apporter votre soutien et partager votre propre progression.', 'Japanese': 'ここでは、あなたの地域の他のユーザーの進捗投稿を見て、サポートを示し、自分の進捗を共有できます。', 'Deutsch': 'Hier kannst du Fortschrittsbeiträge von anderen Benutzern in deiner Region sehen, Unterstützung zeigen und deinen eigenen Fortschritt teilen.' }),
      // ── Step 26 ─────────────────────────────────────────────────────────────
      s26_title: pick({ 'English': 'Share Your Progress', 'Bahasa Indonesia': 'Bagikan Kemajuanmu', 'Español': 'Comparte tu progreso', 'Chinese': '分享你的进度', 'Hindi': 'अपनी प्रगति साझा करें', 'Arabic': 'شارك تقدمك', 'Portuguese': 'Compartilhe seu progresso', 'Français': 'Partagez votre progression', 'Japanese': '進捗を共有する', 'Deutsch': 'Deinen Fortschritt teilen' }),
      s26_desc: pick({ 'English': 'Tap the green + button to share your daily progress with the community.', 'Bahasa Indonesia': 'Ketuk tombol tambah (+) untuk membagikan progres harianmu.', 'Español': 'Toca el botón verde + para compartir tu progreso diario con la comunidad.', 'Chinese': '点击绿色+按钮与社区分享你的每日进度。', 'Hindi': 'समुदाय के साथ अपनी दैनिक प्रगति साझा करने के लिए हरे + बटन पर टैप करें।', 'Arabic': 'انقر على زر + الأخضر لمشاركة تقدمك اليومي مع المجتمع.', 'Portuguese': 'Toque no botão verde + para compartilhar seu progresso diário com a comunidade.', 'Français': 'Appuyez sur le bouton vert + pour partager votre progression quotidienne avec la communauté.', 'Japanese': 'コミュニティと毎日の進捗を共有するために緑の+ボタンをタップしましょう。', 'Deutsch': 'Tippe auf den grünen + Knopf, um deinen täglichen Fortschritt mit der Community zu teilen.' }),
      // ── Step 27 ─────────────────────────────────────────────────────────────
      s27_title: pick({ 'English': 'Choose Habit Progress', 'Bahasa Indonesia': 'Pilih Progres Habit', 'Español': 'Elegir progreso de hábito', 'Chinese': '选择习惯进度', 'Hindi': 'हैबिट प्रगति चुनें', 'Arabic': 'اختر تقدم العادة', 'Portuguese': 'Escolher progresso de hábito', 'Français': 'Choisir la progression de l\'habitude', 'Japanese': '習慣の進捗を選択', 'Deutsch': 'Gewohnheitsfortschritt auswählen' }),
      s27_desc: pick({ 'English': 'Choose the habit (like Daily Hydration) you completed today to share.', 'Bahasa Indonesia': 'Pilih habit (seperti Hidrasi Harian) yang telah kamu selesaikan hari ini untuk dibagikan.', 'Español': 'Elige el hábito (como Hidratación Diaria) que completaste hoy para compartir.', 'Chinese': '选择你今天完成的习惯（如每日补水）来分享。', 'Hindi': 'आज जो आदत पूरी की उसे (जैसे Daily Hydration) साझा करने के लिए चुनें।', 'Arabic': 'اختر العادة (مثل الترطيب اليومي) التي أكملتها اليوم للمشاركة.', 'Portuguese': 'Escolha o hábito (como Hidratação Diária) que você concluiu hoje para compartilhar.', 'Français': 'Choisissez l\'habitude (comme Hydratation Quotidienne) que vous avez complétée aujourd\'hui pour la partager.', 'Japanese': '今日完了した習慣（毎日の水分補給など）を選んで共有しましょう。', 'Deutsch': 'Wähle die Gewohnheit (wie Tägliche Hydration), die du heute abgeschlossen hast, um sie zu teilen.' }),
      // ── Step 28 ─────────────────────────────────────────────────────────────
      s28_title: pick({ 'English': 'Upload Moment Photo', 'Bahasa Indonesia': 'Unggah Foto Momen', 'Español': 'Subir foto del momento', 'Chinese': '上传瞬间照片', 'Hindi': 'पल की फोटो अपलोड करें', 'Arabic': 'تحميل صورة اللحظة', 'Portuguese': 'Enviar foto do momento', 'Français': 'Télécharger une photo du moment', 'Japanese': '瞬間の写真をアップロード', 'Deutsch': 'Momentfoto hochladen' }),
      s28_desc: pick({ 'English': 'Tap here to capture a photo using camera or gallery.', 'Bahasa Indonesia': 'Ketuk di sini untuk mengambil foto momen berhargamu hari ini menggunakan kamera atau galeri handphone.', 'Español': 'Toca aquí para capturar una foto usando la cámara o la galería.', 'Chinese': '点击这里使用相机或图库拍摄照片。', 'Hindi': 'कैमरा या गैलरी का उपयोग करके फोटो लेने के लिए यहां टैप करें।', 'Arabic': 'انقر هنا لالتقاط صورة باستخدام الكاميرا أو المعرض.', 'Portuguese': 'Toque aqui para capturar uma foto usando câmera ou galeria.', 'Français': 'Appuyez ici pour capturer une photo en utilisant l\'appareil photo ou la galerie.', 'Japanese': 'カメラまたはギャラリーを使って写真を撮るにはここをタップしましょう。', 'Deutsch': 'Tippe hier, um ein Foto mit Kamera oder Galerie aufzunehmen.' }),
      // ── Step 29 ─────────────────────────────────────────────────────────────
      s29_title: pick({ 'English': 'Write Caption', 'Bahasa Indonesia': 'Tulis Caption', 'Español': 'Escribir pie de foto', 'Chinese': '写说明', 'Hindi': 'कैप्शन लिखें', 'Arabic': 'اكتب تعليقاً', 'Portuguese': 'Escrever legenda', 'Français': 'Écrire une légende', 'Japanese': 'キャプションを書く', 'Deutsch': 'Bildunterschrift schreiben' }),
      s29_desc: pick({ 'English': 'Write a short story, thought, or motivation about the habit you practiced today.', 'Bahasa Indonesia': 'Tulis cerita singkat, keluh kesah, atau motivasi mengenai habit yang kamu jalani hari ini.', 'Español': 'Escribe una historia corta, pensamiento o motivación sobre el hábito que practicaste hoy.', 'Chinese': '写下关于你今天练习的习惯的简短故事、想法或动力。', 'Hindi': 'आज जो आदत आपने प्रैक्टिस की उसके बारे में एक छोटी कहानी, विचार या प्रेरणा लिखें।', 'Arabic': 'اكتب قصة قصيرة أو فكرة أو دافع حول العادة التي مارستها اليوم.', 'Portuguese': 'Escreva uma história curta, pensamento ou motivação sobre o hábito que você praticou hoje.', 'Français': 'Écrivez une courte histoire, une pensée ou une motivation sur l\'habitude que vous avez pratiquée aujourd\'hui.', 'Japanese': '今日練習した習慣についての短い話、考え、またはモチベーションを書きましょう。', 'Deutsch': 'Schreibe eine kurze Geschichte, einen Gedanken oder eine Motivation über die Gewohnheit, die du heute geübt hast.' }),
      // ── Step 30 ─────────────────────────────────────────────────────────────
      s30_title: pick({ 'English': 'Share Post', 'Bahasa Indonesia': 'Bagikan Postingan', 'Español': 'Compartir publicación', 'Chinese': '分享帖子', 'Hindi': 'पोस्ट साझा करें', 'Arabic': 'مشاركة المنشور', 'Portuguese': 'Compartilhar publicação', 'Français': 'Partager la publication', 'Japanese': '投稿を共有する', 'Deutsch': 'Beitrag teilen' }),
      s30_desc: pick({ 'English': 'Tap the SHARE button to publish your progress to the community Global Feed.', 'Bahasa Indonesia': 'Ketuk tombol SHARE ini untuk memposting progresmu ke Global Feed komunitas.', 'Español': 'Toca el botón COMPARTIR para publicar tu progreso en el feed global de la comunidad.', 'Chinese': '点击SHARE按钮将您的进度发布到社区全球动态。', 'Hindi': 'अपनी प्रगति को Community Global Feed पर प्रकाशित करने के लिए SHARE बटन पर टैप करें।', 'Arabic': 'انقر على زر SHARE لنشر تقدمك في الموجز العالمي للمجتمع.', 'Portuguese': 'Toque no botão COMPARTILHAR para publicar seu progresso no feed global da comunidade.', 'Français': 'Appuyez sur le bouton PARTAGER pour publier votre progression dans le fil global de la communauté.', 'Japanese': 'SHAREボタンをタップして進捗をコミュニティのグローバルフィードに公開しましょう。', 'Deutsch': 'Tippe auf den TEILEN-Knopf, um deinen Fortschritt im globalen Community-Feed zu veröffentlichen.' }),
      // ── Step 31 ─────────────────────────────────────────────────────────────
      s31_title: pick({ 'English': 'Support Tools', 'Bahasa Indonesia': 'Alat Pendukung', 'Español': 'Herramientas de apoyo', 'Chinese': '支持工具', 'Hindi': 'सहायता उपकरण', 'Arabic': 'أدوات الدعم', 'Portuguese': 'Ferramentas de suporte', 'Français': 'Outils de soutien', 'Japanese': 'サポートツール', 'Deutsch': 'Support-Tools' }),
      s31_desc: pick({ 'English': 'Tap the Features tab in the bottom navigation bar.', 'Bahasa Indonesia': 'Ketuk tab Features di navigasi bawah.', 'Español': 'Toca la pestaña Features en la barra de navegación inferior.', 'Chinese': '点击底部导航栏中的功能选项卡。', 'Hindi': 'नीचे नेविगेशन बार में Features टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب المميزات في شريط التنقل السفلي.', 'Portuguese': 'Toque na aba Features na barra de navegação inferior.', 'Français': 'Appuyez sur l\'onglet Features dans la barre de navigation inférieure.', 'Japanese': '下部ナビゲーションバーのFeaturesタブをタップしましょう。', 'Deutsch': 'Tippe auf den Features-Tab in der unteren Navigationsleiste.' }),
      // ── Step 32 ─────────────────────────────────────────────────────────────
      s32_title: pick({ 'English': 'Focus & Workouts', 'Bahasa Indonesia': 'Fokus & Latihan', 'Español': 'Enfoque y ejercicios', 'Chinese': '专注与训练', 'Hindi': 'फोकस और वर्कआउट', 'Arabic': 'التركيز والتدريبات', 'Portuguese': 'Foco e treinos', 'Français': 'Focus et exercices', 'Japanese': 'フォーカスとワークアウト', 'Deutsch': 'Fokus & Training' }),
      s32_desc: pick({ 'English': 'Use Pomodoro, Workout, or MathRacing to boost your productivity.', 'Bahasa Indonesia': 'Gunakan Pomodoro, Workout, atau MathRacing untuk produktivitas.', 'Español': 'Usa Pomodoro, Workout o MathRacing para aumentar tu productividad.', 'Chinese': '使用Pomodoro、Workout或MathRacing提升你的生产力。', 'Hindi': 'अपनी उत्पादकता बढ़ाने के लिए Pomodoro, Workout, या MathRacing का उपयोग करें।', 'Arabic': 'استخدم Pomodoro أو Workout أو MathRacing لتعزيز إنتاجيتك.', 'Portuguese': 'Use Pomodoro, Workout ou MathRacing para aumentar sua produtividade.', 'Français': 'Utilisez Pomodoro, Workout ou MathRacing pour augmenter votre productivité.', 'Japanese': 'Pomodoro、Workout、またはMathRacingを使って生産性を高めましょう。', 'Deutsch': 'Nutze Pomodoro, Workout oder MathRacing, um deine Produktivität zu steigern.' }),
      // ── Step 33 ─────────────────────────────────────────────────────────────
      s33_title: pick({ 'English': 'Customize Profile', 'Bahasa Indonesia': 'Kustomisasi Profil', 'Español': 'Personalizar perfil', 'Chinese': '自定义个人资料', 'Hindi': 'प्रोफाइल कस्टमाइज़ करें', 'Arabic': 'تخصيص الملف الشخصي', 'Portuguese': 'Personalizar perfil', 'Français': 'Personnaliser le profil', 'Japanese': 'プロフィールをカスタマイズ', 'Deutsch': 'Profil anpassen' }),
      s33_desc: pick({ 'English': 'Tap the Settings button in the top corner to customize your profile.', 'Bahasa Indonesia': 'Ketuk tombol Settings di sudut atas.', 'Español': 'Toca el botón de configuración en la esquina superior para personalizar tu perfil.', 'Chinese': '点击右上角的设置按钮来自定义您的个人资料。', 'Hindi': 'अपनी प्रोफाइल को कस्टमाइज़ करने के लिए ऊपरी कोने में Settings बटन पर टैप करें।', 'Arabic': 'انقر على زر الإعدادات في الزاوية العلوية لتخصيص ملفك الشخصي.', 'Portuguese': 'Toque no botão de Configurações no canto superior para personalizar seu perfil.', 'Français': 'Appuyez sur le bouton Paramètres dans le coin supérieur pour personnaliser votre profil.', 'Japanese': 'プロフィールをカスタマイズするには上隅のSettingsボタンをタップしましょう。', 'Deutsch': 'Tippe auf den Einstellungs-Knopf in der oberen Ecke, um dein Profil anzupassen.' }),
      // ── Step 34 ─────────────────────────────────────────────────────────────
      s34_title: pick({ 'English': 'You\'re Ready to Begin!', 'Bahasa Indonesia': 'Kamu Siap Memulai!', 'Español': '¡Estás listo para comenzar!', 'Chinese': '你准备好开始了！', 'Hindi': 'आप शुरू करने के लिए तैयार हैं!', 'Arabic': 'أنت مستعد للبدء!', 'Portuguese': 'Você está pronto para começar!', 'Français': 'Vous êtes prêt à commencer !', 'Japanese': 'あなたは始める準備ができています！', 'Deutsch': 'Du bist bereit anzufangen!' }),
      s34_desc: pick({ 'English': 'Tour complete! Have a great time starting your discipline journey in InRising.', 'Bahasa Indonesia': 'Tur selesai! Selamat memulai perjalanan disiplinmu di InRising.', 'Español': '¡Tour completo! Que tengas un buen tiempo comenzando tu viaje de disciplina en InRising.', 'Chinese': '导览完成！祝你在InRising开始纪律之旅愉快。', 'Hindi': 'दौरा पूरा हुआ! InRising में अपनी अनुशासन यात्रा शुरू करने का अच्छा समय आपका इंतजार कर रहा है।', 'Arabic': 'اكتملت الجولة! استمتع ببدء رحلة انضباطك في InRising.', 'Portuguese': 'Tour completo! Aproveite para começar sua jornada de disciplina no InRising.', 'Français': 'Tour terminé ! Profitez de votre voyage de discipline dans InRising.', 'Japanese': 'ツアー完了！InRisingでの規律の旅を楽しんでください。', 'Deutsch': 'Tour abgeschlossen! Viel Spaß beim Start deiner Disziplinreise in InRising.' }),
      s34_action: pick({ 'English': 'Finish', 'Bahasa Indonesia': 'Selesaikan', 'Español': 'Finalizar', 'Chinese': '完成', 'Hindi': 'समाप्त करें', 'Arabic': 'إنهاء', 'Portuguese': 'Concluir', 'Français': 'Terminer', 'Japanese': '完了', 'Deutsch': 'Beenden' }),
      // ── Shared ──────────────────────────────────────────────────────────────
      next: pick({ 'English': 'Next', 'Bahasa Indonesia': 'Lanjut', 'Español': 'Siguiente', 'Chinese': '下一步', 'Hindi': 'अगला', 'Arabic': 'التالي', 'Portuguese': 'Próximo', 'Français': 'Suivant', 'Japanese': '次へ', 'Deutsch': 'Weiter' }),
    };
  }, [language, programDuration]);

  const steps: Step[] = useMemo(() => [
    // 0. Intro
    {
      selector: null,
      title: L.s0_title,
      desc: L.s0_desc,
      expression: 'welcome',
      actionText: L.s0_action,
      tab: 'habits',
    },
    // 1. Habit Card Double Click
    {
      selector: '#first-habit-card',
      title: L.s1_title,
      desc: L.s1_desc,
      expression: 'guide',
      tab: 'habits',
    },
    // 2. Add Habit FAB
    {
      selector: '#add-habit-fab',
      title: L.s2_title,
      desc: L.s2_desc,
      expression: 'guide',
      tab: 'habits',
    },
    // 3. Select Drink Water preset
    {
      selector: '#habit-pick-drink-water',
      title: L.s3_title,
      desc: L.s3_desc,
      expression: 'guide',
      tab: 'habits',
    },
    // 4. Open Intensity Picker
    {
      selector: '#habit-config-intensity-btn',
      title: L.s4_title,
      desc: L.s4_desc,
      expression: 'guide',
      tab: 'habits',
    },
    // 5. Done in Intensity Picker
    {
      selector: '#habit-config-intensity-modal',
      clickTarget: '#habit-config-intensity-done-btn',
      title: L.s5_title,
      desc: L.s5_desc,
      expression: 'thinking',
      tab: 'habits',
    },
    // 6. Save Habit
    {
      selector: '#habit-config-modal',
      clickTarget: '#habit-config-save-btn',
      title: L.s6_title,
      desc: L.s6_desc,
      expression: 'success',
      tab: 'habits',
    },
    // 7. Navigate to To-Do tab
    {
      selector: '#nav-todo',
      title: L.s7_title,
      desc: L.s7_desc,
      expression: 'success',
      expectedTab: 'todo',
      tab: 'habits',
    },
    // 8. To-Do Intro & Quick Add
    {
      selector: '#todo-quick-add',
      clickTarget: '#todo-quick-add-submit-btn',
      title: L.s8_title,
      desc: L.s8_desc,
      expression: 'guide',
      tab: 'todo',
    },
    // 9. Check To-Do
    {
      selector: '#todo-checkbox-item',
      title: L.s9_title,
      desc: L.s9_desc,
      expression: 'success',
      tab: 'todo',
    },
    // 10. Completed Tab To-Do
    {
      selector: '#todo-tab-done',
      title: L.s10_title,
      desc: L.s10_desc,
      expression: 'guide',
      tab: 'todo',
    },
    // 11. Navigate to Analytics tab
    {
      selector: '#nav-analytics',
      title: L.s11_title,
      desc: L.s11_desc,
      expression: 'guide',
      expectedTab: 'analytics',
      tab: 'todo',
    },
    // 12. Drink Water Analytics Detail
    {
      selector: '#analytics-drink-water-card',
      title: L.s12_title,
      desc: L.s12_desc,
      expression: 'guide',
      tab: 'analytics',
    },
    // 13. Weekly Chart Explanation
    {
      selector: '#habit-analytics-weekly-chart',
      title: L.s13_title,
      desc: L.s13_desc,
      expression: 'guide',
      actionText: L.next,
      tab: 'analytics',
    },
    // 14. Monthly Record Explanation
    {
      selector: '#habit-analytics-monthly-record',
      title: L.s14_title,
      desc: L.s14_desc,
      expression: 'thinking',
      actionText: L.next,
      tab: 'analytics',
    },
    // 15. Stats RPG Tab Navigation
    {
      selector: '#analytics-tab-stats',
      title: L.s15_title,
      desc: L.s15_desc,
      expression: 'thinking',
      tab: 'analytics',
    },
    // 15a. RPG Stats Explanation
    {
      selector: '#analytics-rpg-stats-container',
      title: L.s16_title,
      desc: L.s16_desc,
      expression: 'success',
      actionText: L.next,
      tab: 'analytics',
    },
    // 16. Activity Recap Tab Navigation
    {
      selector: '#analytics-tab-recap',
      title: L.s17_title,
      desc: L.s17_desc,
      expression: 'guide',
      tab: 'analytics',
    },
    // 16a. Activity Recap Explanation
    {
      selector: '#analytics-activity-recap-container',
      title: L.s18_title,
      desc: L.s18_desc,
      expression: 'guide',
      actionText: L.next,
      tab: 'analytics',
    },
    // 17. Navigate to Journey tab
    {
      selector: '#nav-journey',
      title: L.s19_title,
      desc: L.s19_desc,
      expression: 'guide',
      expectedTab: 'journey',
      tab: 'analytics',
    },
    // Journey intro
    {
      selector: '#journey-today-card',
      title: L.s20_title,
      desc: L.s20_desc,
      expression: 'success',
      actionText: L.next,
      tab: 'journey',
    },
    // Journey - Mood
    {
      selector: '#journey-mood-box',
      title: L.s21_title,
      desc: L.s21_desc,
      expression: 'guide',
      actionText: L.next,
      tab: 'journey',
    },
    // Journey - Abadikan Momen (Media)
    {
      selector: '#journey-media-btn',
      title: L.s22_title,
      desc: L.s22_desc,
      expression: 'guide',
      actionText: L.next,
      tab: 'journey',
    },
    // Journey - Jurnal / Note
    {
      selector: '#journey-write-btn',
      title: L.s23_title,
      desc: L.s23_desc,
      expression: 'thinking',
      actionText: L.next,
      tab: 'journey',
    },
    // 18. Navigate to Global tab
    {
      selector: '#nav-global',
      title: L.s24_title,
      desc: L.s24_desc,
      expression: 'success',
      expectedTab: 'global',
      tab: 'journey',
    },
    // Global Feed Explanation
    {
      selector: '.flex-1.overflow-y-auto.py-4.no-scrollbar',
      title: L.s25_title,
      desc: L.s25_desc,
      expression: 'success',
      actionText: L.next,
      tab: 'global',
    },
    // Global Feed FAB button
    {
      selector: '#global-fab',
      title: L.s26_title,
      desc: L.s26_desc,
      expression: 'guide',
      tab: 'global',
    },
    // Habit Picker inside post modal
    {
      selector: '#post-habit-picker-container',
      clickTarget: '.post-habit-option-btn',
      title: L.s27_title,
      desc: L.s27_desc,
      expression: 'guide',
      tab: 'global',
    },
    // Photo Upload inside post modal
    {
      selector: '#post-media-area',
      title: L.s28_title,
      desc: L.s28_desc,
      expression: 'guide',
      actionText: L.next,
      tab: 'global',
    },
    // Caption Input inside post modal
    {
      selector: '#post-caption-input',
      title: L.s29_title,
      desc: L.s29_desc,
      expression: 'guide',
      actionText: L.next,
      tab: 'global',
    },
    // Share Post inside post modal
    {
      selector: '#post-share-btn',
      title: L.s30_title,
      desc: L.s30_desc,
      expression: 'success',
      actionText: L.next,
      tab: 'global',
    },
    // 19. Navigate to Features tab
    {
      selector: '#nav-features',
      title: L.s31_title,
      desc: L.s31_desc,
      expression: 'guide',
      expectedTab: 'features',
      tab: 'global',
    },
    // 20. Features Hub (Pomodoro, Workout, Math)
    {
      selector: '#features-hub-grid, .grid.grid-cols-2',
      title: L.s32_title,
      desc: L.s32_desc,
      expression: 'guide',
      actionText: L.next,
      tab: 'features',
    },
    // 21. Settings Overlay
    {
      selector: '#settings-toggle-btn',
      title: L.s33_title,
      desc: L.s33_desc,
      expression: 'guide',
      tab: 'habits',
    },
    // 22. End of Tour
    {
      selector: null,
      title: L.s34_title,
      desc: L.s34_desc,
      expression: 'success',
      actionText: L.s34_action,
      tab: 'habits',
    },
  ], [L]);

  const currentStepData = steps[currentStep];

  // Update bounding rect coordinates of targeted element
  const updateBoundingRect = () => {
    if (!currentStepData?.selector) {
      setTargetRect(null);
      return;
    }
    const element = document.querySelector(currentStepData.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      console.log(`[InteractiveTutorial Debug] Step ${currentStep} (${currentStepData.title}): selector="${currentStepData.selector}" found! rect=`, {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
      });
      setTargetRect(rect);
    } else {
      console.log(`[InteractiveTutorial Debug] Step ${currentStep} (${currentStepData.title}): selector="${currentStepData.selector}" NOT FOUND`);
      setTargetRect(null);
    }
  };

  // Recalculate layout size on step change, resize, or scroll
  useEffect(() => {
    // Delay initial rect calc to let DOM settle after tab switch
    const initTimer = setTimeout(updateBoundingRect, 200);
    const handleResize = () => {
      if (updateTimerRef.current) cancelAnimationFrame(updateTimerRef.current);
      updateTimerRef.current = requestAnimationFrame(updateBoundingRect);
    };
    // Periodic polling to handle scroll and dynamic DOM changes
    const pollInterval = setInterval(updateBoundingRect, 500);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      clearTimeout(initTimer);
      clearInterval(pollInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      if (updateTimerRef.current) cancelAnimationFrame(updateTimerRef.current);
    };
  }, [currentStep, activeTab]);

  // Auto advance if the user performs the target tab switch action
  useEffect(() => {
    if (currentStep < maxStep) return;
    if (currentStepData?.expectedTab === activeTab) {
      setTimeout(() => {
        handleNext();
      }, 100);
    }
  }, [activeTab, currentStep, maxStep]);

  // Special listener for custom clicks on the highlighted target elements to auto-advance
  useEffect(() => {
    if (currentStep < maxStep) return;
    const targetSelector = currentStepData?.clickTarget || currentStepData?.selector;
    if (!targetSelector || currentStepData.actionText) return;
    if (currentStep === 1) return; // Exclude step 2 (index 1) double-tap card from single-click listener

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(targetSelector)) {
        setTimeout(() => {
          handleNext();
        }, 150);
      }
    };

    // Use capture phase (true) to intercept the click before other handlers call stopPropagation()
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [currentStep, currentStepData, maxStep]);

  // Listen for habit completions to advance Step 2 (index 1)
  useEffect(() => {
    if (currentStep !== 1) return;
    if (currentStep < maxStep) return;

    let active = true;
    const unsubscribe = useHabitStore.subscribe((state) => {
      // Check if any habit is completed
      const hasCompleted = state.habits.some(h => h.completed);
      if (hasCompleted && active) {
        active = false;
        unsubscribe();
        setTimeout(() => {
          handleNext();
        }, 300);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [currentStep, maxStep]);

  // Auto-advance if the DOM state reflects that the user has already navigated to the next phase
  useEffect(() => {
    if (currentStep < maxStep) return;
    const checkStateAndAdvance = () => {
      // 1. If we are on Step 2 (index 2: "Buat Habit Pertama" / '#add-habit-fab')
      // and the Add Habit screen/modal is open (which has #habit-pick-drink-water)
      if (currentStep === 2 && document.getElementById('habit-pick-drink-water')) {
        handleNext();
        return;
      }

      // 2. If we are on Step 3 (index 3: "Select Drink Water preset" / '#habit-pick-drink-water')
      // and the config modal is open (which has #habit-config-intensity-btn)
      if (currentStep === 3 && document.getElementById('habit-config-intensity-btn')) {
        handleNext();
        return;
      }

      // 3. If we are on Step 4 (index 4: "Open Intensity Picker" / '#habit-config-intensity-btn')
      // and the intensity picker is open (which has #habit-config-intensity-modal)
      if (currentStep === 4 && document.getElementById('habit-config-intensity-modal')) {
        handleNext();
        return;
      }

      // 4. If we are on Step 5 (index 5: "Done in Intensity Picker")
      // and the intensity picker is closed (meaning #habit-config-intensity-modal is gone, but we are still in config modal #habit-config-save-btn)
      if (currentStep === 5 && !document.getElementById('habit-config-intensity-modal') && document.getElementById('habit-config-save-btn')) {
        handleNext();
        return;
      }

      // 5. If we are on Step 6 (index 6: "Save Habit")
      // and the config modal is closed (meaning #habit-config-modal is gone)
      if (currentStep === 6 && !document.getElementById('habit-config-modal')) {
        handleNext();
        return;
      }
    };

    checkStateAndAdvance();
    const interval = setInterval(checkStateAndAdvance, 200);
    return () => clearInterval(interval);
  }, [currentStep, maxStep]);

  const handleNext = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (currentStep < steps.length - 1) {
      const nextStep = steps[currentStep + 1];
      if (nextStep.tab) {
        setActiveTab(nextStep.tab);
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Complete tutorial
      localStorage.setItem('interactive_tutorial_completed', 'true');
      localStorage.removeItem('interactive_tutorial_active');
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (currentStep > 0) {
      const prevStep = steps[currentStep - 1];
      if (prevStep.tab) {
        setActiveTab(prevStep.tab);
      }
      setCurrentStep(currentStep - 1);
    }
  };




  // Spotlight padding for breathing room
  const pad = 8;
  const sr = targetRect ? {
    top: Math.max(0, targetRect.top - pad),
    bottom: Math.min(window.innerHeight, targetRect.bottom + pad),
    left: Math.max(0, targetRect.left - pad),
    right: Math.min(window.innerWidth, targetRect.right + pad),
    height: targetRect.height + pad * 2,
    width: targetRect.width + pad * 2,
  } : null;

  // Determine dialogue position using intelligent space budgeting
  let dialogueTop = 'auto';
  let dialogueBottom = 'auto';
  let dialogueInTop = false;
  let hasValidSpace = true;

  if (!sr) {
    dialogueBottom = '30vh';
  } else {
    const spaceAbove = sr.top;
    const spaceBelow = window.innerHeight - sr.bottom;
    const dialogueHeightEstimate = 220; // estimated max height of dialogue

    if (spaceBelow >= dialogueHeightEstimate + 20) {
      // Place below target
      dialogueTop = `${sr.bottom + 24}px`;
      dialogueInTop = false;
    } else if (spaceAbove >= dialogueHeightEstimate + 20) {
      // Place above target
      dialogueBottom = `${window.innerHeight - sr.top + 24}px`;
      dialogueInTop = true;
    } else {
      // Very tall target (e.g. covers most of the screen) - place inside the cutout near the bottom safely
      dialogueBottom = '80px';
      dialogueInTop = false;
      hasValidSpace = false; // Disable the pointing arrow since we are overlaying the target
    }
  }

  // Arrow positioning
  const arrowConfig = useMemo(() => {
    if (!sr || !hasValidSpace) return null;
    const targetCenterX = sr.left + sr.width / 2;
    if (dialogueInTop) {
      // Dialogue is above target, so arrow should be below dialogue, pointing DOWN at target
      return {
        style: {
          top: `${sr.top - 40}px`,
          left: `${targetCenterX - 12}px`,
        },
        path: "M12 4v24M6 20l6 8 6-8" // points down, taller
      };
    } else {
      // Dialogue is below target, so arrow should be above dialogue, pointing UP at target
      return {
        style: {
          top: `${sr.bottom + 8}px`,
          left: `${targetCenterX - 12}px`,
        },
        path: "M12 28V4M6 12l6-8 6 8" // points up, taller
      };
    }
  }, [sr, dialogueInTop, hasValidSpace]);

  if (completed) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] pointer-events-none select-none">
      {/* Animated Arrow pointing at spotlight target */}
      {arrowConfig && (
        <motion.div 
          style={arrowConfig.style}
          className={`absolute z-[1000000] pointer-events-none ${isLight ? 'text-[#00b577]' : 'text-[#00f295]'} drop-shadow-[0_2px_8px_rgba(0,255,133,0.3)]`}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={arrowConfig.path} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      )}

      {/* 4-Panel Dynamic Masking */}
      {sr ? (
        <>
          {/* Top Panel */}
          <div 
            className={`absolute left-0 top-0 right-0 ${isLight ? 'bg-black/65' : 'bg-black/70'} pointer-events-auto transition-all duration-300`}
            style={{ height: `${sr.top}px` }}
          />
          {/* Bottom Panel */}
          <div 
            className={`absolute left-0 right-0 bottom-0 ${isLight ? 'bg-black/65' : 'bg-black/70'} pointer-events-auto transition-all duration-300`}
            style={{ top: `${sr.bottom}px` }}
          />
          {/* Left Panel */}
          <div 
            className={`absolute left-0 ${isLight ? 'bg-black/65' : 'bg-black/70'} pointer-events-auto transition-all duration-300`}
            style={{ 
              top: `${sr.top}px`, 
              height: `${sr.height}px`,
              width: `${sr.left}px`
            }}
          />
          {/* Right Panel */}
          <div 
            className={`absolute right-0 ${isLight ? 'bg-black/65' : 'bg-black/70'} pointer-events-auto transition-all duration-300`}
            style={{ 
              top: `${sr.top}px`, 
              height: `${sr.height}px`,
              left: `${sr.right}px`
            }}
          />
          {/* Spotlight Border Glow */}
          <div 
            className={`absolute rounded-2xl border-[1.5px] pointer-events-none transition-all duration-300 ${
              isLight 
                ? 'border-[#00b577]/50 shadow-[0_0_15px_rgba(0,181,119,0.15)]' 
                : 'border-[#00f295]/50 shadow-[0_0_15px_rgba(0,242,149,0.15)]'
            }`}
            style={{ top: sr.top, left: sr.left, width: sr.width, height: sr.height }}
          />
        </>
      ) : (
        /* Full Backdrop (e.g. for center welcome steps) */
        <div className={`absolute inset-0 ${isLight ? 'bg-black/60' : 'bg-black/70'} pointer-events-auto`} />
      )}

      {/* Main Dialogue Box */}
      <div 
        className="absolute w-full px-6 pointer-events-auto"
        style={{
          top: dialogueTop,
          bottom: dialogueBottom,
        }}
      >
        <motion.div 
          key={currentStep}
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`max-w-[580px] w-full mx-auto border rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col relative select-text overflow-hidden transition-all duration-300 ${
            isLight 
              ? 'bg-[#ffffff] border-black/5' 
              : 'bg-[#252830] border-white/[0.08]'
          }`}
        >
          {/* Dialogue Content */}
          <div className="pt-7 pb-8 px-8 flex flex-col relative">
            {/* Step Counter Badge */}
            <div className={`absolute top-7 right-8 px-3 py-0.5 rounded-full text-[10px] font-black font-['Outfit'] tracking-wide transition-all duration-300 ${
              isLight 
                ? 'bg-black/5 text-black/45' 
                : 'bg-white/10 text-white/50'
            }`}>
              {currentStep + 1} / {steps.length}
            </div>

            {/* Step Title */}
            <h4 
              style={{ color: isLight ? '#000000' : '#ffffff' }}
              className="text-[18px] font-black font-['Outfit'] mt-0 mb-4 tracking-tight"
            >
              {currentStepData.title}
            </h4>

            {/* Step Description */}
            <p 
              style={{ color: isLight ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.7)' }}
              className="text-[14.5px] font-normal leading-relaxed mb-8 font-['Outfit'] whitespace-pre-line"
            >
              {currentStepData.desc}
            </p>

            {/* Action buttons */}
            {currentStep === 0 ? (
              <div className="flex justify-center mt-2">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className={`px-8 py-3 rounded-xl border font-black uppercase text-[11px] tracking-widest transition-all font-['Outfit'] ${
                    isLight 
                      ? 'bg-[#00b577] border-black text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none' 
                      : 'bg-[#00f295] border-transparent text-black'
                  }`}
                >
                  {currentStepData.actionText}
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {/* Back Button */}
                {currentStep > 0 ? (
                  <button 
                    onClick={handleBack}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                      isLight 
                        ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none' 
                        : 'bg-[#2a2c32] border-white/10 text-white active:scale-95'
                    }`}
                  >
                    <Icon icon="ph:caret-left-bold" width={16} />
                  </button>
                ) : (
                  <div />
                )}

                {/* Lanjut / Next Button */}
                {(currentStepData.actionText || currentStep < steps.length - 1) && (
                  currentStepData.actionText && currentStepData.actionText !== 'Lanjut' ? (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      className={`px-5 py-2.5 rounded-xl border font-black uppercase text-[11px] tracking-wider transition-all flex items-center gap-1.5 font-['Outfit'] ${
                        isLight 
                          ? 'bg-[#00b577] border-black text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none' 
                          : 'bg-[#00f295] border-transparent text-black'
                      }`}
                    >
                      <span>{currentStepData.actionText}</span>
                      <Icon icon="ph:caret-right-bold" width={13} />
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                        isLight 
                          ? 'bg-[#00b577] border-black text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none' 
                          : 'bg-[#00f295] border-transparent text-black'
                      }`}
                    >
                      <Icon icon="ph:caret-right-bold" width={16} />
                    </motion.button>
                  )
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
};
