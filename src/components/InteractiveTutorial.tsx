import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useUserStore } from '../store/useUserStore';
import { useHabitStore } from '../store/useHabitStore';
import { useTranslation } from '../i18n';

// Mascot expressions (based on actual filenames)
type MascotExpression = 
  | 'cheer'
  | 'congrats'
  | 'done'
  | 'goodjob'
  | 'grow'
  | 'happy'
  | 'hmmm'
  | 'idea'
  | 'read'
  | 'sad'
  | 'serious'
  | 'set_or_system'
  | 'suprised'
  | 'think'
  | 'time'
  | 'write'
  | 'yeay';

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

  // States for step 0 greeting sequence (Scene 1, 2, 3, 4)
  const [introScene, setIntroScene] = useState<number>(1);
  const [typedText, setTypedText] = useState<string>('');

  // States for per-step typewriter effect (steps > 0)
  const [typedDesc, setTypedDesc] = useState<string>('');
  const [showDialogue, setShowDialogue] = useState<boolean>(false);
  const [spotlightAllowed, setSpotlightAllowed] = useState<boolean>(false);

  const getMascotSrc = (expression: MascotExpression) => {
    switch (expression) {
      case 'cheer':
        return '/all_images/antigravitybg/maskot/cheer.png';
      case 'congrats':
        return '/all_images/antigravitybg/maskot/congrats.png';
      case 'done':
        return '/all_images/antigravitybg/maskot/done.png';
      case 'goodjob':
        return '/all_images/antigravitybg/maskot/goodjob.png';
      case 'grow':
        return '/all_images/antigravitybg/maskot/grow.png';
      case 'happy':
        return '/all_images/antigravitybg/maskot/happy.png';
      case 'hmmm':
        return '/all_images/antigravitybg/maskot/hmmm.png';
      case 'idea':
        return '/all_images/antigravitybg/maskot/idea.png';
      case 'read':
        return '/all_images/antigravitybg/maskot/read.png';
      case 'sad':
        return '/all_images/antigravitybg/maskot/sad.jpg';
      case 'serious':
        return '/all_images/antigravitybg/maskot/serious.png';
      case 'set_or_system':
        return '/all_images/antigravitybg/maskot/set or sistemeted.png';
      case 'suprised':
        return '/all_images/antigravitybg/maskot/suprised.png';
      case 'think':
        return '/all_images/antigravitybg/maskot/think.png';
      case 'time':
        return '/all_images/antigravitybg/maskot/time.png';
      case 'write':
        return '/all_images/antigravitybg/maskot/write.png';
      case 'yeay':
        return '/all_images/antigravitybg/maskot/yeay.png';
      default:
        return '/all_images/antigravitybg/maskot/happy.png';
    }
  };

  const getIntroExpression = (scene: number): MascotExpression => {
    if (scene === 1) return 'cheer';
    if (scene === 2) return 'happy';
    if (scene === 3) return 'idea';
    return 'yeay';
  };

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
  // spotlightVisible gates whether the spotlight SVG is rendered.
  // We set it to false on every step change so the spotlight fades out
  // before jumping to a new position, then fades back in once the
  // new target element has been measured.
  const [spotlightVisible, setSpotlightVisible] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const updateTimerRef = useRef<number | null>(null);
  const prevStepRef = useRef<number>(-1);

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
      s1_desc: pick({ 'English': 'Double-tap a habit card to mark it as completed for today.', 'Bahasa Indonesia': 'Ketuk dua kali kartu habit untuk menandai kebiasaan ini selesai pada hari ini.', 'Español': 'Toca dos veces la tarjeta de hábito para marcarla como completada hoy.', 'Chinese': '双击习惯卡片，将其标记为今天已完成。', 'Hindi': 'आज के लिए पूरा करने के रूप में चिह्नित करने के लिए हैबिट कार्ड को दो बार टैप करें।', 'Arabic': 'انقر مرتين على بطاقة العادة لتحديدها كمكتملة اليوم.', 'Portuguese': 'Toque duas vezes no cartão de hábito para marcá-lo como concluído hoje.', 'Français': 'Appuyez deux fois sur la carte d\'habitude pour la marquer comme terminée aujourd\'hui.', 'Japanese': '習慣カードをダブルタップして今日完了済みにしましょう。', 'Deutsch': 'Tippe zweimal auf eine Habit-Karte, um sie als heute erledigt zu markieren.' }),
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
      s10_desc: pick({ 'English': 'Tap the Done tab to view completed tasks.', 'Bahasa Indonesia': 'Ketuk tab Done untuk melihat tugas selesai.', 'Español': 'Toca la pestaña Hecho para ver tareas completadas.', 'Chinese': '点击完成选项卡查看已完成的任务。', 'Hindi': 'Done टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب تم لعرض المهام المكتملة.', 'Portuguese': 'Toque na aba Concluído para ver as tarefas concluídas.', 'Français': 'Appuyez sur l\'onglet Terminé pour voir les tâches terminées.', 'Japanese': 'Doneタブをタップして完了したタスクを表示しましょう。', 'Deutsch': 'Tippe auf den Fertig-Tab, um abgeschlossene Aufgaben zu sehen.' }),
      // ── Step 10a ─────────────────────────────────────────────────────────────
      s10a_title: pick({ 'English': 'Completed Tasks List', 'Bahasa Indonesia': 'Daftar Tugas Selesai', 'Español': 'Lista de tareas completadas', 'Chinese': '已完成任务列表', 'Hindi': 'पूर्ण कार्यों की सूची', 'Arabic': 'قائمة المهام المكتملة', 'Portuguese': 'Lista de tarefas concluídas', 'Français': 'Liste des tâches terminées', 'Japanese': '完了したタスクのリスト', 'Deutsch': 'Liste abgeschlossener Aufgaben' }),
      s10a_desc: pick({ 'English': 'Here is your list of completed tasks. You can review everything you have accomplished today.', 'Bahasa Indonesia': 'Di sini adalah daftar tugas yang sudah selesai. Kamu bisa melihat semua riwayat tugasmu yang telah tuntas hari ini.', 'Español': 'Aquí está tu lista de tareas completadas. Puedes revisar todo lo que has logrado hoy.', 'Chinese': '这是你已完成的任务列表。你可以回顾今天完成的所有工作。', 'Hindi': 'यहाँ आपके पूर्ण किए गए कार्यों की सूची है। आप आज जो कुछ भी पूरा कर चुके हैं उसकी समीक्षा कर सकते हैं।', 'Arabic': 'هنا قائمة المهام المكتملة. يمكنك مراجعة كل ما أنجزته اليوم.', 'Portuguese': 'Aqui está sua lista de tarefas concluídas. Você pode revisar tudo o que realizou hoje.', 'Français': 'Voici la liste de vos tâches terminées. Vous pouvez revoir tout ce que vous avez accompli aujourd\'hui.', 'Japanese': '完了したタスクのリストはここです。今日達成したすべてのことを振り返ることができます。', 'Deutsch': 'Hier ist deine Liste abgeschlossener Aufgaben. Du kannst alles überprüfen, was du heute erreicht hast.' }),
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
      // ── Step 30a ─────────────────────────────────────────────────────────────
      s30a_title: pick({ 'English': 'Post Published Successfully!', 'Bahasa Indonesia': 'Postingan Berhasil Dibagikan!', 'Español': '¡Publicación compartida con éxito!', 'Chinese': '帖子发布成功！', 'Hindi': 'पोस्ट सफलतापूर्वक साझा की गई!', 'Arabic': 'تم نشر المنشور بنجاح!', 'Portuguese': 'Publicação compartilhada com sucesso!', 'Français': 'Publication partagée avec succès !', 'Japanese': '投稿が正常に共有されました！', 'Deutsch': 'Beitrag erfolgreich geteilt!' }),
      s30a_desc: pick({ 'English': 'Here it is! Your progress post will appear here in the Global Feed. Everyone in the community can see your path and get inspired by your discipline!', 'Bahasa Indonesia': 'Nah, ini dia! Postingan progresmu akan muncul di sini di Global Feed. Semua orang di komunitas bisa melihat perjuanganmu dan terinspirasi oleh perjalanan disiplinmu!', 'Español': '¡Aquí está! Tu publicación de progreso aparecerá aquí en el feed global. ¡Todos en la comunidad pueden ver tu camino e inspirarse con tu disciplina!', 'Chinese': '就在这里！你的进度帖子将出现在全球动态中。社区中的每个人都能看到你的历程，并被你的纪律所启发！', 'Hindi': 'यह यहाँ है! आपकी प्रगति पोस्ट यहाँ Global Feed में दिखाई देगी। समुदाय का हर कोई आपका मार्ग देख सकता है और आपके अनुशासन से प्रेरित हो सकता है!', 'Arabic': 'ها هو ذا! سيظهر منشور تقدمك هنا في الموجز العالمي. يمكن للجميع في المجتمع رؤية مسارك والاستلهام من انضباطك!', 'Portuguese': 'Aqui está! Sua publicação de progresso aparecerá aqui no Feed Global. Todos na comunidade podem ver seu caminho e se inspirar em sua disciplina!', 'Français': 'Le voilà ! Votre publication de progression apparaîtra ici dans le fil global. Tout le monde dans la communauté peut voir votre parcours et s\'y inspirer !', 'Japanese': 'これです！あなたの進捗投稿はここにグローバルフィードに表示されます。コミュニティの誰もがあなたの歩みを見て、あなたの規律にインスパイアされることができます！', 'Deutsch': 'Hier ist es! Dein Fortschrittsbeitrag wird hier im globalen Feed angezeigt. Jeder in der Community kann deinen Weg sehen und sich von deiner Disziplin inspirieren lassen!' }),
      // ── Step 31 ─────────────────────────────────────────────────────────────
      s31_title: pick({ 'English': 'Support Tools', 'Bahasa Indonesia': 'Alat Pendukung', 'Español': 'Herramientas de apoyo', 'Chinese': '支持工具', 'Hindi': 'सहायता उपकरण', 'Arabic': 'أدوات الدعم', 'Portuguese': 'Ferramentas de suporte', 'Français': 'Outils de soutien', 'Japanese': 'サポートツール', 'Deutsch': 'Support-Tools' }),
      s31_desc: pick({ 'English': 'Tap the Features tab in the bottom navigation bar.', 'Bahasa Indonesia': 'Ketuk tab Features di navigasi bawah.', 'Español': 'Toca la pestaña Features en la barra de navegación inferior.', 'Chinese': '点击底部导航栏中的功能选项卡。', 'Hindi': 'नीचे नेविगेशन बार में Features टैब पर टैप करें।', 'Arabic': 'انقر على علامة تبويب المميزات في شريط التنقل السفلي.', 'Portuguese': 'Toque na aba Features na barra de navegação inferior.', 'Français': 'Appuyez sur l\'onglet Features dans la barre de navigation inférieure.', 'Japanese': '下部ナビゲーションバーのFeaturesタブをタップしましょう。', 'Deutsch': 'Tippe auf den Features-Tab in der unteren Navigationsleiste.' }),
      // ── Step 32 ─────────────────────────────────────────────────────────────
      s32_title: pick({ 'English': 'Focus & Workouts', 'Bahasa Indonesia': 'Fokus & Latihan', 'Español': 'Enfoque y ejercicios', 'Chinese': '专注与训练', 'Hindi': 'फोकस और वर्कआउट', 'Arabic': 'التركيز والتدريبات', 'Portuguese': 'Foco e treinos', 'Français': 'Focus et exercices', 'Japanese': 'フォーカスとワークアウト', 'Deutsch': 'Fokus & Training' }),
      s32_desc: pick({ 'English': 'Use Pomodoro, Workout, or MathRacing to boost your productivity.', 'Bahasa Indonesia': 'Gunakan Pomodoro, Workout, atau MathRacing untuk produktivitas.', 'Español': 'Usa Pomodoro, Workout o MathRacing para aumentar tu productividad.', 'Chinese': '使用Pomodoro、Workout或MathRacing提升你的生产力。', 'Hindi': 'अपनी उत्पादकता बढ़ाने के लिए Pomodoro, Workout, या MathRacing का उपयोग करें।', 'Arabic': 'استخدم Pomodoro أو Workout أو MathRacing لتعزيز إنتاجيتك.', 'Portuguese': 'Use Pomodoro, Workout ou MathRacing para aumentar sua produtividade.', 'Français': 'Utilisez Pomodoro, Workout ou MathRacing pour augmenter votre productivité.', 'Japanese': 'Pomodoro、Workout、またはMathRacingを使って生産性を高めましょう。', 'Deutsch': 'Nutze Pomodoro, Workout oder MathRacing, um deine Produktivität zu steigern.' }),
      // ── Step 33 ─────────────────────────────────────────────────────────────
      s33_title: pick({ 'English': 'Customize Profile', 'Bahasa Indonesia': 'Kustomisasi Profil', 'Español': 'Personalizar perfil', 'Chinese': '自定义个人资料', 'Hindi': 'प्रोफाइल कस्टमाइज़ करें', 'Arabic': 'تخصيص الملف الشخصي', 'Portuguese': 'Personalizar perfil', 'Français': 'Personnaliser le profil', 'Japanese': 'プロフィールをカスタマイズ', 'Deutsch': 'Profil anpassen' }),
      s33_desc: pick({
        'English': 'Tap the Settings icon to open it. Here\'s what you\'ll find inside:\n• Detail Profile — Edit your personal info & stats.\n• Manage Plan — Upgrade or check your membership (Free/Pro).\n• Display Theme — Switch between Light & Dark mode.\n• Time Zone — Set your local time zone.\n• Help & Support — FAQ, feedback & contact us.\n• Start New Program — Reset onboarding & restart journey.\n• Reset Program — Delete all habits, streaks & statistics.',
        'Bahasa Indonesia': 'Ketuk ikon Settings untuk membukanya. Ini yang ada di dalamnya:\n• Detail Profil — Ubah info & statistik pribadimu.\n• Kelola Paket — Upgrade atau cek status keanggotaan (Free/Pro).\n• Tema Tampilan — Ganti antara mode Terang & Gelap.\n• Zona Waktu — Atur zona waktu lokalmu.\n• Bantuan & Dukungan — FAQ, saran, masukan & kontak.\n• Mulai Program Baru — Reset onboarding & mulai ulang perjalanan.\n• Reset Program — Hapus semua habit, streak & statistik.',
        'Español': 'Toca el ícono de Configuración para abrirlo. Esto es lo que encontrarás:\n• Perfil Detallado — Edita tu información personal y estadísticas.\n• Gestionar Plan — Mejora o consulta tu membresía (Free/Pro).\n• Tema Visual — Cambia entre modo Claro y Oscuro.\n• Zona Horaria — Configura tu zona horaria local.\n• Ayuda y Soporte — Preguntas frecuentes, comentarios y contacto.\n• Iniciar Nuevo Programa — Reiniciar el proceso de incorporación.\n• Restablecer Programa — Eliminar todos los hábitos, rachas y estadísticas.',
        'Chinese': '点击设置图标打开。里面有以下内容：\n• 个人资料详情 — 编辑个人信息和统计数据。\n• 管理计划 — 升级或查看会员资格（免费/专业版）。\n• 显示主题 — 在明亮与深色模式之间切换。\n• 时区 — 设置您的本地时区。\n• 帮助与支持 — 常见问题、反馈和联系我们。\n• 开始新计划 — 重置入门流程并重新开始。\n• 重置计划 — 删除所有习惯、连续记录和统计数据。',
        'Hindi': 'Settings आइकन टैप करें। अंदर यह मिलेगा:\n• विवरण प्रोफाइल — व्यक्तिगत जानकारी और आंकड़े संपादित करें।\n• प्लान प्रबंधित करें — सदस्यता अपग्रेड करें (Free/Pro)।\n• डिस्प्ले थीम — Light और Dark मोड के बीच स्विच करें।\n• समय क्षेत्र — अपना स्थानीय समय क्षेत्र सेट करें।\n• सहायता और समर्थन — FAQ, फीडबैक और संपर्क।\n• नया प्रोग्राम शुरू — ऑनबोर्डिंग रीसेट करें।\n• प्रोग्राम रीसेट — सभी आदतें, स्ट्रीक और आँकड़े हटाएं।',
        'Arabic': 'انقر على أيقونة الإعدادات لفتحها. هذا ما ستجده بداخلها:\n• الملف الشخصي التفصيلي — تحرير معلوماتك الشخصية والإحصائيات.\n• إدارة الخطة — ترقية أو التحقق من عضويتك (مجاني/احترافي).\n• سمة العرض — التبديل بين الوضع الفاتح والمظلم.\n• المنطقة الزمنية — تعيين منطقتك الزمنية المحلية.\n• المساعدة والدعم — الأسئلة الشائعة والتغذية الراجعة والتواصل.\n• بدء برنامج جديد — إعادة تعيين الإعداد والبدء من جديد.\n• إعادة تعيين البرنامج — حذف جميع العادات والسلاسل والإحصائيات.',
        'Portuguese': 'Toque no ícone de Configurações para abrir. Isso é o que você encontrará:\n• Perfil Detalhado — Edite suas informações pessoais e estatísticas.\n• Gerenciar Plano — Atualize ou verifique sua assinatura (Free/Pro).\n• Tema de Exibição — Alterne entre o modo Claro e Escuro.\n• Fuso Horário — Configure seu fuso horário local.\n• Ajuda e Suporte — FAQ, feedback e contato.\n• Iniciar Novo Programa — Redefina a integração e reinicie a jornada.\n• Redefinir Programa — Excluir todos os hábitos, sequências e estatísticas.',
        'Français': 'Appuyez sur l\'icône Paramètres pour l\'ouvrir. Voici ce que vous trouverez :\n• Profil Détaillé — Modifiez vos informations personnelles et statistiques.\n• Gérer le Plan — Améliorez ou vérifiez votre abonnement (Free/Pro).\n• Thème d\'affichage — Basculez entre le mode Clair et Sombre.\n• Fuseau Horaire — Définissez votre fuseau horaire local.\n• Aide et Support — FAQ, commentaires et contact.\n• Nouveau Programme — Réinitialisez l\'intégration et recommencez.\n• Réinitialiser le Programme — Supprimer tous les habitudes, séries et statistiques.',
        'Japanese': '設定アイコンをタップして開きます。中に以下があります：\n• 詳細プロフィール — 個人情報と統計を編集。\n• プラン管理 — メンバーシップをアップグレードまたは確認（無料/プロ）。\n• 表示テーマ — ライトとダークモードを切り替え。\n• タイムゾーン — ローカルタイムゾーンを設定。\n• ヘルプとサポート — FAQ、フィードバックとお問い合わせ。\n• 新プログラム開始 — オンボーディングをリセットして再スタート。\n• プログラムリセット — すべての習慣、ストリーク、統計を削除。',
        'Deutsch': 'Tippe auf das Einstellungs-Symbol. Folgendes findest du darin:\n• Profil-Details — Persönliche Daten & Statistiken bearbeiten.\n• Plan verwalten — Mitgliedschaft upgraden oder prüfen (Free/Pro).\n• Anzeigedesign — Zwischen hellem & dunklem Modus wechseln.\n• Zeitzone — Deine lokale Zeitzone einstellen.\n• Hilfe & Support — FAQ, Feedback & Kontakt.\n• Neues Programm starten — Onboarding zurücksetzen & Reise neu beginnen.\n• Programm zurücksetzen — Alle Gewohnheiten, Serien & Statistiken löschen.',
      }),
      // ── Step 34 ─────────────────────────────────────────────────────────────
      s34_title: pick({ 'English': 'You\'re Ready to Begin!', 'Bahasa Indonesia': 'Kamu Siap Memulai!', 'Español': '¡Estás listo para comenzar!', 'Chinese': '你准备好开始了！', 'Hindi': 'आप शुरू करने के लिए तैयार हैं!', 'Arabic': 'أنت مستعد للبدء!', 'Portuguese': 'Você está pronto para começar!', 'Français': 'Vous êtes prêt à commencer !', 'Japanese': 'あなたは始める準備ができています！', 'Deutsch': 'Du bist bereit anzufangen!' }),
      s34_desc: pick({ 'English': 'Tour complete! Have a great time starting your discipline journey in InRising.', 'Bahasa Indonesia': 'Tur selesai! Selamat memulai perjalanan disiplinmu di InRising.', 'Español': '¡Tour completo! Que tengas un buen tiempo comenzando tu viaje de disciplina en InRising.', 'Chinese': '导览完成！祝你在InRising开始纪律之旅愉快。', 'Hindi': 'दौरा पूरा हुआ! InRising में अपनी अनुशासन यात्रा शुरू करने का अच्छा समय आपका इंतजार कर रहा है।', 'Arabic': 'اكتملت الجولة! استمتع ببدء رحلة انضباطك في InRising.', 'Portuguese': 'Tour completo! Aproveite para começar sua jornada de disciplina no InRising.', 'Français': 'Tour terminé ! Profitez de votre voyage de discipline dans InRising.', 'Japanese': 'ツアー完了！InRisingでの規律の旅を楽しんでください。', 'Deutsch': 'Tour abgeschlossen! Viel Spaß beim Start deiner Disziplinreise in InRising.' }),
      s34_action: pick({ 'English': 'Finish', 'Bahasa Indonesia': 'Selesaikan', 'Español': 'Finalizar', 'Chinese': '完成', 'Hindi': 'समाप्त करें', 'Arabic': 'إنهاء', 'Portuguese': 'Concluir', 'Français': 'Terminer', 'Japanese': '完了', 'Deutsch': 'Beenden' }),
      // ── Shared ──────────────────────────────────────────────────────────────
      next: pick({ 'English': 'Next', 'Bahasa Indonesia': 'Lanjut', 'Español': 'Siguiente', 'Chinese': '下一步', 'Hindi': 'अगला', 'Arabic': 'التالي', 'Portuguese': 'Próximo', 'Français': 'Suivant', 'Japanese': '次へ', 'Deutsch': 'Weiter' }),
      // ── Tools ──────────────────────────────────────────────────────────────
      tool_cal_title: pick({ 'English': 'Calorie Tracker', 'Bahasa Indonesia': 'Pelacak Kalori' }),
      tool_cal_desc: pick({ 'English': 'Track your daily food intake, log meals, and monitor your calories to stay fit.', 'Bahasa Indonesia': 'Catat asupan makanan harian, pantau konsumsi nutrisi, dan jaga berat badan idealmu.' }),
      tool_pomo_title: pick({ 'English': 'Pomodoro Focus Timer', 'Bahasa Indonesia': 'Timer Pomodoro' }),
      tool_pomo_desc: pick({ 'English': 'Use focus sessions with ambient lo-fi soundscapes to work and study with maximum efficiency.', 'Bahasa Indonesia': 'Gunakan sesi fokus berwaktu yang diiringi musik lo-fi tenang untuk belajar dan bekerja dengan produktif.' }),
      tool_work_title: pick({ 'English': 'Workout Rep Counter', 'Bahasa Indonesia': 'Workout Counter' }),
      tool_work_desc: pick({ 'English': 'Keep count of your fitness repetitions (pushups, squats) automatically.', 'Bahasa Indonesia': 'Hitung repetisi latihan fisikmu (seperti push-up atau squat) secara otomatis.' }),
      tool_breath_title: pick({ 'English': 'Deep Breathing Guide', 'Bahasa Indonesia': 'Deep Breathing' }),
      tool_breath_desc: pick({ 'English': 'Calm your heart, reduce anxiety, and clear your mind with interactive breathing guides.', 'Bahasa Indonesia': 'Tenangkan pikiran, kurangi stres, dan kembalikan fokusmu lewat panduan pernapasan interaktif.' }),
      tool_books_title: pick({ 'English': 'Library & Summaries', 'Bahasa Indonesia': 'Ringkasan Buku' }),
      tool_books_desc: pick({ 'English': 'Access bite-sized key summaries of world-class self-development and habit building books.', 'Bahasa Indonesia': 'Baca intisari dan ringkasan penting dari buku-buku pengembangan diri terbaik di dunia.' }),
      tool_math_title: pick({ 'English': 'Math Racing Game', 'Bahasa Indonesia': 'Math Racing' }),
      tool_math_desc: pick({ 'English': 'Boost your brain speed and focus by solving rapid arithmetic quizzes under time pressure.', 'Bahasa Indonesia': 'Latih kecepatan berpikir otakmu lewat permainan kuis matematika cepat berpacu dengan waktu.' }),
    };
  }, [language, programDuration]);

  const introTexts = useMemo(() => {
    const descParts = L.s0_desc.split('\n');
    return [
      L.s0_title,
      descParts[0] || 'Selamat datang di InRising!',
      descParts[1] || `Ikuti petualangan singkat untuk menguasai fitur program ${programDuration} hari pilihanmu.`
    ];
  }, [L, programDuration]);

  // Typewriter effect for step 0 (intro scenes 1, 2, 3)
  useEffect(() => {
    if (currentStep !== 0 || completed) return;
    if (introScene > 3) return;

    const fullText = introTexts[introScene - 1];
    setTypedText('');
    let currentIndex = 0;
    
    const timer = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(timer);
        // Auto transition to next scene after 3.5 seconds
        const transitionTimeout = setTimeout(() => {
          setIntroScene(prev => prev + 1);
        }, 3500);
        return () => clearTimeout(transitionTimeout);
      }
    }, 55);

    return () => clearInterval(timer);
  }, [currentStep, introScene, introTexts, completed]);

  const handleIntroCardClick = () => {
    if (currentStep !== 0) return;
    if (introScene > 3) return;

    const fullText = introTexts[introScene - 1];
    if (typedText.length < fullText.length) {
      // Skip typing
      setTypedText(fullText);
    } else {
      // Advance immediately
      setIntroScene(prev => prev + 1);
    }
  };

  // Typewriter effect for steps > 0
  useEffect(() => {
    if (currentStep === 0 || completed) return;
    const fullDesc = currentStepData?.desc || '';

    // Reset state on step change
    setShowDialogue(false);
    setTypedDesc('');

    // Wait 2000ms for spotlight to stabilize, then show dialogue + start typing
    const delayTimer = setTimeout(() => {
      setShowDialogue(true);
      let idx = 0;
      const typeTimer = setInterval(() => {
        if (idx < fullDesc.length) {
          setTypedDesc(fullDesc.substring(0, idx + 1));
          idx++;
        } else {
          clearInterval(typeTimer);
        }
      }, 22);
      return () => clearInterval(typeTimer);
    }, 2000);

    return () => clearTimeout(delayTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, completed]);

  // Skip typing on dialogue tap (steps > 0)
  const handleDialogueTap = () => {
    if (currentStep === 0) return;
    const fullDesc = currentStepData?.desc || '';
    if (typedDesc.length < fullDesc.length) {
      setTypedDesc(fullDesc);
    }
  };

  const steps: Step[] = useMemo(() => [
    // 0. Intro
    {
      selector: null,
      title: L.s0_title,
      desc: L.s0_desc,
      expression: 'cheer',
      actionText: L.s0_action,
      tab: 'habits',
    },
    // 1. Add Habit FAB
    {
      selector: '#add-habit-fab',
      title: L.s2_title,
      desc: L.s2_desc,
      expression: 'idea',
      tab: 'habits',
    },
    // 2. Select Drink Water preset
    {
      selector: '#habit-pick-drink-water',
      title: L.s3_title,
      desc: L.s3_desc,
      expression: 'happy',
      tab: 'habits',
    },
    // 3. Open Intensity Picker
    {
      selector: '#habit-config-intensity-btn',
      title: L.s4_title,
      desc: L.s4_desc,
      expression: 'set_or_system',
      tab: 'habits',
    },
    // 4. Done in Intensity Picker
    {
      selector: '#habit-config-intensity-modal',
      clickTarget: '#habit-config-intensity-done-btn',
      title: L.s5_title,
      desc: L.s5_desc,
      expression: 'done',
      tab: 'habits',
    },
    // 5. Save Habit
    {
      selector: '#habit-config-modal',
      clickTarget: '#habit-config-save-btn',
      title: L.s6_title,
      desc: L.s6_desc,
      expression: 'congrats',
      tab: 'habits',
    },
    // 6. Habit Card Double Click
    {
      selector: '#first-habit-card',
      title: L.s1_title,
      desc: L.s1_desc,
      expression: 'goodjob',
      tab: 'habits',
    },
    // 7. Navigate to To-Do tab
    {
      selector: '#nav-todo',
      title: L.s7_title,
      desc: L.s7_desc,
      expression: 'grow',
      expectedTab: 'todo',
      tab: 'habits',
    },
    // 8. To-Do Intro & Quick Add
    {
      selector: '#todo-quick-add',
      clickTarget: '#todo-quick-add-submit-btn',
      title: L.s8_title,
      desc: L.s8_desc,
      expression: 'write',
      tab: 'todo',
    },
    // 9. Check To-Do
    {
      selector: '#todo-checkbox-item',
      title: L.s9_title,
      desc: L.s9_desc,
      expression: 'done',
      tab: 'todo',
    },
    // 10. Completed Tab To-Do
    {
      selector: '#todo-tab-done',
      title: L.s10_title,
      desc: L.s10_desc,
      expression: 'yeay',
      tab: 'todo',
    },
    // 10a. Completed Tasks List Spotlight
    {
      selector: '#completed-todo-item',
      title: L.s10a_title,
      desc: L.s10a_desc,
      expression: 'congrats',
      actionText: L.next,
      tab: 'todo',
    },
    // 11. Navigate to Analytics tab
    {
      selector: '#nav-analytics',
      title: L.s11_title,
      desc: L.s11_desc,
      expression: 'grow',
      expectedTab: 'analytics',
      tab: 'todo',
    },
    // 12. Drink Water Analytics Detail
    {
      selector: '#analytics-drink-water-card',
      title: L.s12_title,
      desc: L.s12_desc,
      expression: 'serious',
      tab: 'analytics',
    },
    // 13. Weekly Chart Explanation
    {
      selector: '#habit-analytics-weekly-chart',
      title: L.s13_title,
      desc: L.s13_desc,
      expression: 'grow',
      actionText: L.next,
      tab: 'analytics',
    },
    // 14. Monthly Record Explanation
    {
      selector: '#habit-analytics-monthly-record',
      title: L.s14_title,
      desc: L.s14_desc,
      expression: 'think',
      actionText: L.next,
      tab: 'analytics',
    },
    // 15. Stats RPG Tab Navigation
    {
      selector: '#analytics-tab-stats',
      title: L.s15_title,
      desc: L.s15_desc,
      expression: 'idea',
      tab: 'analytics',
    },
    // 15a. RPG Stats Explanation
    {
      selector: '#analytics-rpg-stats-container',
      title: L.s16_title,
      desc: L.s16_desc,
      expression: 'goodjob',
      actionText: L.next,
      tab: 'analytics',
    },
    // 16. Activity Recap Tab Navigation
    {
      selector: '#analytics-tab-recap',
      title: L.s17_title,
      desc: L.s17_desc,
      expression: 'time',
      tab: 'analytics',
    },
    // 16a. Activity Recap Explanation
    {
      selector: '#analytics-activity-recap-container',
      title: L.s18_title,
      desc: L.s18_desc,
      expression: 'read',
      actionText: L.next,
      tab: 'analytics',
    },
    // 17. Navigate to Journey tab
    {
      selector: '#nav-journey',
      title: L.s19_title,
      desc: L.s19_desc,
      expression: 'happy',
      expectedTab: 'journey',
      tab: 'analytics',
    },
    // Journey intro
    {
      selector: '#journey-today-card',
      title: L.s20_title,
      desc: L.s20_desc,
      expression: 'write',
      actionText: L.next,
      tab: 'journey',
    },
    // Journey - Mood
    {
      selector: '#journey-mood-box',
      title: L.s21_title,
      desc: L.s21_desc,
      expression: 'hmmm',
      actionText: L.next,
      tab: 'journey',
    },
    // Journey - Abadikan Momen (Media)
    {
      selector: '#journey-media-btn',
      title: L.s22_title,
      desc: L.s22_desc,
      expression: 'yeay',
      actionText: L.next,
      tab: 'journey',
    },
    // Journey - Jurnal / Note
    {
      selector: '#journey-write-btn',
      title: L.s23_title,
      desc: L.s23_desc,
      expression: 'write',
      actionText: L.next,
      tab: 'journey',
    },
    // 18. Navigate to Global tab
    {
      selector: '#nav-global',
      title: L.s24_title,
      desc: L.s24_desc,
      expression: 'cheer',
      expectedTab: 'global',
      tab: 'journey',
    },
    // Global Feed Explanation
    {
      selector: '.flex-1.overflow-y-auto.py-4.no-scrollbar',
      title: L.s25_title,
      desc: L.s25_desc,
      expression: 'happy',
      actionText: L.next,
      tab: 'global',
    },
    // Global Feed FAB button
    {
      selector: '#global-fab',
      title: L.s26_title,
      desc: L.s26_desc,
      expression: 'idea',
      tab: 'global',
    },
    // Habit Picker inside post modal
    {
      selector: '#post-habit-picker-container',
      clickTarget: '.post-habit-option-btn',
      title: L.s27_title,
      desc: L.s27_desc,
      expression: 'set_or_system',
      tab: 'global',
    },
    // Photo Upload inside post modal
    {
      selector: '#post-media-area',
      title: L.s28_title,
      desc: L.s28_desc,
      expression: 'yeay',
      actionText: L.next,
      tab: 'global',
    },
    // Caption Input inside post modal
    {
      selector: '#post-caption-input',
      title: L.s29_title,
      desc: L.s29_desc,
      expression: 'write',
      actionText: L.next,
      tab: 'global',
    },
    // Share Post inside post modal
    {
      selector: '#post-share-btn',
      title: L.s30_title,
      desc: L.s30_desc,
      expression: 'goodjob',
      tab: 'global',
    },
    // 18a. Post Published Confirmation Spotlight on Feed list
    {
      selector: '.flex-1.overflow-y-auto.py-4.no-scrollbar',
      title: L.s30a_title,
      desc: L.s30a_desc,
      expression: 'congrats',
      actionText: L.next,
      tab: 'global',
    },
    // 19. Navigate to Features tab
    {
      selector: '#nav-features',
      title: L.s31_title,
      desc: L.s31_desc,
      expression: 'happy',
      expectedTab: 'features',
      tab: 'global',
    },
    // 20. Features Hub - Calorie Tracker
    {
      selector: '#nutrition',
      title: L.tool_cal_title,
      desc: L.tool_cal_desc,
      expression: 'serious',
      actionText: L.next,
      tab: 'features',
    },
    // 20b. Features Hub - Pomodoro Timer
    {
      selector: '#pomodoro',
      title: L.tool_pomo_title,
      desc: L.tool_pomo_desc,
      expression: 'time',
      actionText: L.next,
      tab: 'features',
    },
    // 20c. Features Hub - Workout Counter
    {
      selector: '#workout',
      title: L.tool_work_title,
      desc: L.tool_work_desc,
      expression: 'grow',
      actionText: L.next,
      tab: 'features',
    },
    // 20d. Features Hub - Deep Breathing
    {
      selector: '#breathing',
      title: L.tool_breath_title,
      desc: L.tool_breath_desc,
      expression: 'happy',
      actionText: L.next,
      tab: 'features',
    },
    // 20e. Features Hub - Book Summaries
    {
      selector: '#books',
      title: L.tool_books_title,
      desc: L.tool_books_desc,
      expression: 'read',
      actionText: L.next,
      tab: 'features',
    },
    // 20f. Features Hub - Math Racing
    {
      selector: '#mathican',
      title: L.tool_math_title,
      desc: L.tool_math_desc,
      expression: 'idea',
      actionText: L.next,
      tab: 'features',
    },
    // 21. Settings Overlay
    {
      selector: '#settings-toggle-btn',
      title: L.s33_title,
      desc: L.s33_desc,
      expression: 'set_or_system',
      tab: 'habits',
    },
    // 22. End of Tour
    {
      selector: null,
      title: L.s34_title,
      desc: L.s34_desc,
      expression: 'congrats',
      actionText: L.s34_action,
      tab: 'habits',
    },
  ], [L]);

  const currentStepData = steps[currentStep];

  // Recalculate spotlight rect on step/tab change.
  // On each step change we hide the spotlight first (to avoid a flash at the
  // old position), wait 250 ms for page transitions to settle, then find the
  // target element and fade the spotlight back in.
  // Recalculate spotlight rect on step/tab change in real-time.
  // We use a requestAnimationFrame loop to continuously track the target element's position,
  // ensuring the spotlight follows any layout animations, page transitions, modal sheet slide-ins,
  // keyboard toggles, and scrolling smoothly without any delay or glitches.
  useEffect(() => {
    const isNewStep = prevStepRef.current !== currentStep;
    if (isNewStep) {
      prevStepRef.current = currentStep;
      // Temporarily hide the spotlight on step transition to prevent flashing/jumping
      setSpotlightVisible(false);
      setSpotlightAllowed(false);
      setTargetRect(null);
    }

    const selector = currentStepData?.selector;
    if (!selector) {
      setTargetRect(null);
      setSpotlightVisible(false);
      setSpotlightAllowed(false);
      return;
    }

    // Wait 350ms for page layout, scrolling, and tab changes to settle before allowing the spotlight to show
    const delayTimer = setTimeout(() => {
      setSpotlightAllowed(true);
    }, 350);

    let animFrameId: number;

    const trackElement = () => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect((prev) => {
          if (
            !prev ||
            prev.top !== r.top ||
            prev.bottom !== r.bottom ||
            prev.left !== r.left ||
            prev.right !== r.right ||
            prev.width !== r.width ||
            prev.height !== r.height
          ) {
            return r;
          }
          return prev;
        });
      } else {
        // Target element is not in DOM yet
        setTargetRect(null);
      }
      animFrameId = requestAnimationFrame(trackElement);
    };

    animFrameId = requestAnimationFrame(trackElement);

    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(delayTimer);
    };
  }, [currentStep, currentStepData, activeTab]);

  // Handle actual visibility of the spotlight with a clean effect
  useEffect(() => {
    setSpotlightVisible(spotlightAllowed && targetRect !== null);
  }, [spotlightAllowed, targetRect]);

  // Auto advance if the user performs the target tab switch action
  useEffect(() => {
    if (currentStep < maxStep) return;
    if (currentStepData?.expectedTab === activeTab) {
      const nextStep = steps[currentStep + 1];
      const targetSelector = nextStep?.selector;

      if (targetSelector) {
        const checkInterval = setInterval(() => {
          if (document.querySelector(targetSelector)) {
            clearInterval(checkInterval);
            handleNext();
          }
        }, 20);

        const fallbackTimeout = setTimeout(() => {
          clearInterval(checkInterval);
          handleNext();
        }, 600);

        return () => {
          clearInterval(checkInterval);
          clearTimeout(fallbackTimeout);
        };
      } else {
        handleNext();
      }
    }
  }, [activeTab, currentStep, maxStep]);

  // Special listener for custom clicks on the highlighted target elements to auto-advance
  useEffect(() => {
    if (currentStep < maxStep) return;
    const targetSelector = currentStepData?.clickTarget || currentStepData?.selector;
    if (!targetSelector || currentStepData.actionText) return;
    if (currentStepData?.selector === '#first-habit-card') return; // Exclude double-tap card from single-click listener
    if (currentStepData?.selector === '#add-habit-fab') return; // Handled by checkStateAndAdvance auto-check
    if (currentStepData?.selector === '#analytics-drink-water-card') return; // Handled by checkStateAndAdvance auto-check
    if (currentStepData?.expectedTab) return; // Handled by activeTab switch listener

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

  // Listen for habit completions to advance the double-click step
  useEffect(() => {
    if (currentStepData?.selector !== '#first-habit-card') return;

    let active = true;
    const unsubscribe = useHabitStore.subscribe((state) => {
      // Check specifically if the Drink Water habit is completed
      const isDrinkWaterCompleted = state.habits.some(
        (h: any) => (h.name === 'Drink Water' || h.name === 'Hidrasi Harian') && h.completed
      );
      if (isDrinkWaterCompleted && active) {
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
  }, [currentStep, currentStepData]);

  // Auto-advance if the DOM state reflects that the user has already navigated to the next phase
  useEffect(() => {
    if (currentStep < maxStep) return;
    const checkStateAndAdvance = () => {
      // 1. If we are on the Add Habit FAB step
      // and the Add Habit screen/modal is open (which has #habit-pick-drink-water)
      if (currentStepData?.selector === '#add-habit-fab' && document.getElementById('habit-pick-drink-water')) {
        handleNext();
        return;
      }

      // 2. If we are on the Intensity Picker step
      // and the intensity picker is closed (meaning #habit-config-intensity-modal is gone, but we are still in config modal #habit-config-save-btn)
      if (currentStepData?.selector === '#habit-config-intensity-modal' && !document.getElementById('habit-config-intensity-modal') && document.getElementById('habit-config-save-btn')) {
        handleNext();
        return;
      }

      // 3. If we are on the Save Habit step
      // and the config modal is closed (meaning #habit-config-modal is gone)
      if (currentStepData?.selector === '#habit-config-modal' && !document.getElementById('habit-config-modal')) {
        handleNext();
        return;
      }

      // 4. If we are on the Analytics Drink Water Card click step
      // and the details page is open (meaning #habit-analytics-weekly-chart is visible)
      if (currentStepData?.selector === '#analytics-drink-water-card' && document.getElementById('habit-analytics-weekly-chart')) {
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

  // Scroll target element into view automatically when step changes
  useEffect(() => {
    const sel = currentStepData?.selector;
    if (sel) {
      const timeout = setTimeout(() => {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, currentStepData]);

  // Spotlight padding for breathing room.
  // Only compute sr when both targetRect is set AND spotlightVisible is true
  // so the SVG is not rendered until the position is confirmed.
  const pad = 8;
  const sr = (targetRect && spotlightVisible) ? {
    top: Math.max(0, targetRect.top - pad),
    bottom: Math.min(window.innerHeight, targetRect.bottom + pad),
    left: Math.max(0, targetRect.left - pad),
    right: Math.min(window.innerWidth, targetRect.right + pad),
    height: targetRect.height + pad * 2,
    width: targetRect.width + pad * 2,
  } : null;

  // Shared spring config — smooth movement without bouncing
  const spotlightSpring = { type: 'spring' as const, stiffness: 120, damping: 28, mass: 0.8 };

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

  // Arrow positioning path
  const arrowPath = useMemo(() => {
    if (!sr || !hasValidSpace) return null;
    return dialogueInTop ? "M12 4v24M6 20l6 8 6-8" : "M12 28V4M6 12l6-8 6 8";
  }, [sr, dialogueInTop, hasValidSpace]);

  // Pre-emptively disable pointer-events on mousedown/touchstart inside the spotlight
  // so the browser sends native touch/click events directly to the target element.
  const handleBackdropPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sr) return;

    // Get touch/mouse coordinates safely
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const insideX = clientX >= sr.left - 15 && clientX <= sr.right + 15;
    const insideY = clientY >= sr.top - 15 && clientY <= sr.bottom + 15;

    if (insideX && insideY) {
      const svg = e.currentTarget as HTMLElement;
      svg.style.pointerEvents = 'none';

      // Restore pointer events after 350ms to cover the entire touch-to-click duration
      setTimeout(() => {
        svg.style.pointerEvents = 'auto';
      }, 350);
    } else {
      // Outside spotlight: prevent defaults to block interaction
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Intercept backdrop clicks and pass them through only if inside the spotlight hole (as a fallback)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!sr) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    const insideX = clientX >= sr.left - 15 && clientX <= sr.right + 15;
    const insideY = clientY >= sr.top - 15 && clientY <= sr.bottom + 15;

    if (insideX && insideY) {
      // Temporarily disable pointer-events on the SVG to find the element underneath
      const svg = e.currentTarget as HTMLElement;
      const prevPointerEvents = svg.style.pointerEvents;
      svg.style.pointerEvents = 'none';
      
      const underlyingElement = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      svg.style.pointerEvents = prevPointerEvents;

      if (underlyingElement) {
        // Find nearest interactive ancestor (BUTTON, A, role="button", or cursor-pointer)
        let clickTarget: HTMLElement | null = underlyingElement;
        while (clickTarget && clickTarget !== document.body) {
          if (
            clickTarget.tagName === 'BUTTON' || 
            clickTarget.tagName === 'A' || 
            clickTarget.onclick || 
            clickTarget.getAttribute('role') === 'button' ||
            clickTarget.classList.contains('cursor-pointer')
          ) {
            break;
          }
          clickTarget = clickTarget.parentElement;
        }

        const finalTarget = clickTarget || underlyingElement;
        finalTarget.click();
        if (typeof finalTarget.focus === 'function') {
          finalTarget.focus();
        }
      }
    } else {
      // Click is outside - block it
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (completed) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] pointer-events-none select-none">
      {/* Animated Arrow pointing at spotlight target.
           Uses AnimatePresence + a step-keyed key so it cleanly fades
           in/out on each step transition instead of snapping. */}
      <AnimatePresence>
        {arrowPath && sr && (
          <motion.div
            key={`arrow-${currentStep}`}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: dialogueInTop ? sr.top - 40 : sr.bottom + 8,
              x: sr.left + sr.width / 2 - 12,
            }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ ...spotlightSpring, opacity: { duration: 0.2 } }}
            className={`absolute z-[1000000] pointer-events-none ${isLight ? 'text-[#6ED7A0]' : 'text-[#6ED7A0]'} drop-shadow-[0_2px_8px_rgba(0,255,133,0.3)]`}
          >
            <motion.svg
              width="24"
              height="32"
              viewBox="0 0 24 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d={arrowPath} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG spotlight with AnimatePresence for clean fade-in/out transitions.
           'sr' is only truthy once the element is confirmed on screen, so there
           is no more flash at position (0,0) at the start of a step. */}
      <AnimatePresence>
        {sr ? (
          <motion.svg
            key="spotlight-svg"
            className="absolute inset-0 w-full h-full cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleBackdropClick}
            onMouseDown={handleBackdropPress}
            onTouchStart={handleBackdropPress}
            style={{ pointerEvents: 'auto' }}
          >
            <defs>
              <mask id="spotlight-mask">
                {/* White cover keeps backdrop visible everywhere */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Black animated rounded-rect = transparent hole in the overlay */}
                <motion.rect
                  animate={{
                    x: sr.left,
                    y: sr.top,
                    width: sr.width,
                    height: sr.height,
                  }}
                  transition={spotlightSpring}
                  rx="16"
                  fill="black"
                />
              </mask>
              <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="6"
                  floodColor={isLight ? '#6ED7A0' : '#6ED7A0'}
                  floodOpacity={isLight ? '0.45' : '0.65'}
                />
              </filter>
            </defs>

            {/* Dark overlay with spotlight hole */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={isLight ? 'rgba(0, 0, 0, 0.78)' : 'rgba(0, 0, 0, 0.90)'}
              mask="url(#spotlight-mask)"
              className="pointer-events-none"
            />

            {/* Green border outline */}
            <motion.rect
              animate={{
                x: sr.left,
                y: sr.top,
                width: sr.width,
                height: sr.height,
              }}
              transition={spotlightSpring}
              rx="16"
              stroke={isLight ? '#6ED7A0' : '#6ED7A0'}
              strokeWidth="2.5"
              fill="none"
              filter="url(#glow-filter)"
              className="pointer-events-none"
            />

            {/* Pulsing outer ring */}
            <motion.rect
              animate={{
                x: sr.left - 3,
                y: sr.top - 3,
                width: sr.width + 6,
                height: sr.height + 6,
                opacity: [0.35, 0.08, 0.35],
              }}
              transition={{
                x: spotlightSpring,
                y: spotlightSpring,
                width: spotlightSpring,
                height: spotlightSpring,
                opacity: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              }}
              rx="19"
              stroke={isLight ? '#6ED7A0' : '#6ED7A0'}
              strokeWidth="1.5"
              fill="none"
              className="pointer-events-none"
            />
          </motion.svg>
        ) : (
          /* Full backdrop for welcome / outro steps with no selector */
          <motion.div
            key="full-backdrop"
            className={`absolute inset-0 ${isLight ? 'bg-black/75' : 'bg-black/90'} pointer-events-auto`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      {/* Main Dialogue Box */}
      <div 
        className="absolute w-full px-6 pointer-events-auto mb-8"
        style={{
          top: dialogueTop,
          bottom: dialogueBottom,
        }}
      >
        <AnimatePresence mode="wait">
          <AnimatePresence>
          {(currentStep === 0 || showDialogue) && (
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            onClick={currentStep > 0 ? handleDialogueTap : undefined}
            className={`w-full mx-auto flex flex-col relative select-text transition-all duration-300 overflow-visible cursor-pointer ${
              currentStep === 0 
                ? 'max-w-[340px] bg-transparent shadow-none border-0'
                : `max-w-[580px] border rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${isLight ? 'bg-[#ffffff] border-black/5' : 'bg-[#252830] border-white/[0.08]'}`
            }`}
          >

            {/* Dialogue Content */}
            <div 
              className={`flex flex-col relative transition-all duration-300 ${
                currentStep === 0 ? 'p-0' : 'pt-6 pb-5 px-6'
              }`}
            >
              {currentStep === 0 ? (
                // Speech bubble layout: bubble top (with down tail), mascot middle, button bottom
                <div className="flex flex-col items-center gap-4 w-full">
                  
                  {/* Speech bubble on top */}
                  <div
                    onClick={handleIntroCardClick}
                    className={`relative w-full rounded-2xl px-4 py-3 cursor-pointer ${
                      isLight
                        ? 'bg-white border border-black/8 shadow-[0_4px_24px_rgba(0,0,0,0.12)]'
                        : 'bg-[#252830] border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.35)]'
                    }`}
                  >
                    {/* Bubble tail pointing down toward mascot */}
                    <div
                      className="absolute -bottom-[8px] left-1/2 -translate-x-1/2"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: `8px solid ${isLight ? 'white' : '#252830'}`,
                      }}
                    />

                    {introScene <= 3 ? (
                      /* Typing Scene */
                      <p
                        style={{ color: isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)' }}
                        className="text-[17px] font-semibold leading-relaxed font-['Outfit'] min-h-[60px] text-center"
                      >
                        {typedText}
                      </p>
                    ) : (
                      /* Scene 4 — Instructional text */
                      <p
                        style={{ color: isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)' }}
                        className="text-[16px] font-semibold leading-snug font-['Outfit'] text-center py-2"
                      >
                        Tekan tombol mulai petualangan 👇
                      </p>
                    )}
                  </div>

                  {/* Mascot floating in the middle */}
                  <motion.div
                    className="w-[150px] h-[150px] flex-shrink-0"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img
                      src={getMascotSrc(getIntroExpression(introScene))}
                      alt="Rise Mascot"
                      className="w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)]"
                    />
                  </motion.div>

                  {/* Scene 4 — CTA button outside bubble */}
                  {introScene > 3 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      className={`px-8 py-3 rounded-xl border font-black uppercase text-[11px] tracking-widest transition-all font-['Outfit'] shadow-[0_4px_14px_rgba(110,215,160,0.4)] ${
                        isLight
                          ? 'bg-[#6ED7A0] border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                          : 'bg-[#6ED7A0] border-transparent text-black'
                      }`}
                    >
                      {L.s0_action}
                    </motion.button>
                  )}
                </div>
              ) : (
                // Other steps (Step > 0)
                <div className="flex flex-col items-center text-center relative w-full pt-2">
                  {/* Mascot — small icon in the top right corner, seeable */}
                  <motion.div
                    className="absolute -top-22 -right-14 w-[120px] h-[120px] z-20 pointer-events-none"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img 
                      src={getMascotSrc(currentStepData.expression)} 
                      alt="Rise" 
                      className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]" 
                    />
                  </motion.div>
                  <div className="w-full">
                    {/* Step Title */}
                    <h4 
                      style={{ color: isLight ? '#000000' : '#ffffff' }}
                      className="text-[15px] font-black font-['Outfit'] tracking-tight mb-2 pr-28 text-left"
                    >
                      {currentStepData.title}
                    </h4>

                     {/* Step Description — typewriter */}
                     <p 
                       style={{ color: isLight ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.7)' }}
                       className="text-[13px] font-normal leading-relaxed font-['Outfit'] whitespace-pre-line text-left"
                     >
                       {typedDesc.replace(/\.(?= )/g, '.\n')}
                       {/* Blinking cursor while typing */}
                       {typedDesc.length < (currentStepData.desc || '').length && (
                         <motion.span
                           animate={{ opacity: [1, 0, 1] }}
                           transition={{ duration: 0.7, repeat: Infinity }}
                           className="inline-block w-[2px] h-[13px] bg-current align-middle ml-[1px]"
                         />
                       )}
                     </p>

                    {/* Action buttons footer for step > 0 */}
                    {currentStepData.actionText && (
                      <div className="flex items-center justify-center mt-4">
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={handleNext}
                          className={`px-5 py-2.5 rounded-xl border font-black uppercase text-[11px] tracking-wider transition-all font-['Outfit'] ${
                            isLight 
                              ? 'bg-[#6ED7A0] border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none' 
                              : 'bg-[#6ED7A0] border-transparent text-black'
                          }`}
                        >
                          {currentStepData.actionText}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          )}
          </AnimatePresence>
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};
