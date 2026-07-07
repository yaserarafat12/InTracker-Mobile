import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import { useProgressionStore } from '../store/useProgressionStore';
import { useHabitStore } from '../store/useHabitStore';
import { getDefaultHabitStatsMap } from '../engines/statsEngine';
import { getHabitBenefitData } from '../data/habitBenefitsData';

const STAT_DISPLAY: Record<string, { key: string; icon: string; color: string }> = {
  kebijaksanaan: { key: 'rpg.stats.wisdom', icon: 'ph:brain-bold', color: '#A855F7' },
  kepercayaanDiri: { key: 'rpg.stats.confidence', icon: 'ph:crown-bold', color: '#10B981' },
  kekuatan: { key: 'rpg.stats.strength', icon: 'ph:lightning-bold', color: '#FF4D00' },
  disiplin: { key: 'rpg.stats.discipline', icon: 'ph:sword-bold', color: '#3B82F6' },
  fokus: { key: 'rpg.stats.focus', icon: 'ph:crosshair-bold', color: '#F59E0B' },
};

const CUBIC_BEZIER = "easeOut" as const;

// --- COMPONENT: CINEMATIC BUTTON ---
const CinematicButton = ({ onClick, children, className = "", disabled = false }: { onClick: () => void, children: React.ReactNode, className?: string, disabled?: boolean }) => {
  return (
    <motion.button
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
      className={`group relative overflow-hidden rounded-xl py-3 px-8 border-[2px] border-black transition-all ${
        disabled 
        ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed' 
        : 'bg-[#10B981] shadow-[5px_5px_0px_rgba(0,0,0,1)] active:scale-[0.98] active:shadow-none'
      } ${className}`}
    >
      <div className={`absolute inset-0 bg-[#0F1110]/10 ${disabled ? '' : 'group-hover:bg-transparent'} transition-colors`} />
      <span className={`relative z-10 font-['Outfit'] text-[15px] font-black tracking-wide ${disabled ? 'text-neutral-500' : 'text-[#050A07]'}`}>
        {children}
      </span>
    </motion.button>
  );
};

// Countries list
// Countries list
const COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

const LANGUAGES_MAP = [
  { name: 'English', flagIcon: 'circle-flags:us', sub: 'English' },
  { name: 'Bahasa Indonesia', flagIcon: 'circle-flags:id', sub: 'Bahasa Indonesia' },
  { name: 'Japanese', flagIcon: 'circle-flags:jp', sub: '日本語' },
  { name: 'Français', flagIcon: 'circle-flags:fr', sub: 'Français' },
  { name: 'Deutsch', flagIcon: 'circle-flags:de', sub: 'Deutsch' },
  { name: 'Español', flagIcon: 'circle-flags:es', sub: 'Español' },
  { name: 'Portuguese', flagIcon: 'circle-flags:pt', sub: 'Português' },
  { name: 'Chinese', flagIcon: 'circle-flags:cn', sub: '中文' },
  { name: 'Hindi', flagIcon: 'circle-flags:in', sub: 'हिन्दी' },
  { name: 'Arabic', flagIcon: 'circle-flags:sa', sub: 'العربية' },
];

const getPreferencesTranslation = (lang: string) => {
  switch (lang) {
    case 'Bahasa Indonesia':
      return {
        title: 'Preferensi Aplikasi',
        subtitle: 'Pilih bahasa dan tema untuk memulai program Anda',
        themeLabel: 'Tema Tampilan',
        lightMode: 'Terang',
        darkMode: 'Gelap',
        recommended: 'Rekomendasi',
        continueBtn: 'Lanjutkan',
        footerHint: 'Pengaturan ini dapat diubah kapan saja'
      };
    case 'Japanese':
      return {
        title: 'アプリの設定',
        subtitle: 'プログラムを開始するための言語とテーマを選択してください',
        themeLabel: '表示テーマ',
        lightMode: 'ライト',
        darkMode: 'ダーク',
        recommended: 'おすすめ',
        continueBtn: '続ける',
        footerHint: 'これらの設定はいつでも変更できます'
      };
    case 'Français':
      return {
        title: 'Préférences de l’application',
        subtitle: 'Choisissez la langue et le thème pour démarrer votre programme',
        themeLabel: 'Thème d’affichage',
        lightMode: 'Clair',
        darkMode: 'Sombre',
        recommended: 'Recommandé',
        continueBtn: 'Continuer',
        footerHint: 'Ces paramètres peuvent être modifiés à tout moment'
      };
    case 'Deutsch':
      return {
        title: 'App-Einstellungen',
        subtitle: 'Wählen Sie Sprache und Thema, um Ihr Programm zu starten',
        themeLabel: 'Anzeigethema',
        lightMode: 'Hell',
        darkMode: 'Dunkel',
        recommended: 'Empfohlen',
        continueBtn: 'Weiter',
        footerHint: 'Diese Einstellungen können jederzeit geändert werden'
      };
    case 'Español':
      return {
        title: 'Preferencias de la aplicación',
        subtitle: 'Elige el idioma y el tema para comenzar tu programa',
        themeLabel: 'Tema de pantalla',
        lightMode: 'Claro',
        darkMode: 'Oscuro',
        recommended: 'Recomendado',
        continueBtn: 'Continuar',
        footerHint: 'Estos ajustes se pueden cambiar en cualquier momento'
      };
    case 'Portuguese':
      return {
        title: 'Preferências do aplicativo',
        subtitle: 'Escolha o idioma e o tema para iniciar seu programa',
        themeLabel: 'Tema de exibição',
        lightMode: 'Claro',
        darkMode: 'Escuro',
        recommended: 'Recomendado',
        continueBtn: 'Continuar',
        footerHint: 'Estas configurações podem ser alteradas a qualquer momento'
      };
    case 'Chinese':
      return {
        title: '应用程序偏好',
        subtitle: '选择语言和主题以开始您的计划',
        themeLabel: '显示主题',
        lightMode: '浅色',
        darkMode: '深色',
        recommended: '推荐',
        continueBtn: '继续',
        footerHint: '这些设置可以随时更改'
      };
    case 'Hindi':
      return {
        title: 'ऐप प्राथमिकताएं',
        subtitle: 'अपना कार्यक्रम शुरू करने के लिए भाषा और थीम चुनें',
        themeLabel: 'थीम दिखाएं',
        lightMode: 'हल्का',
        darkMode: 'अंधेरा',
        recommended: 'अनुशंसित',
        continueBtn: 'जारी रखें',
        footerHint: 'ये सेटिंग्स कभी भी बदली जा सकती हैं'
      };
    case 'Arabic':
      return {
        title: 'تفضيلات التطبيق',
        subtitle: 'اختر اللغة والمظهر لبدء برنامجك',
        themeLabel: 'مظهر الشاشة',
        lightMode: 'فاتح',
        darkMode: 'داكن',
        recommended: 'موصى به',
        continueBtn: 'متابعة',
        footerHint: 'يمكن تغيير هذه الإعدادات في أي وقت'
      };
    default: // English
      return {
        title: 'App Preferences',
        subtitle: 'Choose your language and theme to start your program',
        themeLabel: 'Display Theme',
        lightMode: 'Light',
        darkMode: 'Dark',
        recommended: 'Recommended',
        continueBtn: 'Continue',
        footerHint: 'You can change these settings anytime'
      };
  }
};

const STEPS = [
  // Profile Detail steps
  { id: 1, type: "custom" },
  { id: 2, type: "custom" },
  { id: 3, type: "custom" },
  { id: 4, type: "custom" },
  { id: 5, type: "custom" },
  { id: 6, type: "custom" },

  // Survey questions
  { id: 7, options: ["Indonesia", "Luar Negeri"], type: "single", layout: "grid-2" },
  { id: 8, options: ["Pelajar", "Mahasiswa", "Karyawan", "Wirausaha", "Freelance", "Tidak Bekerja", "Lainnya"], type: "single", layout: "grid-2" },
  { id: 9, options: ["Sangat Puas & Bahagia", "Biasa Saja", "Ingin Melakukan Perubahan", "Sedang di Titik Terendah"], type: "single" },
  { id: 10, options: ["Manajemen Keuangan", "Disiplin & Kebiasaan", "Karir & Produktivitas", "Kesehatan Fisik", "Pendidikan / Skill Baru"], type: "multi", max: 3 },
  { id: 11, options: ["Sering Menunda", "Kurang Motivasi", "Bingung Mulai dari Mana", "Masalah Biaya / Modal", "Lingkungan Tidak Mendukung"], type: "multi", max: 5 },
  { id: 12, options: ["TikTok", "Instagram / Facebook", "Iklan Digital", "Rekomendasi Teman", "Lainnya"], type: "single" },
  { id: 13, options: ["30 Hari", "60 Hari", "90 Hari"], type: "single" },
  { id: 14, options: ["Daily Routines", "Mindfulness", "Self Evolution", "Physical Exercise"], type: "multi", max: 4 },
];

const QUESTION_TRANSLATIONS: Record<string, Record<number, { question: string; instruction: string; options?: string[] }>> = {
  'Bahasa Indonesia': {
    1: { question: "Siapa nama lengkap Anda?", instruction: "" },
    2: { question: "Apa nama panggilan Anda?", instruction: "" },
    3: { question: "Buat username Anda?", instruction: "(Username harus unik dan hanya berisi huruf, angka, atau underscore)" },
    4: { question: "Apa jenis kelamin Anda?", instruction: "" },
    5: { question: "Kapan tanggal lahir Anda?", instruction: "" },
    6: { question: "Berapa berat & tinggi Anda?", instruction: "(Langkah ini opsional, bisa dilewati)" },
    7: { question: "Di mana Anda tinggal saat ini?", instruction: "", options: ["Indonesia", "Luar Negeri"] },
    8: { question: "Apa status Anda sekarang?", instruction: "", options: ["Pelajar", "Mahasiswa", "Karyawan", "Wirausaha", "Freelance", "Tidak Bekerja", "Lainnya"] },
    9: { question: "Bagaimana Anda mendeskripsikan hidup Anda saat ini?", instruction: "", options: ["Sangat Puas & Bahagia", "Biasa Saja", "Ingin Melakukan Perubahan", "Sedang di Titik Terendah"] },
    10: { question: "Apa yang ingin Anda prioritaskan?", instruction: "(Pilih maks. 3)", options: ["Manajemen Keuangan", "Disiplin & Kebiasaan", "Karir & Produktivitas", "Kesehatan Fisik", "Pendidikan / Skill Baru"] },
    11: { question: "Apa tantangan terbesar Anda saat ini?", instruction: "(Bisa pilih semua yang sesuai)", options: ["Sering Menunda", "Kurang Motivasi", "Bingung Mulai dari Mana", "Masalah Biaya / Modal", "Lingkungan Tidak Mendukung"] },
    12: { question: "Dari mana Anda tahu tentang InRising?", instruction: "", options: ["TikTok", "Instagram / Facebook", "Iklan Digital", "Rekomendasi Teman", "Lainnya"] },
    13: { question: "Berapa lama program yang ingin Anda jalankan?", instruction: "", options: ["30 Hari", "60 Hari", "90 Hari"] },
    14: { question: "Di area mana Anda ingin bertumbuh?", instruction: "(Anda dapat memilih semua kategori fokus Anda)", options: ["Rutinitas Harian", "Ketenangan Diri", "Evolusi Diri", "Latihan Fisik"] },
  },
  'Japanese': {
    1: { question: "あなたのフルネームは何ですか？", instruction: "" },
    2: { question: "あなたのニックネームは何ですか？", instruction: "" },
    3: { question: "ユーザー名を作成してください", instruction: "(ユーザー名は一意であり、英数字またはアンダースコアのみを含める必要があります)" },
    4: { question: "あなたの性別は何ですか？", instruction: "" },
    5: { question: "あなたの生年月日はいつですか？", instruction: "" },
    6: { question: "あなたの体重と身長はどれくらいですか？", instruction: "(このステップはオプションです。スキップできます)" },
    7: { question: "現在どこにお住まいですか？", instruction: "", options: ["インドネシア", "海外"] },
    8: { question: "現在のステータスは何ですか？", instruction: "", options: ["学生", "大学生", "会社員", "起業家", "フリーランサー", "無職", "その他"] },
    9: { question: "現在の生活をどのように表現しますか？", instruction: "", options: ["大満足で幸せ", "普通", "変化を起こしたい", "どん底にある"] },
    10: { question: "何を優先したいですか？", instruction: "(最大3つ選択)", options: ["資産管理", "規律と習慣", "キャリアと生産性", "身体の健康", "教育・新しいスキル"] },
    11: { question: "現在、最大の課題は何ですか？", instruction: "(複数選択可)", options: ["先延ばし癖", "モチベーション不足", "どこから始めるか混乱", "費用・資金問題", "非協力的な環境"] },
    12: { question: "InRisingをどこで知りましたか？", instruction: "", options: ["TikTok", "Instagram / Facebook", "デジタル広告", "友人の紹介", "その他"] },
    13: { question: "どのくらいの期間のプログラムを実行したいですか？", instruction: "", options: ["30日間", "60日間", "90日間"] },
    14: { question: "どの分野で成長したいですか？", instruction: "(フォーカスするカテゴリをすべて選択できます)", options: ["日常の習慣", "マインドフルネス", "自己進化", "運動・トレーニング"] },
  },
  'Français': {
    1: { question: "Quel est votre nom complet ?", instruction: "" },
    2: { question: "Quel est votre pseudo ?", instruction: "" },
    3: { question: "Créez votre nom d'utilisateur", instruction: "(L'identifiant doit être unique et ne contenir que des lettres, chiffres ou underscores)" },
    4: { question: "Quel est votre genre ?", instruction: "" },
    5: { question: "Quelle est votre date de naissance ?", instruction: "" },
    6: { question: "Quels sont votre poids & taille ?", instruction: "(Cette étape est facultative, vous pouvez la passer)" },
    7: { question: "Où vivez-vous actuellement ?", instruction: "", options: ["Indonésie", "À l'étranger"] },
    8: { question: "Quel est votre statut actuel ?", instruction: "", options: ["Élève", "Étudiant", "Employé", "Entrepreneur", "Freelance", "Sans emploi", "Autre"] },
    9: { question: "Comment décririez-vous votre vie actuellement ?", instruction: "", options: ["Très satisfait & heureux", "Moyen", "Envie de changement", "Au plus bas"] },
    10: { question: "Que voulez-vous prioriser ?", instruction: "(Sélectionnez max. 3)", options: ["Gestion financière", "Discipline & Habitudes", "Carrière & Productivité", "Santé physique", "Éducation / Nouvelles compétences"] },
    11: { question: "Quel est votre plus grand défi actuellement ?", instruction: "(Sélectionnez tout ce qui s'applique)", options: ["Procrastination", "Manque de motivation", "Difficile de savoir par où commencer", "Problèmes de coût / capital", "Environnement non favorable"] },
    12: { question: "Comment avez-vous connu InRising ?", instruction: "", options: ["TikTok", "Instagram / Facebook", "Publicités numériques", "Recommandation d'un ami", "Autre"] },
    13: { question: "Combien de temps voulez-vous que le programme dure ?", instruction: "", options: ["30 Jours", "60 Jours", "90 Jours"] },
    14: { question: "Dans quel domaine souhaitez-vous évoluer ?", instruction: "(Vous pouvez sélectionner toutes vos catégories cibles)", options: ["Habitudes quotidiennes", "Pleine conscience", "Évolution personnelle", "Exercice physique"] },
  },
  'Deutsch': {
    1: { question: "Wie ist Ihr vollständiger Name?", instruction: "" },
    2: { question: "Wie ist Ihr Spitzname?", instruction: "" },
    3: { question: "Erstellen Sie Ihren Benutzernamen", instruction: "(Der Benutzername muss eindeutig sein und darf nur Buchstaben, Zahlen oder Unterstriche enthalten)" },
    4: { question: "Was ist Ihr Geschlecht?", instruction: "" },
    5: { question: "Wann ist Ihr Geburtsdatum?", instruction: "" },
    6: { question: "Was ist Ihr Gewicht & Ihre Größe?", instruction: "(Dieser Schritt ist optional und kann übersprungen werden)" },
    7: { question: "Wo wohnen Sie derzeit?", instruction: "", options: ["Indonesien", "Ausland"] },
    8: { question: "Wie ist Ihr aktueller Status?", instruction: "", options: ["Schüler", "Student", "Angestellter", "Unternehmer", "Freiberufler", "Arbeitslos", "Andere"] },
    9: { question: "Wie würden Sie Ihr Leben derzeit beschreiben?", instruction: "", options: ["Sehr zufrieden & glücklich", "Durchschnittlich", "Möchte etwas verändern", "Am Tiefpunkt"] },
    10: { question: "Was möchten Sie priorisieren?", instruction: "(Max. 3 auswählen)", options: ["Finanzmanagement", "Disziplin & Gewohnheiten", "Karriere & Produktivität", "Physische Gesundheit", "Bildung / Neue Fähigkeiten"] },
    11: { question: "Was ist derzeit Ihre größte Herausforderung?", instruction: "(Alle zutreffenden auswählen)", options: ["Prokrastination", "Mangel an Motivation", "Unschlüssig, wo man anfangen soll", "Kosten-/Kapitalprobleme", "Nicht unterstützendes Umfeld"] },
    12: { question: "Wie haben Sie von InRising erfahren?", instruction: "", options: ["TikTok", "Instagram / Facebook", "Digitale Anzeigen", "Empfehlung von Freunden", "Andere"] },
    13: { question: "Wie lange soll Ihr Programm laufen?", instruction: "", options: ["30 Tage", "60 Tage", "90 Tage"] },
    14: { question: "In welchem Bereich möchten Sie wachsen?", instruction: "(Sie können alle Ihre Fokusbereiche auswählen)", options: ["Tägliche Routine", "Achtsamkeit", "Selbstentwicklung", "Körperliche Bewegung"] },
  },
  'Español': {
    1: { question: "¿Cuál es tu nombre completo?", instruction: "" },
    2: { question: "¿Cuál es tu apodo?", instruction: "" },
    3: { question: "Crea tu nombre de usuario", instruction: "(El nombre de usuario debe ser único y solo contener letras, números o guiones bajos)" },
    4: { question: "¿Cuál es tu género?", instruction: "" },
    5: { question: "¿Cuándo es tu fecha de nacimiento?", instruction: "" },
    6: { question: "¿Cuál es tu peso y altura?", instruction: "(Este paso es opcional, puedes omitirlo)" },
    7: { question: "¿Dónde vives actualmente?", instruction: "", options: ["Indonesia", "Extranjero"] },
    8: { question: "¿Cuál es tu estado actual?", instruction: "", options: ["Estudiante", "Estudiante Universitario", "Empleado", "Empresario", "Autónomo", "Desempleado", "Otro"] },
    9: { question: "¿Cómo describirías tu vida actualmente?", instruction: "", options: ["Muy satisfecho y feliz", "Normal", "Quiero hacer un cambio", "En el punto más bajo"] },
    10: { question: "¿Qué quieres priorizar?", instruction: "(Selecciona máx. 3)", options: ["Gestión Financiera", "Disciplina y Hábitos", "Carrera y Productividad", "Salud Física", "Educación / Nuevas Habilidades"] },
    11: { question: "¿Cuál es tu mayor desafío actualmente?", instruction: "(Selecciona todas las que correspondan)", options: ["Procrastinación", "Falta de Motivación", "Confundido por dónde empezar", "Problemas de Costo / Capital", "Entorno no compatible"] },
    12: { question: "¿Cómo te enteraste de InRising?", instruction: "", options: ["TikTok", "Instagram / Facebook", "Anuncios Digitales", "Recomendación de Amigo", "Otro"] },
    13: { question: "¿Cuánto tiempo de programa quieres ejecutar?", instruction: "", options: ["30 Días", "60 Días", "90 Días"] },
    14: { question: "¿En qué área deseas crecer?", instruction: "(Puedes seleccionar todas tus categorías de enfoque)", options: ["Rutinas Diarias", "Atención Plena", "Evolución Personal", "Ejercicio Físico"] },
  },
  'Portuguese': {
    1: { question: "Qual é o seu nome completo?", instruction: "" },
    2: { question: "Qual é o seu apelido?", instruction: "" },
    3: { question: "Crie seu nome de usuário", instruction: "(O nome de usuário deve ser único e conter apenas letras, números ou sublinhados)" },
    4: { question: "Qual é o seu gênero?", instruction: "" },
    5: { question: "Quando é a sua data de nascimento?", instruction: "" },
    6: { question: "Qual é o seu peso e altura?", instruction: "(Esta etapa é opcional, você pode pular)" },
    7: { question: "Onde você mora atualmente?", instruction: "", options: ["Indonésia", "No exterior"] },
    8: { question: "Qual é o seu status atual?", instruction: "", options: ["Estudante", "Estudante Universitário", "Empregado", "Empresário", "Freelancer", "Desempregado", "Outro"] },
    9: { question: "Como você descreveria sua vida atualmente?", instruction: "", options: ["Muito satisfeito e feliz", "Normal", "Quero fazer uma mudança", "No ponto mais baixo"] },
    10: { question: "O que você quer priorizar?", instruction: "(Selecione no máx. 3)", options: ["Gestão Financeira", "Disciplina e Hábitos", "Carreira e Produtividade", "Saúde Física", "Educação / Novas Habilidades"] },
    11: { question: "Qual é o seu maior desafio atualmente?", instruction: "(Selecione todas que se aplicam)", options: ["Procrastinação", "Falta de Motivação", "Confuso sobre por onde começar", "Problemas de Custo / Capital", "Ambiente não apoiador"] },
    12: { question: "Como você ouviu falar do InRising?", instruction: "", options: ["TikTok", "Instagram / Facebook", "Anúncios Digitais", "Recomendação de Amigos", "Outro"] },
    13: { question: "Quanto tempo de programa você quer executar?", instruction: "", options: ["30 Dias", "60 Dias", "90 Dias"] },
    14: { question: "Em qual área você quer crescer?", instruction: "(Você pode selecionar todas as suas categorias de foco)", options: ["Rotinas Diárias", "Atenção Plena", "Evolução Pessoal", "Exercício Físico"] },
  },
  'Chinese': {
    1: { question: "您的全名是什么？", instruction: "" },
    2: { question: "您的昵称是什么？", instruction: "" },
    3: { question: "创建您的用户名", instruction: "(用户名必须是唯一的，且只能包含字母、数字或下划线)" },
    4: { question: "您的性别是什么？", instruction: "" },
    5: { question: "您的出生日期是哪天？", instruction: "" },
    6: { question: "您的体重和身高是多少？", instruction: "(此步骤为可选，可以跳过)" },
    7: { question: "您目前居住在哪里？", instruction: "", options: ["印度尼西亚", "国外"] },
    8: { question: "您目前的身份是什么？", instruction: "", options: ["学生", "大学生", "员工", "企业家", "自由职业者", "无业", "其他"] },
    9: { question: "您如何描述自己目前的生活？", instruction: "", options: ["非常满意且快乐", "平平淡淡", "渴望改变", "处于低谷"] },
    10: { question: "您想优先考虑什么？", instruction: "(最多选择3项)", options: ["财务管理", "自律与习惯", "职业与效率", "身体健康", "教育与新技能"] },
    11: { question: "您目前面临的最大挑战是什么？", instruction: "(可多选/全选)", options: ["拖延症", "缺乏动力", "不知从何开始", "资金/成本问题", "缺乏支持的环境"] },
    12: { question: "您是如何知道InRising的？", instruction: "", options: ["TikTok", "Instagram / Facebook", "数字广告", "朋友推荐", "其他"] },
    13: { question: "您想运行多长时间的计划？", instruction: "", options: ["30天", "60天", "90天"] },
    14: { question: "您想在哪个领域成长？", instruction: "(您可以选择您想要关注的所有类别)", options: ["每日惯例", "正念心灵", "自我进化", "身体锻炼"] },
  },
  'Hindi': {
    1: { question: "आपका पूरा नाम क्या है?", instruction: "" },
    2: { question: "आपका उपनाम क्या है?", instruction: "" },
    3: { question: "अपना उपयोगकर्ता नाम बनाएं", instruction: "(उपयोगकर्ता नाम अद्वितीय होना चाहिए और इसमें केवल अक्षर, संख्याएं या अंडरस्कोर हो सकते हैं)" },
    4: { question: "आपका लिंग क्या है?", instruction: "" },
    5: { question: "आपकी जन्मतिथि क्या है?", instruction: "" },
    6: { question: "आपका वजन और ऊंचाई क्या है?", instruction: "(यह चरण वैकल्पिक है, आप इसे छोड़ सकते हैं)" },
    7: { question: "आप वर्तमान में कहाँ रहते हैं?", instruction: "", options: ["इंडोनेशिया", "विदेश"] },
    8: { question: "आपकी वर्तमान स्थिति क्या है?", instruction: "", options: ["छात्र", "विश्वविद्यालय के छात्र", "कर्मचारी", "उद्यमी", "फ्रीलांसर", "बेरोजगार", "अन्य"] },
    9: { question: "आप वर्तमान में अपने जीवन का वर्णन कैसे करेंगे?", instruction: "", options: ["अत्यधिक संतुष्ट और खुश", "बस सामान्य", "बदलाव करना चाहते हैं", "निचले स्तर पर"] },
    10: { question: "आप किसे प्राथमिकता देना चाहते हैं?", instruction: "(अधिकतम 3 चुनें)", options: ["वित्तीय प्रबंधन", "अनुशासन और आदतें", "करियर और उत्पादकता", "शारीरिक स्वास्थ्य", "शिक्षा / नए कौशल"] },
    11: { question: "वर्तमान में आपकी सबसे बड़ी चुनौती क्या है?", instruction: "(सभी उपयुक्त चुनें)", options: ["टालमटोल", "प्रेरणा की कमी", "उलझन में हैं कि कहाँ से शुरू करें", "लागत / पूंजी की समस्याएं", "असहयोगी वातावरण"] },
    12: { question: "आपको InRising के बारे में कैसे पता चला?", instruction: "", options: ["TikTok", "Instagram / Facebook", "डिजिटल विज्ञापन", "दोस्त की सिफारिश", "अन्य"] },
    13: { question: "आप कितने समय का कार्यक्रम चलाना चाहते हैं?", instruction: "", options: ["30 दिन", "60 दिन", "90 दिन"] },
    14: { question: "आप किस क्षेत्र में आगे बढ़ना चाहते हैं?", instruction: "(आप अपने सभी फोकस श्रेणियों का चयन कर सकते हैं)", options: ["दैनिक दिनचर्या", "सचेत ध्यान", "स्वयं का विकास", "शारीरिक व्यायाम"] },
  },
  'Arabic': {
    1: { question: "ما هو اسمك الكامل؟", instruction: "" },
    2: { question: "ما هو اسم شهرتك؟", instruction: "" },
    3: { question: "أنشئ اسم المستخدم الخاص بك", instruction: "(يجب أن يكون اسم المستخدم فريدًا ويحتوي فقط على أحرف، أرقام، أو شرطة سفلية)" },
    4: { question: "ما هو جنسك؟", instruction: "" },
    5: { question: "ما هو تاريخ ميلادك؟", instruction: "" },
    6: { question: "ما هو وزنك وطولك؟", instruction: "(هذه الخطوة اختيارية، يمكنك تخطيها)" },
    7: { question: "أين تعيش حالياً؟", instruction: "", options: ["إندونيسيا", "خارج البلاد"] },
    8: { question: "ما هي حالتك الحالية؟", instruction: "", options: ["طالب", "طالب جامعي", "موظف", "رائد أعمال", "مستقل", "عاطل عن العمل", "آخر"] },
    9: { question: "كيف تصف حياتك حالياً؟", instruction: "", options: ["راضٍ وسعيد للغاية", "عادي فقط", "أريد إجراء تغيير", "في أدنى مستوياتي"] },
    10: { question: "ما الذي تريد منحه الأولوية؟", instruction: "(اختر 3 كحد أقصى)", options: ["الإدارة المالية", "الانضباط والعادات", "المهنة والإنتاجية", "الصحة البدنية", "التعليم / مهارات جديدة"] },
    11: { question: "ما هو أكبر تحدٍ يواجهك حالياً؟", instruction: "(اختر كل ما ينطبق)", options: ["المماطلة", "نقص الحافز", "الحيرة من أين أبدأ", "مشاكل التكلفة / رأس المال", "بيئة غير داعمة"] },
    12: { question: "كيف سمعت عن InRising؟", instruction: "", options: ["تيك توك", "إنستغرام / فيسبوك", "الإعلانات الرقمية", "توصية صديق", "آخر"] },
    13: { question: "ما هي مدة البرنامج التي ترغب في تشغيلها؟", instruction: "", options: ["30 يومًا", "60 يومًا", "90 يومًا"] },
    14: { question: "في أي مجال ترغب في النمو؟", instruction: "(يمكنك اختيار جميع فئات التركيز الخاصة بك)", options: ["الروتين اليومي", "اليقظة الذهنية", "التطور الذاتي", "التمرين البدني"] },
  },
  'English': {
    1: { question: "What is your full name?", instruction: "" },
    2: { question: "What is your nickname?", instruction: "" },
    3: { question: "Create your username", instruction: "(Username must be unique and only contain letters, numbers, or underscores)" },
    4: { question: "What is your gender?", instruction: "" },
    5: { question: "When is your date of birth?", instruction: "" },
    6: { question: "What is your weight & height?", instruction: "(This step is optional, you can skip it)" },
    7: { question: "Where do you live currently?", instruction: "", options: ["Indonesia", "Abroad"] },
    8: { question: "What is your current status?", instruction: "", options: ["Student", "University Student", "Employee", "Entrepreneur", "Freelancer", "Unemployed", "Other"] },
    9: { question: "How would you describe your life currently?", instruction: "", options: ["Highly Satisfied & Happy", "Just Average", "Want to Make a Change", "At a Low Point"] },
    10: { question: "What do you want to prioritize?", instruction: "(Select max. 3)", options: ["Financial Management", "Discipline & Habits", "Career & Productivity", "Physical Health", "Education / New Skills"] },
    11: { question: "What is your biggest challenge currently?", instruction: "(Select all that apply)", options: ["Procrastination", "Lack of Motivation", "Confused Where to Start", "Cost / Capital Issues", "Unsupportive Environment"] },
    12: { question: "How did you hear about InRising?", instruction: "", options: ["TikTok", "Instagram / Facebook", "Digital Ads", "Friend's Recommendation", "Other"] },
    13: { question: "How long of a program do you want to run?", instruction: "", options: ["30 Days", "60 Days", "90 Days"] },
    14: { question: "Which area do you want to grow in?", instruction: "(You can select all of your focus categories)", options: ["Daily Routines", "Mindfulness", "Self Evolution", "Physical Exercise"] },
  }
};

const getQuestionTranslation = (stepId: number, currentLanguage: string) => {
  const dict = QUESTION_TRANSLATIONS[currentLanguage] || QUESTION_TRANSLATIONS['English'];
  return dict[stepId] || { question: "", instruction: "", options: [] };
};

const getTranslatedHabit = (name: string, language: string) => {
  const isIndo = language === 'Bahasa Indonesia';
  const translations: Record<string, { name: string, subtitle: string }> = {
    'Hidrasi Harian': {
      name: isIndo ? 'Hidrasi Harian' : 'Drink Water',
      subtitle: isIndo ? 'Hidrasi tubuh optimal' : 'Optimal body hydration'
    },
    'Bangun Pagi': {
      name: isIndo ? 'Bangun Pagi' : 'Wake Up Early',
      subtitle: isIndo ? 'Mulai hari lebih awal' : 'Start the day earlier'
    },
    'Mandi Pagi': {
      name: isIndo ? 'Mandi Pagi' : 'Morning Shower',
      subtitle: isIndo ? 'Segarkan diri & pikiran' : 'Refresh body & mind'
    },
    'Tidur 8 Jam': {
      name: isIndo ? 'Tidur 8 Jam' : 'Sleep 8 Hours',
      subtitle: isIndo ? 'Istirahat berkualitas' : 'Quality rest'
    },
    'Beribadah': {
      name: isIndo ? 'Beribadah' : 'Pray',
      subtitle: isIndo ? 'Ibadah tepat waktu' : 'Pray on time'
    },
    'Meditasi': {
      name: isIndo ? 'Meditasi' : 'Meditation',
      subtitle: isIndo ? 'Jernihkan pikiran' : 'Clear your mind'
    },
    'Jalan Santai': {
      name: isIndo ? 'Jalan Santai' : 'Relaxed Walk',
      subtitle: isIndo ? 'Segarkan pikiran di luar' : 'Refresh mind outdoors'
    },
    'Mendengar Musik': {
      name: isIndo ? 'Mendengar Musik' : 'Listen to Music',
      subtitle: isIndo ? 'Tenangkan suasana hati' : 'Calm your mood'
    },
    'Deep Work': {
      name: 'Deep Work',
      subtitle: isIndo ? 'Kerja fokus tanpa gangguan' : 'Focused work without distractions'
    },
    'Deep Learning': {
      name: 'Deep Learning',
      subtitle: isIndo ? 'Pelajari skill baru mendalam' : 'Learn new skills deeply'
    },
    'Rencana Esok Hari': {
      name: isIndo ? 'Rencana Esok Hari' : 'Plan Tomorrow',
      subtitle: isIndo ? 'Persiapkan hari esok' : 'Prepare for tomorrow'
    },
    'Journaling': {
      name: 'Journaling',
      subtitle: isIndo ? 'Evaluasi harimu' : 'Evaluate your day'
    },
    'Push-Up': {
      name: 'Push-Up',
      subtitle: isIndo ? 'Latih kekuatan tubuh atas' : 'Train upper body strength'
    },
    'Sit-Up': {
      name: 'Sit-Up',
      subtitle: isIndo ? 'Latih otot inti tubuh' : 'Train core body muscles'
    },
    'Renang': {
      name: isIndo ? 'Renang' : 'Swimming',
      subtitle: isIndo ? 'Latihan kardio seluruh tubuh' : 'Full body cardio workout'
    },
    'Lari': {
      name: isIndo ? 'Lari' : 'Running',
      subtitle: isIndo ? 'Jaga stamina kardio' : 'Maintain cardio stamina'
    }
  };
  return translations[name] || { name, subtitle: '' };
};

const getTranslatedBenefits = (habitName: string, defaultBenefits: string[], language: string) => {
  if (language === 'Bahasa Indonesia') return defaultBenefits;

  const engBenefits: Record<string, string[]> = {
    'Hidrasi Harian': [
      'Boosts cognitive function — mild dehydration drops focus by 20%',
      'Speeds up metabolism by 30% for 30-40 minutes',
      'Improves physical energy and reduces headaches'
    ],
    'Bangun Pagi': [
      'Creates quiet time for high-focus deep work',
      'Reduces morning rush and stress levels',
      'Aligns body with natural circadian rhythm'
    ],
    'Mandi Pagi': [
      'Instantly increases alertness and blood circulation',
      'Lowers morning cortisol (stress hormone)',
      'Resets brain focus for the day ahead'
    ],
    'Tidur 8 Jam': [
      'Maximizes muscle recovery and brain cellular cleanup',
      'Improves memory consolidation and learning retention',
      'Regulates mood and emotional stability'
    ],
    'Beribadah': [
      'Builds spiritual connection and daily grounding',
      'Instills patience, humility, and mental peace',
      'Provides structural breaks for self-reflection'
    ],
    'Meditasi': [
      'Thickens the prefrontal cortex responsible for focus',
      'Reduces amygdala activity (stress & anxiety center)',
      'Improves emotional regulation and clarity'
    ],
    'Jalan Santai': [
      'Boosts creativity and problem solving by 60%',
      'Gentle cardio that lowers blood sugar levels',
      'Improves mood via fresh air and sunlight exposure'
    ],
    'Mendengar Musik': [
      'Stimulates dopamine release for positive mood boost',
      'Reduces muscle tension and heart rate variability',
      'Acts as a focus shield against background noise'
    ],
    'Deep Work': [
      'Produces high-quality output in less time',
      'Strengthens neural pathways for deep focus',
      'Eliminates attention residue from context switching'
    ],
    'Deep Learning': [
      'Keeps brain neuroplasticity active and healthy',
      'Builds compound knowledge for career leverage',
      'Develops problem-solving skills for complex issues'
    ],
    'Rencana Esok Hari': [
      'Eliminates morning decision fatigue completely',
      'Reduces nighttime anxiety and improves sleep quality',
      'Ensures you start the day with clear execution goals'
    ],
    'Journaling': [
      'De-clutters mental thoughts and emotional stress',
      'Tracks personal growth patterns and lessons learned',
      'Clarifies goals and daily micro-wins'
    ],
    'Push-Up': [
      'Builds upper body strength and bone density',
      'Engages core muscles and improves posture',
      'Quickly boosts heart rate and physical alertness'
    ],
    'Sit-Up': [
      'Strengthens abdominal muscles and core stability',
      'Improves balance and posture dynamically',
      'Reduces risk of lower back pain and injuries'
    ],
    'Renang': [
      'Full-body cardiovascular workout with zero joint impact',
      'Builds endurance, muscle strength, and lung capacity',
      'Triggers high calorie burn and mental relaxation'
    ],
    'Lari': [
      'Greatly enhances cardiovascular health and stamina',
      'Triggers "runner\'s high" endorphins for mood boost',
      'Strengthens legs, core, and overall bone structure'
    ]
  };

  return engBenefits[habitName] || defaultBenefits;
};

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

// Curated pool of Top 4 habits per category for onboarding swipe
const HABIT_REC_POOL = [
  // Rutinitas (Daily Routines)
  { name: 'Drink Water', iconName: 'ph:drop-bold', category: 'Rutinitas', imageUrl: '/all_images/display_images/minumair.png', difficulty: 1, color: '#3B82F6', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Bangun Pagi', iconName: 'solar:sunrise-bold', category: 'Rutinitas', imageUrl: '/all_images/display_images/bangunpagi.png', difficulty: 2, color: '#10B981', frequency: 'harian', imagePosition: 'object-top' },
  { name: 'Mandi Pagi', iconName: 'ph:shower-bold', category: 'Rutinitas', imageUrl: '/all_images/display_images/mandi.png', difficulty: 1, color: '#A855F7', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Tidur 8 Jam', iconName: 'ph:bed-bold', category: 'Rutinitas', imageUrl: '/all_images/display_images/tidur8jam.png', difficulty: 1, color: '#F59E0B', frequency: 'harian', imagePosition: 'object-right' },

  // Ketenangan Diri (Mindfulness)
  { name: 'Beribadah', iconName: 'ph:hands-praying-bold', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/beribadah.png', difficulty: 1, color: '#10B981', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Meditasi', iconName: 'ph:sparkles-bold', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/meditation.png', difficulty: 2, color: '#A855F7', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Jalan Santai', iconName: 'ph:sneaker-move-bold', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/walkingchild.png', difficulty: 1, color: '#3B82F6', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Mendengar Musik', iconName: 'ph:music-notes-bold', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/dengarmusik.png', difficulty: 1, color: '#FF4D00', frequency: 'harian', imagePosition: 'object-center' },

  // Evolusi Diri (Self Evolution)
  { name: 'Deep Work', iconName: 'ph:crosshair-bold', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/deepworking.png', difficulty: 3, color: '#FF4D00', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Deep Learning', iconName: 'ph:book-open-bold', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/deeplearning.png', difficulty: 2, color: '#10B981', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Rencana Esok Hari', iconName: 'ph:calendar-blank-bold', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/perencanaanbesok.png', difficulty: 1, color: '#3B82F6', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Journaling', iconName: 'ph:notebook-bold', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/jurnal.png', difficulty: 1, color: '#F59E0B', frequency: 'harian', imagePosition: 'object-right' },

  // Latihan Fisik (Physical Exercise)
  { name: 'Push-Up', iconName: 'ph:lightning-bold', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/pushup.png', difficulty: 2, color: '#FF4D00', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Sit-Up', iconName: 'ph:barbell-bold', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/sit_up.png', difficulty: 2, color: '#3B82F6', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Renang', iconName: 'ph:waves-bold', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/swimming.png', difficulty: 2, color: '#10B981', frequency: 'harian', imagePosition: 'object-center' },
  { name: 'Lari', iconName: 'ph:wind-bold', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/jogging.png', difficulty: 2, color: '#F59E0B', frequency: 'harian', imagePosition: 'object-center' },
];

// --- ONBOARDING MULTI-LANGUAGE DICTIONARY ---
const ONBOARDING_SCREEN_TRANSLATIONS: Record<string, {
  glitchTitle: string;
  glitchChecklist: string[];
  swipeSkip: string;
  swipeAdd: string;
  statsReward: string;
  top3Benefits: string;
  xpPoints: string;
  maxReachedTitle: string;
  maxReachedDesc: string;
  startProgramBtn: string;
  alreadyAddedErr: string;
  buildingProgramMsg: string;
  swipeInstructions: string;
  programFormedTitle: string;
  programFormedDesc: string;
  emptyProgramDesc: string;
  addOptionalTitle: string;
  journeyLabel: string;
  currentStandingTitle: string;
  potentialTitle: string;
  currentStandingDesc: string;
  potentialDesc: string;
  seePotentialBtn: string;
  createProgramBtn: string;
  statWisdom: string;
  statConfidence: string;
  statStrength: string;
  statDiscipline: string;
  statFocus: string;
  telemetryTexts: string[];
}> = {
  'Bahasa Indonesia': {
    glitchTitle: "Mempersiapkan perjalanan Anda...",
    glitchChecklist: [
      "Menganalisis jawaban Anda",
      "Mencocokkan dengan kebiasaan Anda",
      "Menyusun jadwal program",
      "Mengkalibrasi target Anda"
    ],
    swipeSkip: "SKIP",
    swipeAdd: "TAMBAH",
    statsReward: "HADIAH STATISTIK",
    top3Benefits: "3 MANFAAT UTAMA",
    xpPoints: "Poin Pengalaman",
    maxReachedTitle: "Maksimal Tercapai!",
    maxReachedDesc: "Kamu telah memilih 10 kebiasaan. Kamu dapat mengatur ulang kebiasaanmu di dalam aplikasi setelah program dimulai.",
    startProgramBtn: "Mulai Program",
    alreadyAddedErr: "Habit ini sudah ditambahkan.",
    buildingProgramMsg: "Menyiapkan Program...",
    swipeInstructions: "< geser kiri untuk skip, kanan untuk tambah >",
    programFormedTitle: "Program Terbentuk!",
    programFormedDesc: "Berikut adalah kebiasaan yang Anda pilih untuk program awal ini.",
    emptyProgramDesc: "Anda belum memilih kebiasaan. Silakan tambahkan kebiasaan opsional di bawah ini.",
    addOptionalTitle: "Tambah Kebiasaan Lain",
    journeyLabel: "Perjalanan InTracker",
    currentStandingTitle: "POSISI SAAT INI",
    potentialTitle: "POTENSI {duration} HARI",
    currentStandingDesc: "Ini adalah posisi statistik Anda saat ini. InTracker akan mendampingi Anda memaksimalkan seluruh potensi ini.",
    potentialDesc: "Ini adalah potensi yang dapat Anda capai dalam program {duration} hari dengan disiplin menyelesaikan habit pilihan Anda.",
    seePotentialBtn: "LIHAT POTENSI ANDA",
    createProgramBtn: "BUAT PROGRAM",
    statWisdom: "Kebijaksanaan",
    statConfidence: "Kepercayaan Diri",
    statStrength: "Kekuatan",
    statDiscipline: "Disiplin",
    statFocus: "Fokus",
    telemetryTexts: [
      "membaca data profil Anda...",
      "mengurai respons survei...",
      "menghitung skor disiplin...",
      "mencocokkan pola kebiasaan...",
      "memperkirakan kapasitas fokus...",
      "mengevaluasi sinyal perilaku...",
      "menentukan baseline kekuatan...",
      "memetakan tumpukan kebiasaan...",
      "membuat struktur program...",
      "mengkalibrasi target harian...",
      "menjalankan model konsistensi...",
      "menyelesaikan rencana perjalanan Anda..."
    ]
  },
  'Japanese': {
    glitchTitle: "旅の準備をしています...",
    glitchChecklist: [
      "回答の分析中",
      "習慣とのマッチング中",
      "プログラムスケジュールの構築中",
      "ターゲットのキャリブレーション中"
    ],
    swipeSkip: "スキップ",
    swipeAdd: "追加",
    statsReward: "統計報酬",
    top3Benefits: "主な3つのメリット",
    xpPoints: "経験値",
    maxReachedTitle: "上限に達しました！",
    maxReachedDesc: "10個の習慣を選択しました。プログラム開始後にアプリ内で習慣を再設定できます。",
    startProgramBtn: "プログラムを開始",
    alreadyAddedErr: "この習慣は既に追加されています。",
    buildingProgramMsg: "プログラムを構築中...",
    swipeInstructions: "< 左スワイプでスキップ、右スワイプで追加 >",
    programFormedTitle: "プログラム作成完了！",
    programFormedDesc: "この初期プログラムのために選択された習慣は以下の通りです。",
    emptyProgramDesc: "習慣が選択されていません。以下のオプションの習慣を追加してください。",
    addOptionalTitle: "他の習慣を追加する",
    journeyLabel: "InTrackerジャーニー",
    currentStandingTitle: "現在のステータス",
    potentialTitle: "{duration}日間の可能性",
    currentStandingDesc: "これがあなたの現在の統計値です。InTrackerはあなたが潜在能力を最大限に発揮できるようサポートします。",
    potentialDesc: "これは、選択した習慣を継続的にこなすことで、{duration}日間のプログラムで到達できる可能性です。",
    seePotentialBtn: "可能性を見る",
    createProgramBtn: "プログラムを作成",
    statWisdom: "知恵",
    statConfidence: "自信",
    statStrength: "強さ",
    statDiscipline: "規律",
    statFocus: "集中",
    telemetryTexts: [
      "プロファイルデータを読み込み中...",
      "サーベイ回答を解析中...",
      "規律スコアを計算中...",
      "習慣パターンをクロスリファレンス中...",
      "集中能力を推定中...",
      "行動シグナルを評価中...",
      "強さの基準値を決定中...",
      "習慣レイヤーをマッピング中...",
      "プログラム構造を生成中...",
      "毎日の目標を調整中...",
      "一貫性モデルを実行中...",
      "旅の計画をファイナライズ中..."
    ]
  },
  'Français': {
    glitchTitle: "Préparation de votre voyage...",
    glitchChecklist: [
      "Analyse de vos réponses",
      "Correspondance avec vos habitudes",
      "Construction de votre emploi du temps",
      "Calibrage de vos objectifs"
    ],
    swipeSkip: "PASSER",
    swipeAdd: "AJOUTER",
    statsReward: "RÉCOMPENSE DE STATS",
    top3Benefits: "3 BÉNÉFICES CLÉS",
    xpPoints: "Points d'expérience",
    maxReachedTitle: "Maximum atteint !",
    maxReachedDesc: "Vous avez sélectionné 10 habitudes. Vous pourrez modifier vos habitudes dans l'application une fois le programme commencé.",
    startProgramBtn: "Démarrer le programme",
    alreadyAddedErr: "Cette habitude est déjà ajoutée.",
    buildingProgramMsg: "Création de votre programme...",
    swipeInstructions: "< glisser à gauche pour passer, à droite pour ajouter >",
    programFormedTitle: "Programme créé !",
    programFormedDesc: "Voici les habitudes que vous avez sélectionnées pour ce programme initial.",
    emptyProgramDesc: "Vous n'avez sélectionné aucune habitude. Veuillez ajouter des habitudes facultatives ci-dessous.",
    addOptionalTitle: "Ajouter d'autres habitudes",
    journeyLabel: "Parcours InTracker",
    currentStandingTitle: "SITUATION ACTUELLE",
    potentialTitle: "POTENTIEL SUR {duration} JOURS",
    currentStandingDesc: "Voici vos statistiques actuelles. InTracker vous accompagnera pour maximiser tout ce potentiel.",
    potentialDesc: "Voici le potentiel que vous pouvez atteindre dans un programme de {duration} jours en complétant régulièrement vos habitudes.",
    seePotentialBtn: "VOIR VOTRE POTENTIEL",
    createProgramBtn: "CRÉER LE PROGRAMME",
    statWisdom: "Sagesse",
    statConfidence: "Confiance",
    statStrength: "Force",
    statDiscipline: "Discipline",
    statFocus: "Focus",
    telemetryTexts: [
      "lecture des données de profil...",
      "analyse des réponses...",
      "calcul du score de discipline...",
      "croisement des habitudes...",
      "estimation de la capacité de focus...",
      "évaluation des signaux comportementaux...",
      "calcul de la force de base...",
      "cartographie des habitudes...",
      "génération de la structure du programme...",
      "calibrage des cibles quotidiennes...",
      "exécution du modèle de cohérence...",
      "finalisation du plan de voyage..."
    ]
  },
  'Deutsch': {
    glitchTitle: "Bereite deine Reise vor...",
    glitchChecklist: [
      "Analysiere deine Antworten",
      "Abgleich mit deinen Gewohnheiten",
      "Erstelle deinen Programmplan",
      "Kalibriere deine Ziele"
    ],
    swipeSkip: "WEITER",
    swipeAdd: "HINZUFÜGEN",
    statsReward: "STAT-BELOHNUNG",
    top3Benefits: "3 HAUPTVORTEILE",
    xpPoints: "Erfahrungspunkte",
    maxReachedTitle: "Maximum erreicht!",
    maxReachedDesc: "Du hast 10 Gewohnheiten ausgewählt. Du kannst deine Gewohnheiten nach dem Programmstart in der App verwalten.",
    startProgramBtn: "Programm starten",
    alreadyAddedErr: "Diese Gewohnheit wurde bereits hinzugefügt.",
    buildingProgramMsg: "Erstelle dein Programm...",
    swipeInstructions: "< Nach links wischen zum Überspringen, nach rechts zum Hinzufügen >",
    programFormedTitle: "Programm erstellt!",
    programFormedDesc: "Hier sind die Gewohnheiten, die du für dieses Anfangsprogramm ausgewählt hast.",
    emptyProgramDesc: "Du hast noch keine Gewohnheiten ausgewählt. Bitte füge unten optionale Gewohnheiten hinzu.",
    addOptionalTitle: "Optionale Gewohnheiten hinzufügen",
    journeyLabel: "InTracker-Reise",
    currentStandingTitle: "AKTUELLER STAND",
    potentialTitle: "{duration}-TAGE-POTENZIAL",
    currentStandingDesc: "Das sind deine aktuellen Statistiken. InTracker wird dich begleiten, um dein volles Potenzial auszuschöpfen.",
    potentialDesc: "Dies ist das Potenzial, das du in einem {duration}-tägigen Programm erreichen kannst, wenn du deine Gewohnheiten konsequent durchziehst.",
    seePotentialBtn: "POTENZIAL ANSEHEN",
    createProgramBtn: "PROGRAMM ERSTELLEN",
    statWisdom: "Weisheit",
    statConfidence: "Selbstvertrauen",
    statStrength: "Stärke",
    statDiscipline: "Disziplin",
    statFocus: "Fokus",
    telemetryTexts: [
      "lese Profildaten...",
      "analysiere Umfrageantworten...",
      "berechne Disziplin-Score...",
      "vergleiche Gewohnheitsmuster...",
      "schätze Fokuskapazität...",
      "werte Verhaltenssignale aus...",
      "bestimme Kraft-Baseline...",
      "ordne Gewohnheitsebenen zu...",
      "generiere Programmstruktur...",
      "kalibriere tägliche Ziele...",
      "führe Konsistenzmodell aus...",
      "schließe Reiseplanung ab..."
    ]
  },
  'Español': {
    glitchTitle: "Preparando tu viaje...",
    glitchChecklist: [
      "Analizando tus respuestas",
      "Emparejando con tus hábitos",
      "Construyendo el horario del programa",
      "Calibrando tus objetivos"
    ],
    swipeSkip: "OMITIR",
    swipeAdd: "AÑADIR",
    statsReward: "RECOMPENSA DE ESTADÍSTICAS",
    top3Benefits: "3 BENEFICIOS CLAVE",
    xpPoints: "Puntos de Experiencia",
    maxReachedTitle: "¡Límite Alcanzado!",
    maxReachedDesc: "Has seleccionado 10 hábitos. Puedes volver a administrar tus hábitos dentro de la aplicación una vez iniciado el programa.",
    startProgramBtn: "Iniciar Programa",
    alreadyAddedErr: "Este hábito ya ha sido añadido.",
    buildingProgramMsg: "Creando tu programa...",
    swipeInstructions: "< desliza a la izquierda para omitir, a la derecha para añadir >",
    programFormedTitle: "¡Programa Formado!",
    programFormedDesc: "Estos son los hábitos que seleccionaste para este programa inicial.",
    emptyProgramDesc: "Aún no has seleccionado ningún hábito. Agrega algunos hábitos opcionales a continuación.",
    addOptionalTitle: "Añadir Otros Hábitos",
    journeyLabel: "Viaje InTracker",
    currentStandingTitle: "ESTADO ACTUAL",
    potentialTitle: "POTENCIAL DE {duration} DÍAS",
    currentStandingDesc: "Estas son tus estadísticas actuales. InTracker te guiará para maximizar todo tu potencial.",
    potentialDesc: "Este es el potencial que puedes alcanzar en un programa de {duration} días completando constantemente tus hábitos seleccionados.",
    seePotentialBtn: "VER TU POTENCIAL",
    createProgramBtn: "CREAR PROGRAMA",
    statWisdom: "Sabiduría",
    statConfidence: "Confianza",
    statStrength: "Fuerza",
    statDiscipline: "Disciplina",
    statFocus: "Enfoque",
    telemetryTexts: [
      "leyendo datos de perfil...",
      "analizando respuestas de encuesta...",
      "calculando puntuación de disciplina...",
      "cruzando patrones de hábitos...",
      "estimando capacidad de enfoque...",
      "evaluando señales de comportamiento...",
      "resolviendo línea base de fuerza...",
      "mapeando capas de hábitos...",
      "generando estructura de programa...",
      "calibrando objetivos diarios...",
      "ejecutando modelo de consistencia...",
      "finalizando plan de viaje..."
    ]
  },
  'Portuguese': {
    glitchTitle: "Preparando a sua jornada...",
    glitchChecklist: [
      "Analisando suas respostas",
      "Cruzando com seus hábitos",
      "Construindo o cronograma do programa",
      "Calibrando suas metas"
    ],
    swipeSkip: "PULAR",
    swipeAdd: "ADICIONAR",
    statsReward: "RECOMPENSA DE STATS",
    top3Benefits: "3 PRINCIPAIS BENEFÍCIOS",
    xpPoints: "Pontos de Experiência",
    maxReachedTitle: "Limite Atingido!",
    maxReachedDesc: "Você selecionou 10 hábitos. Você pode gerenciar e ajustar seus hábitos dentro do aplicativo assim que o programa começar.",
    startProgramBtn: "Iniciar Programa",
    alreadyAddedErr: "Este hábito já foi adicionado.",
    buildingProgramMsg: "Construindo o programa...",
    swipeInstructions: "< deslize para a esquerda para pular, para a direita para adicionar >",
    programFormedTitle: "Programa Formado!",
    programFormedDesc: "Aqui estão os hábitos que você selecionou para este programa inicial.",
    emptyProgramDesc: "Você ainda não selecionou nenhum hábito. Adicione alguns hábitos opcionais abaixo.",
    addOptionalTitle: "Adicionar Outros Hábitos",
    journeyLabel: "Jornada InTracker",
    currentStandingTitle: "POSIÇÃO ATUAL",
    potentialTitle: "POTENCIAL DE {duration} DIAS",
    currentStandingDesc: "Estes são os seus status atuais. O InTracker guiará você a maximizar todo o seu potencial.",
    potentialDesc: "Este é o potencial que você pode alcançar em um programa de {duration} dias ao completar consistentemente seus hábitos.",
    seePotentialBtn: "VER SEU POTENCIAL",
    createProgramBtn: "CRIAR PROGRAMA",
    statWisdom: "Sabedoria",
    statConfidence: "Confiança",
    statStrength: "Força",
    statDiscipline: "Disciplina",
    statFocus: "Foco",
    telemetryTexts: [
      "lendo dados de perfil...",
      "analisando respostas da pesquisa...",
      "calculando score de disciplina...",
      "cruzando padrões de hábitos...",
      "estimando capacidade de foco...",
      "avaliando sinais comportamentais...",
      "resolvendo base de força...",
      "mapeando camadas de hábitos...",
      "gerando estrutura de programa...",
      "calibrando metas diárias...",
      "executando modelo de consistencia...",
      "finalizando plano de jornada..."
    ]
  },
  'Chinese': {
    glitchTitle: "正在准备您的旅程...",
    glitchChecklist: [
      "正在分析您的回答",
      "正在匹配您的习惯",
      "正在构建计划日程",
      "正在校准您的目标"
    ],
    swipeSkip: "跳过",
    swipeAdd: "添加",
    statsReward: "属性奖励",
    top3Benefits: "3大核心效益",
    xpPoints: "经验值",
    maxReachedTitle: "已达上限！",
    maxReachedDesc: "您已选择10个习惯。计划开始后，您可以在应用内重新调整您的习惯设置。",
    startProgramBtn: "开启计划",
    alreadyAddedErr: "该习惯已添加。",
    buildingProgramMsg: "正在构建您的计划...",
    swipeInstructions: "< 向左滑动跳过，向右滑动添加 >",
    programFormedTitle: "计划定制完成！",
    programFormedDesc: "以下是您为初始计划选择的习惯。",
    emptyProgramDesc: "您尚未选择任何习惯。请在下方添加可选习惯。",
    addOptionalTitle: "添加其他习惯",
    journeyLabel: "InTracker自我旅程",
    currentStandingTitle: "当前站位",
    potentialTitle: "{duration}天潜力预测",
    currentStandingDesc: "这是您当前的各项属性。InTracker将协助您最大化发掘自身潜能。",
    potentialDesc: "这是您在持续坚持完成所选习惯的前提下，在{duration}天内能达到的潜力上限。",
    seePotentialBtn: "查看您的潜力",
    createProgramBtn: "定制计划",
    statWisdom: "智慧",
    statConfidence: "自信",
    statStrength: "力量",
    statDiscipline: "自律",
    statFocus: "专注",
    telemetryTexts: [
      "读取您的个人数据...",
      "解析调查问卷回答...",
      "计算自律基准得分...",
      "交叉分析习惯模式...",
      "评估专注容量极限...",
      "分析个人行为信号...",
      "确定力量初始基准...",
      "构建习惯行为分层...",
      "生成计划核心架构...",
      "校准每日习惯目标...",
      "模拟习惯持续曲线...",
      "生成最终成长方案..."
    ]
  },
  'Hindi': {
    glitchTitle: "आपकी यात्रा की तैयारी की जा रही है...",
    glitchChecklist: [
      "आपके उत्तरों का विश्लेषण किया जा रहा है",
      "आपकी आदतों से मिलान किया जा रहा है",
      "आपका कार्यक्रम कार्यक्रम बनाया जा रहा है",
      "आपके लक्ष्यों को कैलिब्रेट किया जा रहा है"
    ],
    swipeSkip: "छोड़ें",
    swipeAdd: "जोड़ें",
    statsReward: "सांख्यिकी इनाम",
    top3Benefits: "3 मुख्य लाभ",
    xpPoints: "अनुभव अंक",
    maxReachedTitle: "अधिकतम सीमा समाप्त!",
    maxReachedDesc: "आपने 10 आदतें चुनी हैं। आप कार्यक्रम शुरू होने के बाद ऐप के अंदर अपनी आदतों को प्रबंधित कर सकते हैं।",
    startProgramBtn: "कार्यक्रम शुरू करें",
    alreadyAddedErr: "यह आदत पहले ही जोड़ी जा चुकी है।",
    buildingProgramMsg: "आपका कार्यक्रम तैयार किया जा रहा है...",
    swipeInstructions: "< छोड़ने के लिए बाएं स्वाइप करें, जोड़ने के लिए दाएं >",
    programFormedTitle: "कार्यक्रम का गठन!",
    programFormedDesc: "इस प्रारंभिक कार्यक्रम के लिए आपके द्वारा चुनी गई आदतें यहाँ हैं।",
    emptyProgramDesc: "आपने अभी तक कोई आदत नहीं चुनी है। कृपया नीचे दी गई वैकल्पिक आदतों को जोड़ें।",
    addOptionalTitle: "अन्य आदतें जोड़ें",
    journeyLabel: "InTracker यात्रा",
    currentStandingTitle: "वर्तमान स्थिति",
    potentialTitle: "{duration}-दिवसीय क्षमता",
    currentStandingDesc: "ये आपकी वर्तमान सांख्यिकी हैं। InTracker आपकी पूरी क्षमता को अधिकतम करने में आपका मार्गदर्शन करेगा।",
    potentialDesc: "यह वह क्षमता है जिसे आप लगातार चुनी हुई आदतों को पूरा करके {duration}-दिवसीय कार्यक्रम में प्राप्त कर सकते हैं।",
    seePotentialBtn: "अपनी क्षमता देखें",
    createProgramBtn: "कार्यक्रम बनाएं",
    statWisdom: "बुद्धिमत्ता",
    statConfidence: "आत्मविश्वास",
    statStrength: "शक्ति",
    statDiscipline: "अनुशासन",
    statFocus: "एकाग्रता",
    telemetryTexts: [
      "प्रोफ़ाइल डेटा पढ़ा जा रहा है...",
      "सर्वेक्षण प्रतिक्रियाओं का विश्लेषण...",
      "अनुशासन स्कोर की गणना...",
      "आदत पैटर्न का मिलान...",
      "फोकस क्षमता का अनुमान...",
      "व्यवहार संकेतों का मूल्यांकन...",
      "ताकत बेसलाइन का निर्धारण...",
      "आदत परत संरचना का निर्माण...",
      "कार्यक्रम संरचना तैयार करना...",
      "दैनिक लक्ष्यों का निर्धारण...",
      "संगति मॉडल का संचालन...",
      "आपकी यात्रा योजना को अंतिम रूप..."
    ]
  },
  'Arabic': {
    glitchTitle: "جاري إعداد رحلتك...",
    glitchChecklist: [
      "تحليل إجاباتك",
      "مطابقتها مع عاداتك",
      "بناء جدول برنامجك",
      "معايرة أهدافك"
    ],
    swipeSkip: "تخطي",
    swipeAdd: "إضافة",
    statsReward: "مكافأة الخصائص",
    top3Benefits: "أهم 3 فوائد",
    xpPoints: "نقاط الخبرة",
    maxReachedTitle: "تم الوصول للحد الأقصى!",
    maxReachedDesc: "لقد اخترت 10 عادات. يمكنك إعادة تنظيم عاداتك داخل التطبيق بعد بدء البرنامج.",
    startProgramBtn: "بدء البرنامج",
    alreadyAddedErr: "تمت إضافة هذه العادة بالفعل.",
    buildingProgramMsg: "جاري بناء برنامجك...",
    swipeInstructions: "< اسحب لليسار للتخطي، ولليمين للإضافة >",
    programFormedTitle: "تم تشكيل البرنامج!",
    programFormedDesc: "إليك العادات التي اخترتها لهذا البرنامج الأولي.",
    emptyProgramDesc: "لم تقم باختيار أي عادات بعد. يرجى إضافة عادات اختيارية أدناه.",
    addOptionalTitle: "إضافة عادات أخرى",
    journeyLabel: "رحلة InTracker",
    currentStandingTitle: "الوضع الحالي",
    potentialTitle: "القدرة الكامنة خلال {duration} يومًا",
    currentStandingDesc: "هذه هي خصائصك الحالية. سيرافقك InTracker لمساعدتك على تحقيق أقصى استفادة منها.",
    potentialDesc: "هذه هي القدرة الكامنة التي يمكنك تحقيقها في برنامج مدته {duration} يومًا من خلال إكمال عاداتك المحددة باستمرار.",
    seePotentialBtn: "رؤية قدرتك الكامنة",
    createProgramBtn: "إنشاء البرنامج",
    statWisdom: "الحكمة",
    statConfidence: "الثقة بالنفس",
    statStrength: "القوة",
    statDiscipline: "الانضباط",
    statFocus: "التركيز",
    telemetryTexts: [
      "قراءة بيانات ملفك الشخصي...",
      "تحليل استجابات الاستبيان...",
      "حساب نقاط الانضباط...",
      "مطابقة أنماط العادات المترابطة...",
      "تقدير قدرة التركيز...",
      "تقييم إشارات السلوك...",
      "تحديد خط الأساس للقوة...",
      "تخطيط طبقات تراكم العادات...",
      "توليد هيكل البرنامج...",
      "معايرة الأهداف اليومية...",
      "تشغيل نموذج الاستمرارية...",
      "الاستقرار على خطة الرحلة..."
    ]
  },
  'English': {
    glitchTitle: "Preparing your journey...",
    glitchChecklist: [
      "Analyzing your answers",
      "Matching with your habits",
      "Building your program schedule",
      "Calibrating your targets"
    ],
    swipeSkip: "SKIP",
    swipeAdd: "ADD",
    statsReward: "STATS REWARD",
    top3Benefits: "TOP 3 BENEFITS",
    xpPoints: "Experience Points",
    maxReachedTitle: "Maximum Reached!",
    maxReachedDesc: "You have selected 10 habits. You can manage and adjust your habits inside the app once your program begins.",
    startProgramBtn: "Start Program",
    alreadyAddedErr: "This habit is already added.",
    buildingProgramMsg: "Building Your Program...",
    swipeInstructions: "< swipe left to skip, right to add >",
    programFormedTitle: "Program Formed!",
    programFormedDesc: "Here are the habits you selected for this initial program.",
    emptyProgramDesc: "You haven't selected any habits yet. Please add some optional habits below.",
    addOptionalTitle: "Add Optional Habits",
    journeyLabel: "InTracker Journey",
    currentStandingTitle: "CURRENT STANDING",
    potentialTitle: "{duration}-DAY POTENTIAL",
    currentStandingDesc: "These are your current stats. InTracker will guide you in maximizing your full potential.",
    potentialDesc: "This is the potential you can reach in a {duration}-day program by consistently completing your chosen habits.",
    seePotentialBtn: "SEE YOUR POTENTIAL",
    createProgramBtn: "CREATE PROGRAM",
    statWisdom: "Wisdom",
    statConfidence: "Confidence",
    statStrength: "Strength",
    statDiscipline: "Discipline",
    statFocus: "Focus",
    telemetryTexts: [
      "reading your profile data...",
      "parsing survey responses...",
      "computing discipline score...",
      "cross-referencing habit patterns...",
      "estimating focus capacity...",
      "evaluating behavioral signals...",
      "resolving strength baseline...",
      "mapping habit stack layers...",
      "generating program structure...",
      "calibrating daily targets...",
      "running consistency model...",
      "finalizing your journey plan..."
    ]
  }
};

// --- SUB-SCREEN: GLITCH LOADING ---
const GlitchLoadingScreen = ({ onNext, language }: { onNext: () => void; language: string }) => {
  const { settings } = useUserStore();
  const isLight = settings.theme === 'Light';
  const trans = ONBOARDING_SCREEN_TRANSLATIONS[language] || ONBOARDING_SCREEN_TRANSLATIONS['English'];
  const [telemetry, setTelemetry] = useState(trans.telemetryTexts[0]);
  const [progress, setProgress] = useState(0);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [step4Done, setStep4Done] = useState(false);

  useEffect(() => {
    const telemetryTexts = trans.telemetryTexts;

    let tick = 0;
    const totalDuration = 3600; // ms total
    const intervalMs = 40;
    const totalTicks = totalDuration / intervalMs;

    const telemetryInterval = setInterval(() => {
      tick++;
      const raw = tick / totalTicks;
      // ease-in-out cubic
      const eased = raw < 0.5
        ? 4 * raw * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      const pct = Math.min(100, Math.round(eased * 100));
      setProgress(pct);
      setTelemetry(telemetryTexts[Math.floor(Math.random() * telemetryTexts.length)]);
      if (tick >= totalTicks) clearInterval(telemetryInterval);
    }, intervalMs);

    // Checklist steps at specific % milestones
    const t1 = setTimeout(() => setStep1Done(true), 700);
    const t2 = setTimeout(() => setStep2Done(true), 1500);
    const t3 = setTimeout(() => setStep3Done(true), 2400);
    const t4 = setTimeout(() => setStep4Done(true), 3200);
    const tEnd = setTimeout(() => onNext(), 3800);

    return () => {
      clearInterval(telemetryInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
    };
  }, [onNext, trans.telemetryTexts]);

  const checklistItems = [
    { label: trans.glitchChecklist[0], done: step1Done },
    { label: trans.glitchChecklist[1], done: step2Done },
    { label: trans.glitchChecklist[2], done: step3Done },
    { label: trans.glitchChecklist[3], done: step4Done },
  ];

  const circumference = 2 * Math.PI * 38;
  const strokeOffset = circumference * (1 - progress / 100);

  return (
    <div className={`h-screen w-screen font-['Outfit'] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none transition-colors duration-300 ${
      isLight ? 'bg-[#F2F2F7] text-black' : 'bg-black text-white'
    }`}>
      <div className="flex flex-col items-center gap-10 max-w-[380px] w-full text-center">

        {/* Circular progress ring with % */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg width="96" height="96" className="absolute top-0 left-0 -rotate-90">
            {/* Track */}
            <circle cx="48" cy="48" r="38" fill="none" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'} strokeWidth="6" />
            {/* Progress arc */}
            <circle
              cx="48" cy="48" r="38"
              fill="none"
              stroke="#10B981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129,0.5))', transition: 'stroke-dashoffset 0.04s linear' }}
            />
          </svg>
          <span className="relative font-mono text-[14px] font-black text-[#10B981] tabular-nums">
            {progress}%
          </span>
        </div>

        <div className="flex flex-col gap-6 w-full">
          <h2 className={`text-[20px] font-black uppercase tracking-wider ${isLight ? 'text-black' : 'text-white'}`}>
            {trans.glitchTitle}
          </h2>

          {/* Telemetry logger — lowercase, no underscores */}
          <div className={`px-4 py-3 rounded-xl min-h-[46px] flex items-center justify-center border-[3px] shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
            isLight ? 'bg-white border-black text-black' : 'bg-[#111] border-white/10 text-[#10B981]'
          }`}>
            <span className={`font-mono text-[11px] font-bold tracking-wide break-all leading-snug ${isLight ? 'text-black' : 'text-[#10B981]'}`}>
              {telemetry}
            </span>
          </div>

          {/* Sequential Checklist — 4 steps */}
          <div className="flex flex-col gap-3 text-left mt-2 pl-2">
            {checklistItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                  item.done 
                    ? 'bg-[#10B981] border-black' 
                    : `bg-transparent ${isLight ? 'border-black/20' : 'border-white/20'}`
                }`}>
                  {item.done && <Icon icon="ph:check-bold" width={10} className="text-black font-black" />}
                </div>
                <span className={`text-[13px] font-bold tracking-wide transition-all duration-300 ${
                  item.done 
                    ? (isLight ? 'text-black font-extrabold' : 'text-white') 
                    : (isLight ? 'text-black/35' : 'text-white/35')
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- SUB-COMPONENT: RADAR CHART ---
const RadarChart = ({ stats }: { stats: { kebijaksanaan: number; kepercayaanDiri: number; kekuatan: number; disiplin: number; fokus: number } }) => {
  const { settings } = useUserStore();
  const isLight = settings.theme === 'Light';
  const cx = 150;
  const cy = 150;
  const maxR = 100;
  
  const angles = [-90, -18, 54, 126, 198];
  const gridRadii = [20, 40, 60, 80, 100];
  
  const getPentagonPoints = (r: number) => {
    return angles.map(a => {
      const rad = (a * Math.PI) / 180;
      return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
    }).join(" ");
  };

  const statValues = [
    stats.kebijaksanaan,
    stats.kepercayaanDiri,
    stats.kekuatan,
    stats.disiplin,
    stats.fokus
  ];
  
  const statsPoints = angles.map((a, i) => {
    const val = statValues[i];
    const r = (val / 100) * maxR;
    const rad = (a * Math.PI) / 180;
    return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
  }).join(" ");

  const labels = ["WISDOM", "CONFIDENCE", "STRENGTH", "DISCIPLINE", "FOCUS"];

  return (
    <svg width="300" height="300" className="mx-auto select-none overflow-visible relative z-10">
      <defs>
        {/* Neon Glow Filter */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Concentric Grid lines */}
      {gridRadii.map((r, idx) => (
        <polygon
          key={idx}
          points={getPentagonPoints(r)}
          fill="none"
          stroke={isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.22)"}
          strokeWidth="1.5"
        />
      ))}
      
      {/* Axis lines from center to outer pentagon corners */}
      {angles.map((a, idx) => {
        const rad = (a * Math.PI) / 180;
        const x2 = cx + maxR * Math.cos(rad);
        const y2 = cy + maxR * Math.sin(rad);
        return (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke={isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.22)"}
            strokeWidth="1.5"
          />
        );
      })}

      {/* Stats Polygon with Glow Filter */}
      <polygon
        points={statsPoints}
        fill="rgba(16, 185, 129, 0.18)"
        stroke="#10B981"
        strokeWidth="3.5"
        filter="url(#glow)"
        className="transition-all duration-700 ease-out"
      />

      {/* Stat Dots */}
      {angles.map((a, i) => {
        const val = statValues[i];
        const r = (val / 100) * maxR;
        const rad = (a * Math.PI) / 180;
        const px = cx + r * Math.cos(rad);
        const py = cy + r * Math.sin(rad);
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r="4"
            fill="#10B981"
            stroke="black"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Axis Labels */}
      {angles.map((a, idx) => {
        const rad = (a * Math.PI) / 180;
        const textR = maxR + 22;
        const tx = cx + textR * Math.cos(rad);
        const ty = cy + textR * Math.sin(rad);
        return (
          <text
            key={idx}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-black text-[10px] tracking-widest font-['Outfit'] ${isLight ? 'fill-black/80' : 'fill-white/80'}`}
          >
            {labels[idx]}
          </text>
        );
      })}
    </svg>
  );
};

// --- SUB-SCREEN: RADAR CHART PREVIEW ---
const RadarChartScreen = ({ acceptedHabits, answers, onNext, onBack, language }: { acceptedHabits: any[], answers: Record<number, string[]>, onNext: () => void, onBack: () => void, language: string }) => {
  const { settings } = useUserStore();
  const isLight = settings.theme === 'Light';
  const [mode, setMode] = useState<'current' | 'potential'>('current');
  const programDuration = parseInt(answers[13]?.[0] || "90");
  const trans = ONBOARDING_SCREEN_TRANSLATIONS[language] || ONBOARDING_SCREEN_TRANSLATIONS['English'];

  // Derive dominant categories from accepted habits
  const catCountMap: Record<string, number> = {};
  acceptedHabits.forEach(h => {
    catCountMap[h.category] = (catCountMap[h.category] || 0) + 1;
  });
  const hasCat = (dbCat: string) => (catCountMap[dbCat] || 0) > 0;
  const catCount = (dbCat: string) => catCountMap[dbCat] || 0;

  const startingStats = useMemo(() => {
    const base = 10;
    // Weight per habit in that category
    const rutinitas = catCount('Rutinitas');
    const ketDiri = catCount('Ketenangan Diri');
    const evolusi = catCount('Evolusi Diri');
    const fisik = catCount('Latihan Fisik');

    const disiplin = Math.min(45, base + rutinitas * 5 + evolusi * 2 + fisik * 2);
    const fokus = Math.min(45, base + ketDiri * 5 + evolusi * 3 + rutinitas * 2);
    const kebijaksanaan = Math.min(45, base + evolusi * 6 + ketDiri * 3 + rutinitas * 2);
    const kekuatan = Math.min(45, base + fisik * 6 + rutinitas * 2 + ketDiri * 1);
    const kepercayaanDiri = Math.min(45, base + fisik * 3 + evolusi * 3 + ketDiri * 2 + rutinitas * 2);

    return { kebijaksanaan, kepercayaanDiri, kekuatan, disiplin, fokus };
  }, [acceptedHabits]);

  const potentialStats = useMemo(() => {
    const rutinitas = catCount('Rutinitas');
    const ketDiri = catCount('Ketenangan Diri');
    const evolusi = catCount('Evolusi Diri');
    const fisik = catCount('Latihan Fisik');

    // Base potential growth multiplier depending on days
    const dayMultiplier = programDuration === 30 ? 0.45 : programDuration === 60 ? 0.75 : 1.0;

    // Raw potential limit bounds at 90 days (1.0)
    const rawKebijaksanaan = 50 + evolusi * 10 + ketDiri * 4;
    const rawKepercayaanDiri = 50 + fisik * 6 + evolusi * 5 + rutinitas * 3;
    const rawKekuatan = 50 + fisik * 11 + rutinitas * 3;
    const rawDisiplin = 50 + rutinitas * 10 + evolusi * 5 + fisik * 3;
    const rawFokus = 50 + ketDiri * 10 + evolusi * 6 + rutinitas * 3;

    // Potential stats scale from startingStats up to raw limits based on duration
    return {
      kebijaksanaan: Math.min(99, Math.round(startingStats.kebijaksanaan + (rawKebijaksanaan - startingStats.kebijaksanaan) * dayMultiplier)),
      kepercayaanDiri: Math.min(99, Math.round(startingStats.kepercayaanDiri + (rawKepercayaanDiri - startingStats.kepercayaanDiri) * dayMultiplier)),
      kekuatan: Math.min(99, Math.round(startingStats.kekuatan + (rawKekuatan - startingStats.kekuatan) * dayMultiplier)),
      disiplin: Math.min(99, Math.round(startingStats.disiplin + (rawDisiplin - startingStats.disiplin) * dayMultiplier)),
      fokus: Math.min(99, Math.round(startingStats.fokus + (rawFokus - startingStats.fokus) * dayMultiplier)),
    };
  }, [startingStats, programDuration, acceptedHabits]);

  const activeStats = mode === 'current' ? startingStats : potentialStats;

  return (
    <div className={`h-screen w-screen font-['Outfit'] flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none relative transition-colors duration-300 ${
      isLight ? 'bg-[#F2F2F7] text-black' : 'bg-black text-white'
    }`}>
      {/* Glow decorators */}
      <div className={`absolute top-[-10%] left-[-20%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none z-0 ${
        isLight ? 'bg-[#10B981]/03' : 'bg-[#10B981]/08'
      }`} />
      <div className={`absolute bottom-[-10%] right-[-20%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none z-0 ${
        isLight ? 'bg-[#10B981]/03' : 'bg-[#10B981]/08'
      }`} />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-[420px] flex items-center justify-start">
        <button 
          onClick={onBack} 
          className={`w-10 h-10 flex items-center justify-center border-2 rounded-xl active:scale-95 transition-all ${
            isLight 
              ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
              : 'bg-[#1A1A1A] border-white/20 text-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]'
          }`}
        >
          <Icon icon="ph:caret-left-bold" width={18} />
        </button>
      </div>

      {/* Main Info */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center text-center gap-2 mt-4">
        <span className="text-[10px] font-black tracking-[0.25em] text-[#10B981] uppercase">
          {trans.journeyLabel}
        </span>
        <h1 className={`text-[22px] font-black uppercase tracking-wide leading-tight ${isLight ? 'text-black' : 'text-white'}`}>
          {mode === 'current'
            ? trans.currentStandingTitle
            : trans.potentialTitle.replace('{duration}', programDuration.toString())}
        </h1>
      </div>

      {/* Radar Chart Visual */}
      <div className="flex-1 flex items-center justify-center py-4 w-full relative z-10">
        <div className={`absolute w-[240px] h-[240px] rounded-full blur-[55px] pointer-events-none z-0 ${
          isLight ? 'bg-[#10B981]/05' : 'bg-[#10B981]/10'
        }`} />
        <div className="relative z-10">
          <RadarChart stats={activeStats} />
        </div>
      </div>

      {/* Description & Action */}
      <div className="relative z-10 w-full max-w-[420px] text-center flex flex-col items-center gap-6">
        <p className={`text-[13px] px-6 leading-relaxed ${isLight ? 'text-black/60 font-semibold' : 'text-white/50'}`}>
          {mode === 'current'
            ? trans.currentStandingDesc
            : trans.potentialDesc.replace('{duration}', programDuration.toString())}
        </p>

        <CinematicButton
          onClick={() => {
            if (mode === 'current') {
              setMode('potential');
            } else {
              onNext();
            }
          }}
          className="w-full"
        >
          {mode === 'current' ? trans.seePotentialBtn : trans.createProgramBtn}
        </CinematicButton>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: SWIPE CARD ---
const SwipeCard = ({ habit, onSwipe, index, isTop }: { habit: any, onSwipe: (direction: 'left' | 'right') => void, index: number, isTop: boolean }) => {
  const { settings } = useUserStore();
  const language = settings.language || 'English';
  const trans = ONBOARDING_SCREEN_TRANSLATIONS[language] || ONBOARDING_SCREEN_TRANSLATIONS['English'];
  const isLight = settings.theme === 'Light';
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotate = useTransform(x, [-150, 150], [-15, 15]);
  const skipOpacity = useTransform(x, [-120, -30], [1, 0]);
  const addOpacity = useTransform(x, [30, 120], [0, 1]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 120) {
      onSwipe('right');
    } else if (info.offset.x < -120) {
      onSwipe('left');
    }
  };

  const benefitData = getHabitBenefitData(habit.name);
  const statsMap = getDefaultHabitStatsMap(habit.category, habit.difficulty);
  const xp = habit.difficulty === 3 ? 50 : habit.difficulty === 2 ? 30 : 15;

  const translated = getTranslatedHabit(habit.name, language);
  const translatedBenefits = getTranslatedBenefits(habit.name, benefitData.top5, language);

  return (
    <motion.div
      style={{ x, y, rotate, zIndex: 100 - index }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={isTop ? undefined : { scale: 0.95 - index * 0.02, y: index * 10 }}
      transition={{ duration: 0.2 }}
      className={`absolute w-full h-[540px] rounded-[28px] flex flex-col overflow-hidden select-none cursor-grab active:cursor-grabbing border-2 ${
        isLight
          ? 'bg-white border-black text-black shadow-[6px_6px_0px_rgba(0,0,0,1)]'
          : 'bg-[#141414] border-white/[0.08] text-white shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
      }`}
    >
      {/* Image header */}
      <div className={`relative h-[200px] bg-black overflow-hidden shrink-0 border-b-2 ${isLight ? 'border-black' : 'border-white/[0.08]'}`}>
        <img
          src={habit.imageUrl}
          alt={translated.name}
          className={`w-full h-full object-cover ${habit.imagePosition || 'object-center'}`}
        />
        
        {/* Drag Overlays */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: skipOpacity }}
              className="absolute top-6 right-6 border-[3px] border-red-500 text-red-500 font-black tracking-widest text-[16px] px-3 py-1.5 uppercase rounded-lg rotate-12 bg-black/80"
            >
              {trans.swipeSkip}
            </motion.div>
            <motion.div
              style={{ opacity: addOpacity }}
              className="absolute top-6 left-6 border-[3px] border-[#10B981] text-[#10B981] font-black tracking-widest text-[16px] px-3 py-1.5 uppercase rounded-lg -rotate-12 bg-black/80"
            >
              {trans.swipeAdd}
            </motion.div>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="px-6 py-4 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
        {/* Habit Name */}
        <div className="text-left mb-4">
          <h3 className={`text-[24px] font-black tracking-wide uppercase font-['Outfit'] leading-tight ${isLight ? 'text-black font-extrabold' : 'text-white'}`}>
            {translated.name}
          </h3>
        </div>

        {/* STATS REWARD SECTION */}
        <div className="text-left w-full mb-4">
          <span className={`text-[10px] font-black font-['Outfit'] uppercase tracking-[0.15em] block mb-2 ${isLight ? 'text-neutral-500' : 'text-white/30'}`}>
            {trans.statsReward}
          </span>
          <div className="space-y-2">
            {statsMap.categories.map((entry) => {
              const config = STAT_DISPLAY[entry.category];
              if (!config) return null;
              const label = entry.category === 'kebijaksanaan' ? trans.statWisdom
                : entry.category === 'kepercayaanDiri' ? trans.statConfidence
                : entry.category === 'kekuatan' ? trans.statStrength
                : entry.category === 'disiplin' ? trans.statDiscipline
                : trans.statFocus;
              return (
                <div key={entry.category} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-black/[0.04]' : 'bg-white/[0.04]'}`}
                  >
                    <Icon icon={config.icon} width={16} height={16} style={{ color: config.color }} />
                  </div>
                  <span className={`text-[12px] font-bold font-['Outfit'] flex-1 ${isLight ? 'text-black/80' : 'text-white/80'}`}>
                    {label}
                  </span>
                  <span
                    className="text-[12px] font-black font-['Outfit']"
                    style={{ color: config.color }}
                  >
                    +{entry.points}
                  </span>
                </div>
              );
            })}

            {/* XP Row */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-[#10B981]/20' : 'bg-[#10B981]/10'}`}>
                <Icon icon="ph:star-four-bold" width={16} height={16} className="text-[#10B981]" />
              </div>
              <span className={`text-[12px] font-bold font-['Outfit'] flex-1 ${isLight ? 'text-black/80' : 'text-white/80'}`}>
                {trans.xpPoints}
              </span>
              <span className="text-[12px] font-black font-['Outfit'] text-[#10B981]">
                +{xp} XP
              </span>
            </div>
          </div>
        </div>

        {/* TOP 3 BENEFITS SECTION */}
        <div className="text-left w-full">
          <span className={`text-[10px] font-black font-['Outfit'] uppercase tracking-[0.15em] block mb-2 ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/30'}`}>
            {trans.top3Benefits}
          </span>
          <ul className="space-y-1.5">
            {translatedBenefits.slice(0, 3).map((benefit, i) => (
              <li key={i} className={`flex items-start gap-2 text-[11px] leading-relaxed font-semibold ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0 mt-1.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

// --- SUB-SCREEN: HABITS SWIPE DECK ---
const SwipeDeckScreen = ({ answers, onComplete, onBack }: { answers: Record<number, string[]>, onComplete: (acceptedHabits: any[]) => void, onBack: () => void }) => {
  const { settings } = useUserStore();
  const language = settings.language || 'English';
  const trans = ONBOARDING_SCREEN_TRANSLATIONS[language] || ONBOARDING_SCREEN_TRANSLATIONS['English'];
  const isLight = settings.theme === 'Light';
  
  const selectedCats = answers[14] || [];
  const categoryMapping: Record<string, string> = {
    "Daily Routines": "Rutinitas",
    "Mindfulness": "Ketenangan Diri",
    "Self Evolution": "Evolusi Diri",
    "Physical Exercise": "Latihan Fisik",
    "Rutinitas Harian": "Rutinitas",
    "Ketenangan Diri": "Ketenangan Diri",
    "Evolusi Diri": "Evolusi Diri",
    "Latihan Fisik": "Latihan Fisik"
  };

  const deck = useMemo(() => {
    const result: any[] = [];
    selectedCats.forEach(catName => {
      const dbCat = categoryMapping[catName];
      if (dbCat) {
        const matching = HABIT_REC_POOL.filter(h => h.category === dbCat && h.name !== 'Hidrasi Harian' && h.name !== 'Drink Water').slice(0, 4);
        result.push(...matching);
      }
    });
    if (result.length === 0) {
      return HABIT_REC_POOL.filter(h => h.name !== 'Hidrasi Harian' && h.name !== 'Drink Water').slice(0, 8);
    }
    return result;
  }, [selectedCats]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMaxModal, setShowMaxModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerComplete = (habits: any[]) => {
    setIsProcessing(true);
    // Use second pool element (Bangun Pagi) as fallback default if no habits were chosen
    setTimeout(() => onComplete(habits.length > 0 ? habits : [HABIT_REC_POOL[1]]), 1600);
  };

  const activeHabit = deck[currentIndex];

  const showErrorPopup = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const handleSwipeLeft = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleSwipeRight = (habit: any) => {
    if (accepted.some(a => a.name === habit.name)) {
      showErrorPopup(trans.alreadyAddedErr);
      return;
    }

    if (accepted.length >= 10) {
      setShowMaxModal(true);
      return;
    }

    const newAccepted = [...accepted, habit];
    setAccepted(newAccepted);
    if (currentIndex < deck.length) {
      setCurrentIndex(prev => prev + 1);
    }
    // Auto-trigger modal when we just hit exactly 10
    if (newAccepted.length === 10) {
      setTimeout(() => setShowMaxModal(true), 400);
    }
  };

  const isDeckCompleted = currentIndex >= deck.length;
  // Show habits that never appeared in the swipe deck at all
  const remainingOptions = HABIT_REC_POOL.filter(
    h => h.name !== 'Hidrasi Harian' && h.name !== 'Drink Water' && !deck.some(d => d.name === h.name) && !accepted.some(acc => acc.name === h.name)
  );

  return (
    <div className={`h-screen w-screen font-['Outfit'] flex flex-col justify-between py-12 px-6 overflow-hidden select-none relative transition-colors duration-300 ${isLight ? 'bg-[#F2F2F7] text-black' : 'bg-black text-white'}`}>
      {/* Processing Loading Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-black"
          >
            {/* Spinner ring */}
            <div className="relative w-20 h-20 mb-8">
              <svg width="80" height="80" className="absolute top-0 left-0 -rotate-90 animate-spin" style={{ animationDuration: '1.2s' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none" stroke="#10B981" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32 * 0.7} ${2 * Math.PI * 32 * 0.3}`}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129,0.6))' }}
                />
              </svg>
            </div>
            <p className="text-[13px] font-black font-['Outfit'] text-white/60 uppercase tracking-[0.2em]">
              {trans.buildingProgramMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max Habits Modal */}
      <AnimatePresence>
        {showMaxModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[300] flex items-center justify-center px-6"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`relative z-10 w-full max-w-[340px] border-[3px] border-[#10B981] rounded-2xl p-6 shadow-[6px_6px_0px_rgba(16, 185, 129,0.3)] flex flex-col items-center gap-5 text-center ${
                isLight ? 'bg-white' : 'bg-[#111]'
              }`}
            >
              {/* Title */}
              <div className="flex flex-col gap-1">
                <h3 className={`text-[18px] font-black font-['Outfit'] uppercase tracking-wide ${isLight ? 'text-black' : 'text-white'}`}>
                  {trans.maxReachedTitle}
                </h3>
                <p className={`text-[12px] leading-relaxed font-medium ${isLight ? 'text-black/50' : 'text-white/50'}`}>
                  {trans.maxReachedDesc}
                </p>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => triggerComplete(accepted)}
                className="w-full py-4 bg-[#10B981] text-black font-black font-['Outfit'] text-[14px] uppercase tracking-widest rounded-xl border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                {trans.startProgramBtn} →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-24 left-6 right-6 z-[250] bg-red-500/95 backdrop-blur-md text-white font-['Outfit'] font-bold text-[13px] text-center px-4 py-3 rounded-2xl border border-red-400/30 shadow-[0_8px_30px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
          >
            <Icon icon="solar:danger-bold" width={18} height={18} />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto flex items-center justify-start">
        <button 
          onClick={onBack} 
          className={`w-10 h-10 flex items-center justify-center border-2 rounded-xl active:scale-95 transition-all ${
            isLight 
              ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
              : 'bg-[#1A1A1A] border-white/20 text-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]'
          }`}
        >
          <Icon icon="ph:caret-left-bold" width={18} />
        </button>
      </div>

      {!isDeckCompleted ? (
        <>
          {/* Card Deck Area */}
          <div className="flex-1 w-full max-w-[385px] mx-auto flex items-center justify-center relative mt-6 mb-4">
            <AnimatePresence>
              {deck.slice(currentIndex, currentIndex + 2).map((habit, idx) => {
                const isTop = idx === 0;
                return (
                  <SwipeCard
                    key={habit.name}
                    habit={habit}
                    onSwipe={(dir) => {
                      if (dir === 'right') {
                        handleSwipeRight(habit);
                      } else {
                        handleSwipeLeft();
                      }
                    }}
                    index={idx}
                    isTop={isTop}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-[420px] mx-auto flex flex-col items-center gap-6 relative z-10 animate-pulse">
            <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isLight ? 'text-black/60' : 'text-white/60'}`}>
              {trans.swipeInstructions}
            </span>
            <div className="flex items-center gap-6 mb-2">
              <button
                onClick={handleSwipeLeft}
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-red-500 active:scale-95 transition-all ${
                  isLight 
                    ? 'bg-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                    : 'bg-black border-white/20 shadow-[4px_4px_0px_rgba(255,255,255,0.15)]'
                }`}
              >
                <Icon icon="ph:x-bold" width={24} />
              </button>
              <button
                onClick={() => handleSwipeRight(activeHabit)}
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-emerald-600 active:scale-95 transition-all ${
                  isLight 
                    ? 'bg-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                    : 'bg-black border-white/20 shadow-[4px_4px_0px_rgba(255,255,255,0.15)]'
                }`}
              >
                <Icon icon="ph:check-bold" width={24} />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Completed Summary View */
        <div className="flex-1 w-full max-w-[420px] mx-auto flex flex-col justify-between py-2 relative z-10 overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-2 text-center">
            <h2 className={`text-[28px] font-black uppercase tracking-wider leading-tight ${isLight ? 'text-black' : 'text-white'}`}>
              {trans.programFormedTitle}
            </h2>
            <p className={`text-[12px] px-6 leading-relaxed ${isLight ? 'text-black/60 font-semibold' : 'text-white/60'}`}>
              {accepted.length > 0
                ? trans.programFormedDesc
                : trans.emptyProgramDesc}
            </p>
          </div>

          {/* Current Selection List */}
          <div className={`border-2 rounded-2xl p-4 my-6 flex flex-col gap-3 ${
            isLight 
              ? 'bg-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
              : 'bg-[#111] border-white/10 shadow-[4px_4px_0px_rgba(255,255,255,0.15)]'
          }`}>
            {accepted.length > 0 ? (
              accepted.map((h, i) => {
                const translated = getTranslatedHabit(h.name, language);
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                    isLight 
                      ? 'bg-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-black' 
                      : 'bg-black border-white/10 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] text-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <img src={h.imageUrl} className="w-8 h-8 rounded-lg object-cover border border-black" />
                      <div className="text-left">
                        <h4 className={`text-[13px] font-black uppercase tracking-wide ${isLight ? 'text-black font-extrabold' : 'text-white'}`}>{translated.name}</h4>
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${isLight ? 'text-neutral-500' : 'text-white/40'}`}>{h.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccepted(prev => prev.filter(acc => acc.name !== h.name))}
                      className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-transform"
                    >
                      <Icon icon="ph:trash-bold" width={14} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className={`flex flex-col items-center justify-center h-full text-[12px] font-bold py-10 uppercase tracking-widest ${
                isLight ? 'text-black/30' : 'text-white/30'
              }`}>
                {language === 'Bahasa Indonesia' ? 'KOSONG' : (language === 'Japanese' ? '空' : (language === 'Chinese' ? '空' : 'EMPTY'))}
              </div>
            )}
          </div>

          {/* Add Optional Habits Section */}
          {remainingOptions.length > 0 && (
            <div className="text-left mb-6">
              <h4 className={`text-[11px] font-black uppercase tracking-widest mb-3 ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/40'}`}>
                {trans.addOptionalTitle}
              </h4>
              <div className="flex flex-col gap-2">
                {remainingOptions.map((h, i) => {
                  const translated = getTranslatedHabit(h.name, language);
                  return (
                    <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border-2 ${
                      isLight 
                        ? 'bg-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-black' 
                        : 'bg-black border-white/10 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] text-white'
                    }`}>
                      <div className="flex items-center gap-3">
                        <img src={h.imageUrl} className="w-8 h-8 rounded-lg object-cover border border-black" />
                        <div>
                          <h5 className={`text-[12px] font-black uppercase tracking-wide ${isLight ? 'text-black font-extrabold' : 'text-white'}`}>{translated.name}</h5>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-neutral-500' : 'text-white/40'}`}>{h.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSwipeRight(h)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform ${
                          isLight 
                            ? 'bg-black border border-black text-[#10B981]' 
                            : 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]'
                        }`}
                      >
                        <Icon icon="ph:plus-bold" width={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <CinematicButton
            onClick={() => triggerComplete(accepted)}
            className="w-full shrink-0"
          >
            {trans.startProgramBtn}
          </CinematicButton>
        </div>
      )}
    </div>
  );
};

// --- SUB-SCREEN: PROGRAM CREATION / USERNAME CHECK LOADING POPUP ---
const SavingOverlay = ({ language, isUsernameCheck = false }: { language: string, isUsernameCheck?: boolean }) => {
  const { settings } = useUserStore();
  const isLight = settings.theme === 'Light';
  const isIndo = language === 'Bahasa Indonesia';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`w-full max-w-[320px] rounded-2xl border-[3px] border-black p-8 flex flex-col items-center gap-6 text-center transition-colors duration-300 ${
          isLight 
            ? 'bg-white text-black shadow-[8px_8px_0px_rgba(0,0,0,1)]' 
            : 'bg-[#111] text-white border-white/20 shadow-[8px_8px_0px_rgba(255,255,255,0.15)]'
        }`}
      >
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className={`w-12 h-12 border-[4px] rounded-full border-t-transparent ${
              isLight ? 'border-black' : 'border-[#10B981]'
            }`}
          />
          <Icon 
            icon={isUsernameCheck ? "solar:user-bold" : "solar:magic-stick-bold"} 
            className={`absolute ${isLight ? 'text-black' : 'text-[#10B981]'}`}
            width={20} 
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-[18px] font-black uppercase tracking-wider leading-tight">
            {isUsernameCheck
              ? (isIndo ? "Memeriksa Username..." : "Checking Username...")
              : (isIndo ? "Membentuk Program..." : "Forming Program...")}
          </h3>
          <p className={`text-[12px] leading-relaxed font-semibold ${isLight ? 'text-black/60' : 'text-white/60'}`}>
            {isUsernameCheck
              ? (isIndo ? "Memastikan ketersediaan username unik Anda" : "Verifying availability of your unique username")
              : (isIndo ? "Menyusun kebiasaan dan menyelaraskan stats awal Anda" : "Assembling habits and calibrating your starting stats")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Questions() {
  const { step } = useParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useUserStore();

  const [hasSelectedLang, setHasSelectedLang] = useState(() => {
    return localStorage.getItem('onboarding_lang_selected') === 'true';
  });

  const [hasSelectedTheme, setHasSelectedTheme] = useState(() => {
    return localStorage.getItem('onboarding_theme_selected') === 'true';
  });

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<Record<number, string[]>>({});
  const [acceptedHabits, setAcceptedHabits] = useState<any[]>([]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Custom profile input states
  const [firstName, setFirstName] = useState(settings.firstName || "");
  const [lastName, setLastName] = useState(settings.lastName || "");
  const [nickname, setNickname] = useState(settings.nickname || "");
  const [username, setUsername] = useState(settings.username || "");
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>(settings.gender || '');
  const [dob, setDob] = useState(settings.dob || "15/06/2008");
  const [weight, setWeight] = useState(settings.weight || "");
  const [height, setHeight] = useState(settings.height || "");

  // Date Wheel Picker states
  const [selDay, setSelDay] = useState(15);
  const [selMonth, setSelMonth] = useState(6);
  const [selYear, setSelYear] = useState(2008);

  const daysInMonth = useMemo(() => {
    return new Date(selYear, selMonth, 0).getDate();
  }, [selMonth, selYear]);

  useEffect(() => {
    if (selDay > daysInMonth) {
      setSelDay(daysInMonth);
      const updatedDob = `${daysInMonth.toString().padStart(2, '0')}/${selMonth.toString().padStart(2, '0')}/${selYear}`;
      setDob(updatedDob);
    }
  }, [daysInMonth, selDay, selMonth, selYear]);

  const dayScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<any>(null);

  const currentStep = step === undefined ? 0 : parseInt(step);
  const currentQuestion = STEPS.find(s => s.id === currentStep);

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showWheelMode, setShowWheelMode] = useState(false);
  const language = settings.language || 'English';
  const isLight = settings.theme === 'Light';

  const currentStepData = getQuestionTranslation(currentStep, language);
  const questionTitle = currentStepData.question;
  const questionInstruction = currentStepData.instruction;
  const questionOptions = currentStepData.options || [];

  // Sync selectedOptions with allAnswers when step changes
  useEffect(() => {
    setSelectedOptions(allAnswers[currentStep] || []);
    setShowCountryPicker(false);
    setSearchQuery("");
    setIsTransitioning(false);

    // Initialize custom states if they already exist in Zustand settings
    if (currentStep === 1) {
      setFirstName(settings.firstName || "");
      setLastName(settings.lastName || "");
    } else if (currentStep === 2) {
      setNickname(settings.nickname || settings.firstName || firstName || "");
    } else if (currentStep === 3) {
      setUsername(settings.username || settings.nickname?.toLowerCase().replace(/[^a-z0-9_]/g, '') || "");
    } else if (currentStep === 4) {
      setGender(settings.gender || "");
    } else if (currentStep === 5) {
      const activeDob = settings.dob || "15/06/1995";
      setDob(activeDob);
      if (activeDob.includes('/')) {
        const parts = activeDob.split('/');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);
          if (!isNaN(d)) setSelDay(d);
          if (!isNaN(m)) setSelMonth(m);
          if (!isNaN(y)) setSelYear(y);
        }
      }
    } else if (currentStep === 6) {
      setWeight(settings.weight || "");
      setHeight(settings.height || "");
    }
  }, [currentStep, allAnswers, settings]);

  // Sync scroll positions when Step 5 loads or wheel mode is toggled
  useEffect(() => {
    if (currentStep === 5 && showWheelMode) {
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
  }, [currentStep, showWheelMode]);

  if (step === undefined) {
    return <Navigate to="/questions/0" replace />;
  }

  const handleNext = async (overrideOptions?: string[]) => {
    // If on Step 3 (Username), check uniqueness before proceeding!
    if (currentStep === 3) {
      const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!cleanedUsername) {
        alert(language === 'Bahasa Indonesia' ? "Username tidak boleh kosong" : "Username cannot be empty");
        return;
      }
      
      // If we are not in guest mode, check against the database
      if (localStorage.getItem('guest_mode') !== 'true') {
        setIsSaving(true);
        try {
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('nickname', cleanedUsername)
            .maybeSingle();

          if (existingUser) {
            alert(language === 'Bahasa Indonesia' ? "Username sudah digunakan oleh orang lain. Pilih username lain." : "This username is already taken. Please choose another one.");
            setIsSaving(false);
            return;
          }
        } catch (err) {
          console.error("Username check failed:", err);
        } finally {
          setIsSaving(false);
        }
      }
    }

    // Collect active states
    const profileData = {
      firstName,
      lastName,
      nickname,
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      gender,
      dob,
      weight,
      height
    };

    // If on name step and nickname is empty, default it to firstName
    if (currentStep === 1 && !nickname && firstName) {
      setNickname(firstName);
    }
    
    // If on nickname step and username is empty, default it to nickname (cleaned)
    if (currentStep === 2 && !username && nickname) {
      setUsername(nickname.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    }

    // Save to Zustand
    updateSettings(profileData);

    let finalOptions = Array.isArray(overrideOptions) ? overrideOptions : selectedOptions;
    if (currentStep === 1) finalOptions = [`${firstName} ${lastName}`.trim()];
    else if (currentStep === 2) finalOptions = [nickname];
    else if (currentStep === 3) finalOptions = [username];
    else if (currentStep === 4) finalOptions = [gender];
    else if (currentStep === 5) finalOptions = [dob];
    else if (currentStep === 6) finalOptions = [weight && height ? `${weight}kg / ${height}cm` : ''];

    const updatedAnswers = { ...allAnswers, [currentStep]: finalOptions };
    setAllAnswers(updatedAnswers);

    if (currentStep < 14) {
      navigate(`/questions/${currentStep + 1}`);
    } else {
      navigate('/questions/15');
    }
  };

  const handleFinalSubmit = async (answers: Record<number, string[]>, profileData: any, acceptedHabits: any[] = []) => {
    setIsSaving(true);
    try {
      const durationVal = parseInt(answers[13]?.[0] || "90");
      updateSettings({
        programDuration: durationVal as any
      });

      let user = null;
      try {
        const userRes = await Promise.race([
          supabase.auth.getUser(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500))
        ]);
        user = userRes?.data?.user || null;
      } catch (e) {
        console.warn("Auth getUser check timed out or failed:", e);
      }
      
      const selectedCats = answers[14] || [];
      const baseVal = 10;
      let kebijaksanaan = baseVal;
      let kepercayaanDiri = baseVal;
      let kekuatan = baseVal;
      let disiplin = baseVal;
      let fokus = baseVal;

      if (selectedCats.includes("Daily Routines")) {
        disiplin += 15;
        kekuatan += Math.floor(Math.random() * 5) + 4;
        fokus += Math.floor(Math.random() * 5) + 4;
        kebijaksanaan += Math.floor(Math.random() * 5) + 4;
        kepercayaanDiri += Math.floor(Math.random() * 5) + 4;
      }
      if (selectedCats.includes("Self Evolution")) {
        kebijaksanaan += Math.floor(Math.random() * 11) + 10;
        disiplin += Math.floor(Math.random() * 5) + 4;
        fokus += Math.floor(Math.random() * 5) + 4;
        kekuatan += Math.floor(Math.random() * 5) + 4;
        kepercayaanDiri += Math.floor(Math.random() * 5) + 4;
      }
      if (selectedCats.includes("Mindfulness")) {
        fokus += 15;
        disiplin += Math.floor(Math.random() * 5) + 4;
        kebijaksanaan += Math.floor(Math.random() * 5) + 4;
        kekuatan += Math.floor(Math.random() * 5) + 4;
        kepercayaanDiri += Math.floor(Math.random() * 5) + 4;
      }
      if (selectedCats.includes("Physical Exercise")) {
        kekuatan += 15;
        disiplin += Math.floor(Math.random() * 5) + 4;
        fokus += Math.floor(Math.random() * 5) + 4;
        kebijaksanaan += Math.floor(Math.random() * 5) + 4;
        kepercayaanDiri += Math.floor(Math.random() * 5) + 4;
      }

      const statsToSet = {
        kebijaksanaan: Math.min(45, kebijaksanaan),
        kepercayaanDiri: Math.min(45, kepercayaanDiri),
        kekuatan: Math.min(45, kekuatan),
        disiplin: Math.min(45, disiplin),
        fokus: Math.min(45, fokus)
      };

      if (user) {
        const computedFullName = profileData.nickname || `${profileData.firstName} ${profileData.lastName}`.trim() || user.user_metadata?.full_name || '';
        const sanitizedFullName = (computedFullName.toLowerCase().includes('yaser') || computedFullName.toLowerCase().includes('arafat')) 
          ? 'Yaman Dien' 
          : computedFullName;
        const computedNickname = profileData.username || user.user_metadata?.name || user.user_metadata?.full_name?.split(' ')[0]?.toLowerCase() || '';

        try {
          // Sync settings inputs and survey answers to profiles table in Supabase
          await Promise.race([
            supabase.from('profiles').update({
              full_name: sanitizedFullName,
              nickname: computedNickname,
              onboarding_data: { ...answers, programDuration: durationVal },
              updated_at: new Date().toISOString()
            }).eq('id', user.id),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
          ]);
        } catch (dbErr) {
          console.warn("DB profiles write timed out or failed:", dbErr);
        }

        // Update local Zustand user store instantly
        const existingProfile = useUserStore.getState().profile;
        useUserStore.setState({
          profile: existingProfile ? {
            ...existingProfile,
            full_name: sanitizedFullName,
            nickname: computedNickname
          } : {
            id: user.id,
            full_name: sanitizedFullName,
            nickname: computedNickname,
            created_at: user.created_at || new Date().toISOString(),
            is_pro: false,
            streak_count: 0,
            streak_freeze_count: 0
          } as any
        });

        try {
          // Reset and insert user_stats in Supabase
          await Promise.race([
            supabase.from('user_stats').upsert({
              user_id: user.id,
              total_xp: 150,
              level: 1,
              stat_kebijaksanaan: statsToSet.kebijaksanaan,
              stat_kepercayaan_diri: statsToSet.kepercayaanDiri,
              stat_kekuatan: statsToSet.kekuatan,
              stat_disiplin: statsToSet.disiplin,
              stat_fokus: statsToSet.fokus,
              daily_xp_earned: 0,
              daily_feed_xp_earned: 0,
              daily_journal_count: 0,
              daily_stat_kebijaksanaan: 0,
              daily_stat_kepercayaan_diri: 0,
              daily_stat_kekuatan: 0,
              daily_stat_disiplin: 0,
              daily_stat_fokus: 0,
              last_reset_date: new Date().toLocaleDateString('en-CA'),
              migration_completed: true,
              completed_todo_ids: [],
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
          ]);
        } catch (dbErr) {
          console.warn("DB user_stats upsert timed out or failed:", dbErr);
        }

        // Update local Zustand store
        useProgressionStore.setState({
          totalXP: 150,
          level: 1,
          stats: statsToSet,
          migrationCompleted: true,
          userId: user.id
        });
      } else {
        // Guest mode fallback
        useProgressionStore.setState({
          totalXP: 150,
          level: 1,
          stats: statsToSet,
          migrationCompleted: true
        });
      }

      // Add selected habits to habit store!
      const habitStore = useHabitStore.getState();
      useHabitStore.setState({ habits: [] }); // Clear local habits first!

      if (localStorage.getItem('guest_mode') !== 'true' && user) {
        try {
          // Delete all old habits in Supabase first to prevent duplicates when starting a new program!
          await supabase.from('habits').delete().eq('user_id', user.id);
        } catch (delErr) {
          console.warn("Could not delete old habits in Supabase:", delErr);
        }
      }

      let index = 0;
      for (const h of acceptedHabits) {
        try {
          await Promise.race([
            habitStore.addHabit({
              name: h.name,
              subtitle: h.subtitle || '',
              frequency: h.frequency || 'harian',
              difficulty: h.difficulty || 1,
              iconName: h.iconName || 'Sunrise',
              category: h.category,
              color: h.color || '#10B981',
              completed: false,
              skipped: false,
              isSpecial: false,
              specialLabel: '',
              imageUrl: h.imageUrl,
              imagePosition: h.imagePosition || 'object-center',
              position: index++,
              target_intensity: null,
              current_intensity: 0,
              schedule_type: 'daily',
              schedule_days: [0, 1, 2, 3, 4, 5, 6]
            }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500))
          ]);
        } catch (hErr) {
          console.warn("Add habit write timed out or failed:", hErr);
        }
      }

      navigate('/notif');
    } catch (error) {
      console.error("Error saving onboarding details:", error);
      navigate('/notif');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (showCountryPicker) setShowCountryPicker(false);
    else if (currentStep > 1) navigate(`/questions/${currentStep - 1}`);
    else navigate('/questions/0');
  };

  const toggleOption = (option: string) => {
    if (isTransitioning) return;
    // Step 7 is residency selector. Selecting "Luar Negeri" (or "Abroad") opens country search
    if (currentStep === 7 && (option === "Luar Negeri" || option === "Abroad")) {
      setShowCountryPicker(true);
      return;
    }

    if (currentQuestion?.type === "single") {
      setSelectedOptions([option]);
      setIsTransitioning(true);
      setTimeout(() => handleNext([option]), 450);
    } else {
      setSelectedOptions(prev => {
        if (prev.includes(option)) return prev.filter(i => i !== option);
        if (currentQuestion?.max && prev.length >= currentQuestion.max) return prev;
        return [...prev, option];
      });
    }
  };

  const isContinueEnabled = () => {
    if (currentStep === 1) return firstName.trim().length > 0;
    if (currentStep === 2) return nickname.trim().length > 0;
    if (currentStep === 3) return username.trim().length > 0;
    if (currentStep === 4) return gender !== '';
    if (currentStep === 5) return dob.trim().length >= 8;
    if (currentStep === 6) return true; // Optional! Weight & Height can be skipped

    // Survey steps
    if (currentQuestion?.type === "multi") return selectedOptions.length > 0;
    if (currentQuestion?.type === "single") return selectedOptions.length > 0;
    return false;
  };

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

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: CUBIC_BEZIER } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } }
  };

  // --- COUNTRY PICKER ---
  if (showCountryPicker) {
    const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const getCountryCode = (name: string): string => {
      const codes: Record<string, string> = {
        "Afghanistan": "af", "Albania": "al", "Algeria": "dz", "Andorra": "ad", "Angola": "ao", 
        "Antigua and Barbuda": "ag", "Argentina": "ar", "Armenia": "am", "Australia": "au", "Austria": "at", 
        "Azerbaijan": "az", "Bahamas": "bs", "Bahrain": "bh", "Bangladesh": "bd", "Barbados": "bb", 
        "Belarus": "by", "Belgium": "be", "Belize": "bz", "Benin": "bj", "Bhutan": "bt", 
        "Bolivia": "bo", "Bosnia and Herzegovina": "ba", "Botswana": "bw", "Brazil": "br", "Brunei": "bn", 
        "Bulgaria": "bg", "Burkina Faso": "bf", "Burundi": "bi", "Cabo Verde": "cv", "Cambodia": "kh", 
        "Cameroon": "cm", "Canada": "ca", "Central African Republic": "cf", "Chad": "td", "Chile": "cl", 
        "China": "cn", "Colombia": "co", "Comoros": "km", "Congo": "cg", "Costa Rica": "cr", 
        "Croatia": "hr", "Cuba": "cu", "Cyprus": "cy", "Czech Republic": "cz", "Denmark": "dk", 
        "Djibouti": "dj", "Dominica": "dm", "Dominican Republic": "do", "Ecuador": "ec", "Egypt": "eg", 
        "El Salvador": "sv", "Equatorial Guinea": "gq", "Eritrea": "er", "Estonia": "ee", "Eswatini": "sz", 
        "Ethiopia": "et", "Fiji": "fj", "Finland": "fi", "France": "fr", "Gabon": "ga", 
        "Gambia": "gm", "Georgia": "ge", "Germany": "de", "Ghana": "gh", "Greece": "gr", 
        "Grenada": "gd", "Guatemala": "gt", "Guinea": "gn", "Guyana": "gy", "Haiti": "ht", 
        "Honduras": "hn", "Hungary": "hu", "Iceland": "is", "India": "in", "Iran": "ir", 
        "Iraq": "iq", "Ireland": "ie", "Israel": "il", "Italy": "it", "Jamaica": "jm", 
        "Japan": "jp", "Jordan": "jo", "Kazakhstan": "kz", "Kenya": "ke", "Kiribati": "ki", 
        "Korea, North": "kp", "Korea, South": "kr", "Kuwait": "kw", "Kyrgyzstan": "kg", "Laos": "la", 
        "Latvia": "lv", "Lebanon": "lb", "Lesotho": "ls", "Liberia": "lr", "Libya": "ly", 
        "Liechtenstein": "li", "Lithuania": "lt", "Luxembourg": "lu", "Madagascar": "mg", "Malawi": "mw", 
        "Malaysia": "my", "Maldives": "mv", "Mali": "ml", "Malta": "mt", "Marshall Islands": "mh", 
        "Mauritania": "mr", "Mauritius": "mu", "Mexico": "mx", "Micronesia": "fm", "Moldova": "md", 
        "Monaco": "mc", "Mongolia": "mn", "Montenegro": "me", "Morocco": "ma", "Mozambique": "mz", 
        "Myanmar": "mm", "Namibia": "na", "Nauru": "nr", "Nepal": "np", "Netherlands": "nl", 
        "New Zealand": "nz", "Nicaragua": "ni", "Niger": "ne", "Nigeria": "ng", "Norway": "no", 
        "Oman": "om", "Pakistan": "pk", "Palau": "pw", "Panama": "pa", "Papua New Guinea": "pg", 
        "Paraguay": "py", "Peru": "pe", "Philippines": "ph", "Poland": "pl", "Portugal": "pt", 
        "Qatar": "qa", "Romania": "ro", "Russia": "ru", "Rwanda": "rw", "Saint Kitts and Nevis": "kn", 
        "Saint Lucia": "lc", "Samoa": "ws", "San Marino": "sm", "Saudi Arabia": "sa", "Senegal": "sn", 
        "Serbia": "rs", "Seychelles": "sc", "Sierra Leone": "sl", "Singapore": "sg", "Slovakia": "sk", 
        "Slovenia": "si", "Solomon Islands": "sb", "Somalia": "so", "South Africa": "za", "Spain": "es", 
        "Sri Lanka": "lk", "Sudan": "sd", "Suriname": "sr", "Sweden": "se", "Switzerland": "ch", 
        "Syria": "sy", "Taiwan": "tw", "Tajikistan": "tj", "Tanzania": "tz", "Thailand": "th", 
        "Timor-Leste": "tl", "Togo": "tg", "Tonga": "to", "Trinidad and Tobago": "tt", "Tunisia": "tn", 
        "Turkey": "tr", "Turkmenistan": "tm", "Tuvalu": "tv", "Uganda": "ug", "Ukraine": "ua", 
        "United Arab Emirates": "ae", "United Kingdom": "gb", "United States": "us", "Uruguay": "uy", 
        "Uzbekistan": "uz", "Vanuatu": "vu", "Vatican City": "va", "Venezuela": "ve", "Vietnam": "vn", 
        "Yemen": "ye", "Zambia": "zm", "Zimbabwe": "zw"
      };
      return codes[name] || "";
    };

    return (
      <div className="min-h-screen bg-black text-white font-['Inter'] relative flex flex-col items-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] bg-[#10B981]/05 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="relative z-20 w-full px-6 pt-12 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-[#1A1A1A] border-2 border-white/20 rounded-xl active:scale-95 transition-transform shadow-[3px_3px_0px_rgba(255,255,255,0.15)]">
              <Icon icon="ph:caret-left-bold" className="text-white" width={20} height={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="font-['Outfit'] text-[20px] font-black leading-tight">
                {language === 'Bahasa Indonesia' ? 'Pilih Negara' : 'Select Country'}
              </h2>
              <span className="text-[11px] text-white/40 font-medium">
                {language === 'Bahasa Indonesia' 
                  ? `${filteredCountries.length} negara tersedia` 
                  : `${filteredCountries.length} countries available`}
              </span>
            </div>
          </div>
          <div className="relative">
            <Icon icon="solar:magnifer-bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width={18} height={18} />
            <input 
              type="text" 
              placeholder={language === 'Bahasa Indonesia' ? 'Cari negara...' : 'Search country...'} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              autoFocus
              autoComplete="off"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-[15px] font-['Outfit'] focus:outline-none focus:border-[#10B981]/40 focus:bg-[#10B981]/5 transition-all" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border-[1.5px] flex items-center justify-center transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                    : 'bg-black border-white text-white shadow-[2px_2px_0px_rgba(255,255,255,0.6)]'
                }`}
              >
                <Icon icon="ph:x-bold" width={11} height={11} />
              </button>
            )}
          </div>
        </div>
        <div className="relative z-10 flex-1 w-full overflow-y-auto px-6 py-4 mt-2 custom-scrollbar">
          {filteredCountries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon icon="ph:magnifying-glass-bold" className="text-white/20 mb-4" width={40} />
              <p className="text-white/40 font-['Outfit'] font-bold text-[15px]">
                {language === 'Bahasa Indonesia' ? 'Negara tidak ditemukan' : 'No country found'}
              </p>
              <p className="text-white/25 text-[12px] mt-1">
                {language === 'Bahasa Indonesia' ? 'Coba kata kunci lain' : 'Try a different keyword'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-10">
              {filteredCountries.map((country, idx) => {
                const code = getCountryCode(country);
                return (
                  <motion.button 
                    key={idx} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedOptions([country]); setIsTransitioning(true); setTimeout(() => handleNext([country]), 450); }} 
                    className="w-full py-3.5 px-4 bg-[#1A1A1A] border border-[#E3DAC9]/15 rounded-xl text-left hover:border-[#10B981]/40 hover:bg-[#10B981]/5 active:scale-[0.99] transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center gap-3"
                  >
                    <div className="w-7 h-5 flex items-center justify-center bg-white/5 rounded overflow-hidden shrink-0 border border-white/10">
                      {code ? (
                        <img 
                          src={`https://flagcdn.com/w40/${code}.png`} 
                          alt={country} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // fallback to globe icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const placeholder = document.createElement('span');
                              placeholder.innerText = '🌍';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-[14px]">🌍</span>
                      )}
                    </div>
                    <span className="text-white/80 font-bold font-['Outfit'] tracking-wide text-[14px]">{country}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- LANGUAGE SELECT SCREEN (BEFORE STEP 0) ---
  if (!hasSelectedLang && currentStep === 0) {
    // Default language selection to English if not set
    if (!settings.language) {
      updateSettings({ language: 'English' });
    }

    const trans = getPreferencesTranslation(settings.language || 'English');

    return (
      <div className={`min-h-screen font-['Inter'] relative flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none transition-colors duration-300 ${isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>


        {/* TOP TITLE */}
        <div className="relative z-10 w-full max-w-[400px] text-center mt-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
            className={`text-[26px] font-black font-['Outfit'] tracking-wide leading-tight px-4 ${isLight ? 'text-black' : 'text-white'}`}
          >
            {settings.language === 'Bahasa Indonesia' ? 'Pilih Bahasa' : 'Choose Language'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-[11px] mt-1 font-medium px-6 ${isLight ? 'text-neutral-500' : 'text-white/40'}`}
          >
            {settings.language === 'Bahasa Indonesia' 
              ? 'Pilih bahasa pilihan Anda untuk memulai program' 
              : 'Choose your preferred language to start the program'}
          </motion.p>
        </div>

        {/* MIDDLE CONTENT: 1 Column Scrollable List (Max 5 items visible) */}
        <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-4 my-auto">
          <div className="flex flex-col gap-2 w-full max-h-[295px] overflow-y-auto pr-1 custom-scrollbar">
            {LANGUAGES_MAP.map((lang) => {
              const isSelected = (settings.language || 'English') === lang.name;
              return (
                <motion.button
                  key={lang.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    updateSettings({ language: lang.name as any });
                  }}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl border-2 text-left transition-all duration-200 backdrop-blur-md shadow-[3px_3px_0px_rgba(0,0,0,1)] ${
                    isSelected 
                      ? isLight 
                        ? 'bg-[#10B981]/20 border-black text-black' 
                        : 'bg-[#10B981]/10 border-[#10B981] text-white' 
                      : isLight 
                        ? 'bg-white border-black text-black hover:bg-neutral-50' 
                        : 'bg-[#111]/85 border-white/[0.08] text-white/70 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon icon={lang.flagIcon} width={24} height={24} className="shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[13px] font-black font-['Outfit'] truncate leading-tight ${isLight ? 'text-black' : 'text-white'}`}>
                        {lang.name}
                      </span>
                      <span className={`text-[9px] font-semibold truncate leading-none mt-0.5 ${isLight ? 'text-black/45' : 'text-white/40'}`}>
                        {lang.sub}
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? isLight ? 'bg-[#10B981] border-black' : 'bg-[#10B981] border-[#10B981]' 
                      : isLight ? 'bg-transparent border-black/20' : 'bg-transparent border-white/20'
                  }`}>
                    {isSelected && <Icon icon="ph:check-bold" className="text-black font-bold text-[10px]" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* FOOTER & BUTTON */}
        <div className="relative z-10 w-full max-w-[400px] text-center flex flex-col items-center gap-4 mt-4">
          <CinematicButton
            onClick={() => {
              if (!settings.language) {
                updateSettings({ language: 'English' });
              }
              localStorage.setItem('onboarding_lang_selected', 'true');
              setHasSelectedLang(true);
            }}
            className="w-full"
          >
            {trans.continueBtn}
          </CinematicButton>
          <p className={`text-[10px] font-medium tracking-wide ${isLight ? 'text-black/40' : 'text-white/30'}`}>
            {settings.language === 'Bahasa Indonesia' 
              ? 'Bahasa dapat diubah kapan saja di pengaturan' 
              : 'Language can be changed anytime in settings'}
          </p>
        </div>
      </div>
    );
  }

  // --- THEME SELECT SCREEN (BEFORE STEP 0, AFTER LANGUAGE) ---
  if (hasSelectedLang && !hasSelectedTheme && currentStep === 0) {
    const activeTheme = settings.theme || 'Light';
    const trans = getPreferencesTranslation(settings.language || 'English');

    return (
      <div className={`min-h-screen font-['Inter'] relative flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none transition-colors duration-300 ${isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>


        {/* TOP TITLE */}
        <div className="relative z-10 w-full max-w-[400px] text-center mt-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
            className={`text-[26px] font-black font-['Outfit'] tracking-wide leading-tight px-4 ${isLight ? 'text-black' : 'text-white'}`}
          >
            {trans.themeLabel}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-[11px] mt-1 font-medium px-6 ${isLight ? 'text-neutral-500' : 'text-white/40'}`}
          >
            {settings.language === 'Bahasa Indonesia' 
              ? 'Pilih tema tampilan aplikasi pilihan Anda' 
              : 'Choose your preferred app display theme'}
          </motion.p>
        </div>

        {/* MIDDLE CONTENT: Theme Cards Selector */}
        <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-4 my-auto">
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Light Mode Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => updateSettings({ theme: 'Light' })}
              className={`relative py-5 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                activeTheme === 'Light'
                  ? 'bg-[#E3DAC9] border-black text-black'
                  : 'bg-[#111]/85 border-white/[0.08] text-white/60 hover:border-white/20'
              }`}
            >
              <Icon icon="ph:sun-bold" width={28} height={28} className={activeTheme === 'Light' ? 'text-amber-500 font-bold' : ''} />
              <span className="text-[12px] font-black font-['Outfit'] uppercase tracking-wider">
                {trans.lightMode}
              </span>
              <span className={`absolute -top-2.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                activeTheme === 'Light' ? 'bg-[#10B981] text-black' : 'bg-neutral-800 text-white/40 border-white/10'
              }`}>
                {trans.recommended}
              </span>
            </motion.button>

            {/* Dark Mode Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => updateSettings({ theme: 'Dark' })}
              className={`py-5 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                activeTheme === 'Dark'
                  ? 'bg-[#1a1a1a] border-[#10B981] text-white'
                  : 'bg-[#111]/85 border-white/[0.08] text-white/60 hover:border-white/20'
              }`}
            >
              <Icon icon="ph:moon-bold" width={28} height={28} className={activeTheme === 'Dark' ? 'text-indigo-400' : ''} />
              <span className="text-[12px] font-black font-['Outfit'] uppercase tracking-wider">
                {trans.darkMode}
              </span>
            </motion.button>
          </div>
        </div>

        {/* FOOTER & BUTTON */}
        <div className="relative z-10 w-full max-w-[400px] text-center flex flex-col items-center gap-4 mt-4">
          <CinematicButton
            onClick={() => {
              if (!settings.theme) {
                updateSettings({ theme: 'Light' });
              }
              localStorage.setItem('onboarding_theme_selected', 'true');
              setHasSelectedTheme(true);
            }}
            className="w-full"
          >
            {trans.continueBtn}
          </CinematicButton>
          <p className={`text-[10px] font-medium tracking-wide ${isLight ? 'text-black/40' : 'text-white/30'}`}>
            {trans.footerHint}
          </p>
        </div>
      </div>
    );
  }

  // --- STEP 0: INTRO ---
  if (currentStep === 0) {
    const isIndo = language === 'Bahasa Indonesia';
    return (
      <div className={`min-h-screen font-['Inter'] relative flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none transition-colors duration-300 ${isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>
        


        {/* TOP TITLE */}
        <div className="relative z-10 w-full max-w-[400px] text-center mt-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
            className={`text-[24px] font-black font-['Outfit'] tracking-wide leading-snug px-4 ${isLight ? 'text-black' : 'text-white'}`}
          >
            {isIndo ? 'Mengenal situasi Anda' : 'Understanding your situation'}
          </motion.h1>
        </div>

        {/* MIDDLE SPACER */}
        <div className="flex-1" />

        {/* BOTTOM CONTENT */}
        <div className="relative z-10 w-full max-w-[400px] text-center flex flex-col items-center gap-6 mb-4">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={`text-[13px] font-medium px-4 leading-relaxed ${isLight ? 'text-black/60' : 'text-white/50'}`}
          >
            {isIndo 
              ? 'Kami akan membantu merancang program yang sesuai untuk kebutuhan hidup Anda.' 
              : 'We will help design a program tailored to your life needs.'}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full"
          >
            <CinematicButton 
              onClick={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase.from('user_stats').delete().eq('user_id', user.id);
                  }
                } catch (err) {
                  console.error("Failed to reset onboarding user stats:", err);
                }
                useProgressionStore.setState({
                  totalXP: 0,
                  level: 1,
                  stats: { kebijaksanaan: 0, kepercayaanDiri: 0, kekuatan: 0, disiplin: 0, fokus: 0 },
                  dailyXPEarned: 0,
                  dailyFeedXPEarned: 0,
                  dailyJournalCount: 0,
                  dailyStatEarned: { kebijaksanaan: 0, kepercayaanDiri: 0, kekuatan: 0, disiplin: 0, fokus: 0 },
                  completedTodoIds: []
                });
                navigate('/questions/1');
              }} 
              className="w-full"
            >
              {isIndo ? 'Mulai sekarang' : 'Start now'}
            </CinematicButton>
          </motion.div>
        </div>

      </div>
    );
  }

  // Render Custom Profile Detail Steps
  const renderCustomStepContent = () => {
    const isIndo = language === 'Bahasa Indonesia';

    switch (currentStep) {
      case 1: // Nama Lengkap
        return (
          <div className="flex flex-col gap-5 w-full">
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/40'}`}>
                {isIndo ? 'Nama Depan' : 'First Name'}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={isIndo ? "Nama Depan" : "First Name"}
                className={`w-full border-2 rounded-xl py-4 px-6 text-sm outline-none transition-all font-['Outfit'] font-bold tracking-wide ${
                  isLight 
                    ? 'bg-white border-black text-black focus:border-[#10B981] placeholder:text-black/30 shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                    : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white focus:border-[#10B981] placeholder:text-white/20'
                }`}
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/40'}`}>
                {isIndo ? 'Nama Belakang' : 'Last Name'}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={isIndo ? "Nama Belakang" : "Last Name"}
                className={`w-full border-2 rounded-xl py-4 px-6 text-sm outline-none transition-all font-['Outfit'] font-bold tracking-wide ${
                  isLight 
                    ? 'bg-white border-black text-black focus:border-[#10B981] placeholder:text-black/30 shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                    : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white focus:border-[#10B981] placeholder:text-white/20'
                }`}
                autoComplete="off"
              />
            </div>
          </div>
        );
      case 2: // Nickname
        return (
          <div className="space-y-2 w-full">
            <label className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/40'}`}>
              {isIndo ? 'Nama Panggilan / Nama User' : 'Display Nickname / User Name'}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={isIndo ? "Nama Panggilan" : "Nickname"}
              className={`w-full border-2 rounded-xl py-4 px-6 text-sm outline-none transition-all font-['Outfit'] font-bold tracking-wide ${
                isLight 
                  ? 'bg-white border-black text-black focus:border-[#10B981] placeholder:text-black/30 shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                  : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white focus:border-[#10B981] placeholder:text-white/20'
              }`}
              autoFocus
              autoComplete="off"
            />
          </div>
        );
      case 3: // Username
        return (
          <div className="space-y-2 w-full">
            <label className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/40'}`}>
              {isIndo ? 'Username Unik' : 'Unique Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              className={`w-full border-2 rounded-xl py-4 px-6 text-sm outline-none transition-all font-['Outfit'] font-bold tracking-wide ${
                isLight 
                  ? 'bg-white border-black text-[#10B981] focus:border-[#10B981] placeholder:text-[#10B981]/40 shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                  : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-[#10B981] focus:border-[#10B981] placeholder:text-[#10B981]/20'
              }`}
              autoFocus
              autoComplete="off"
            />
            <p className={`text-[11px] font-medium ${isLight ? 'text-black/40' : 'text-white/30'}`}>
              {isIndo 
                ? 'Username ini akan digunakan di halaman Global dan harus bersifat unik.'
                : 'This username will be used on the Global leaderboard and must be unique.'}
            </p>
          </div>
        );
      case 4: // Gender with Large Vector Cards
        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-4">
              {/* Laki-laki / Male */}
              <motion.button
                whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                onClick={() => {
                  setGender('Male');
                  updateSettings({ gender: 'Male' });
                  setTimeout(() => {
                    const updatedAnswers = { ...allAnswers, [currentStep]: [] };
                    setAllAnswers(updatedAnswers);
                    navigate(`/questions/${currentStep + 1}`);
                  }, 300);
                }}
                className={`py-8 px-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                  gender === 'Male'
                    ? isLight 
                      ? 'bg-[#10B981]/20 border-black text-black'
                      : 'bg-[#10B981]/10 border-[#10B981] text-white'
                    : isLight
                      ? 'bg-white border-black text-neutral-400 hover:text-neutral-700'
                      : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white/40 hover:border-[#E3DAC9]/40 hover:text-white/60'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${
                  gender === 'Male' 
                    ? isLight ? 'border-black bg-[#10B981]/35' : 'border-[#10B981] bg-[#10B981]/10' 
                    : isLight ? 'border-black/10 bg-neutral-50' : 'border-white/10 bg-black/40'
                }`}>
                  <Icon icon="ph:gender-male-bold" className={gender === 'Male' ? (isLight ? 'text-black' : 'text-[#10B981]') : 'text-neutral-400'} width={36} height={36} />
                </div>
                <span className={`text-sm font-black font-['Outfit'] tracking-wider ${gender === 'Male' ? (isLight ? 'text-black' : 'text-white') : isLight ? 'text-neutral-700' : 'text-white/40'}`}>
                  {isIndo ? 'Laki-laki' : 'Male'}
                </span>
              </motion.button>
 
              {/* Perempuan / Female */}
              <motion.button
                whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                onClick={() => {
                  setGender('Female');
                  updateSettings({ gender: 'Female' });
                  setTimeout(() => {
                    const updatedAnswers = { ...allAnswers, [currentStep]: [] };
                    setAllAnswers(updatedAnswers);
                    navigate(`/questions/${currentStep + 1}`);
                  }, 300);
                }}
                className={`py-8 px-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                  gender === 'Female'
                    ? isLight 
                      ? 'bg-[#10B981]/20 border-black text-black'
                      : 'bg-[#10B981]/10 border-[#10B981] text-white'
                    : isLight
                      ? 'bg-white border-black text-neutral-400 hover:text-neutral-700'
                      : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white/40 hover:border-[#E3DAC9]/40 hover:text-white/60'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${
                  gender === 'Female' 
                    ? isLight ? 'border-black bg-[#10B981]/35' : 'border-[#10B981] bg-[#10B981]/10' 
                    : isLight ? 'border-black/10 bg-neutral-50' : 'border-white/10 bg-black/40'
                }`}>
                  <Icon icon="ph:gender-female-bold" className={gender === 'Female' ? (isLight ? 'text-black' : 'text-[#10B981]') : 'text-neutral-400'} width={36} height={36} />
                </div>
                <span className={`text-sm font-black font-['Outfit'] tracking-wider ${gender === 'Female' ? (isLight ? 'text-black' : 'text-white') : isLight ? 'text-neutral-700' : 'text-white/40'}`}>
                  {isIndo ? 'Perempuan' : 'Female'}
                </span>
              </motion.button>
            </div>
 
            {/* Lainnya / Other */}
            <motion.button
              whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
              onClick={() => {
                setGender('Other');
                updateSettings({ gender: 'Other' });
                setTimeout(() => {
                  const updatedAnswers = { ...allAnswers, [currentStep]: [] };
                  setAllAnswers(updatedAnswers);
                  navigate(`/questions/${currentStep + 1}`);
                }, 300);
              }}
              className={`py-4 px-6 rounded-xl border-2 flex items-center justify-center gap-3 transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                gender === 'Other'
                  ? isLight
                    ? 'bg-[#10B981]/20 border-black text-black'
                    : 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                  : isLight
                    ? 'bg-white border-black text-neutral-400 hover:text-neutral-700'
                    : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white/40 hover:border-[#E3DAC9]/40 hover:text-white/60'
              }`}
            >
              <Icon icon="ph:gender-neuter-bold" className={gender === 'Other' ? (isLight ? 'text-black' : 'text-[#10B981]') : 'text-neutral-400'} width={20} height={20} />
              <span className={`text-xs font-black font-['Outfit'] tracking-wider ${gender === 'Other' ? (isLight ? 'text-black font-extrabold' : 'text-white font-extrabold') : isLight ? 'text-neutral-700 font-bold' : 'text-white/40'}`}>
                {isIndo ? 'Lainnya' : 'Other'}
              </span>
            </motion.button>
          </div>
        );
      case 5: { // Custom Calendar Sheet Picker with nested 3D Wheel Picker
        const activeMonths = MONTH_NAMES[language as keyof typeof MONTH_NAMES] || MONTH_NAMES['English'];
        const isIndo = language === 'Bahasa Indonesia';

        // Month navigation handlers
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

        // Grid calculations
        const firstWeekday = new Date(selYear, selMonth - 1, 1).getDay();
        const blanks = Array.from({ length: firstWeekday }, (_, i) => null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const gridItems = [...blanks, ...days];

        const weekdays = isIndo 
          ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
          <div className="flex flex-col items-center w-full gap-4">
            <div className={`relative border-[2px] rounded-[28px] p-5 w-full max-w-[340px] select-none mx-auto flex flex-col gap-3 transition-colors ${
              isLight 
                ? 'bg-[#F9F9F6] border-black text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                : 'bg-[#262626] border-white/10 text-white shadow-[5px_5px_0px_rgba(0,0,0,1)]'
            }`}>
              {/* Calendar Header Row */}
              <div className="flex justify-between items-center px-1 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    setShowWheelMode(!showWheelMode);
                  }}
                  className={`flex items-center gap-1.5 text-sm font-black font-['Outfit'] transition-colors ${
                    isLight ? 'text-black hover:text-[#10B981]' : 'text-white hover:text-[#10B981]'
                  }`}
                >
                  <span>{activeMonths[selMonth - 1]} {selYear}</span>
                  <Icon 
                    icon={showWheelMode ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-right-bold"} 
                    className="text-[#10B981]" 
                    width={14} 
                  />
                </button>

                {/* Back/Next Month Navigation (Only when in grid mode) */}
                {!showWheelMode ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className={`w-7 h-7 flex items-center justify-center border-2 rounded-lg active:scale-90 transition-all ${
                        isLight 
                          ? 'bg-white border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                          : 'bg-[#1A1A1A] border-white/20 text-white shadow-[2px_2px_0px_rgba(255,255,255,0.15)]'
                      }`}
                    >
                      <Icon icon="ph:caret-left-bold" width={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className={`w-7 h-7 flex items-center justify-center border-2 rounded-lg active:scale-90 transition-all ${
                        isLight 
                          ? 'bg-white border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                          : 'bg-[#1A1A1A] border-white/20 text-white shadow-[2px_2px_0px_rgba(255,255,255,0.15)]'
                      }`}
                    >
                      <Icon icon="ph:caret-right-bold" width={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(10);
                      setShowWheelMode(false);
                    }}
                    className={`text-xs font-black font-['Outfit'] transition-colors ${
                      isLight ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {isIndo ? 'Kembali' : 'Back'}
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="relative min-h-[200px] flex items-center justify-center">
                {showWheelMode ? (
                  /* 3D Wheel Picker Mode */
                  <div className={`relative border rounded-xl flex gap-0 h-[200px] w-full overflow-hidden py-0 px-2 select-none shadow-[inset_0_4px_12px_rgba(0,0,0,0.1),inset_0_-4px_12px_rgba(0,0,0,0.1)] ${isLight ? 'bg-black/[0.02] border-black/10' : 'bg-black/40 border-white/[0.05]'}`}>
                    {/* Apple-style Glass Lens Selector Overlay */}
                    <div className={`absolute top-[78px] left-2 right-2 h-11 pointer-events-none rounded-lg z-20 ${isLight ? 'bg-black/[0.04] border-y border-black/15' : 'bg-white/[0.03] border-y border-white/[0.08]'}`} />
                    {/* Fade overlays */}
                    <div className={`absolute top-0 left-0 right-0 h-12 pointer-events-none z-20 ${isLight ? 'bg-gradient-to-b from-[#F9F9F6] via-[#F9F9F6]/80 to-transparent' : 'bg-gradient-to-b from-[#262626] via-[#262626]/80 to-transparent'}`} />
                    <div className={`absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-20 ${isLight ? 'bg-gradient-to-t from-[#F9F9F6] via-[#F9F9F6]/80 to-transparent' : 'bg-gradient-to-t from-[#262626] via-[#262626]/80 to-transparent'}`} />
 
                    {/* Column: Month */}
                    <div 
                      ref={monthScrollRef} 
                      onScroll={(e) => handleWheelScroll(e, 'month')} 
                      className={`snap-y snap-mandatory overflow-y-auto scrollbar-hide h-full flex-1 text-center relative z-10 ${isLight ? 'border-r border-black/10' : 'border-r border-white/[0.05]'}`}
                    >
                      <div className="h-[78px] shrink-0 pointer-events-none" />
                      {activeMonths.map((name, i) => {
                        const val = i + 1;
                        const isSelected = selMonth === val;
                        return (
                          <div 
                            key={i} 
                            className={`snap-center h-11 flex items-center justify-center text-xs font-black transition-colors duration-200 ${
                              isSelected ? 'text-[#10B981]' : isLight ? 'text-black/35' : 'text-white/30'
                            }`}
                          >
                            {name}
                          </div>
                        );
                      })}
                      <div className="h-[78px] shrink-0 pointer-events-none" />
                    </div>
        
                    {/* Column: Year */}
                    <div 
                      ref={yearScrollRef} 
                      onScroll={(e) => handleWheelScroll(e, 'year')} 
                      className="snap-y snap-mandatory overflow-y-auto scrollbar-hide h-full flex-1 text-center relative z-10"
                    >
                      <div className="h-[78px] shrink-0 pointer-events-none" />
                      {Array.from({ length: 76 }, (_, i) => {
                        const val = 2015 - i;
                        const isSelected = selYear === val;
                        return (
                          <div 
                            key={i} 
                            className={`snap-center h-11 flex items-center justify-center text-[18px] font-black transition-colors duration-200 ${
                              isSelected ? 'text-[#10B981]' : isLight ? 'text-black/35' : 'text-white/30'
                            }`}
                          >
                            {val}
                          </div>
                        );
                      })}
                      <div className="h-[78px] shrink-0 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  /* Grid Day Mode */
                  <div className="w-full flex flex-col gap-2">
                    {/* Weekdays Row */}
                    <div className="grid grid-cols-7 text-center">
                      {weekdays.map((wd, i) => (
                        <span key={i} className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-black/35' : 'text-white/30'}`}>
                          {wd}
                        </span>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 mt-1 justify-items-center">
                      {gridItems.map((val, i) => {
                        if (val === null) {
                          return <div key={i} className="w-8 h-8" />;
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
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              isSelected 
                                ? 'bg-[#10B981] text-black border-[1.5px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                                : isLight 
                                  ? 'text-black hover:bg-black/5 active:scale-90'
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
            
            {/* Display parsed result */}
            <p className={`text-xs font-bold tracking-wide font-['Outfit'] mt-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>
              {isIndo ? 'Tanggal Lahir:' : 'Date of Birth:'} <span className="text-[#10B981] font-black">{dob}</span>
            </p>
          </div>
        );
      }
      case 6: // Weight & Height (Optional)
        return (
          <div className="flex flex-col gap-5 w-full">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/40'}`}>
                  {isIndo ? 'Berat (kg)' : 'Weight (kg)'}
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  className={`w-full border-2 rounded-xl py-4 px-6 text-sm outline-none transition-all font-['Outfit'] font-bold tracking-wide ${
                    isLight 
                      ? 'bg-white border-black text-black focus:border-[#10B981] placeholder:text-black/30 shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                      : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white focus:border-[#10B981] placeholder:text-white/20'
                  }`}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-neutral-500 font-extrabold' : 'text-white/40'}`}>
                  {isIndo ? 'Tinggi (cm)' : 'Height (cm)'}
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className={`w-full border-2 rounded-xl py-4 px-6 text-sm outline-none transition-all font-['Outfit'] font-bold tracking-wide ${
                    isLight 
                      ? 'bg-white border-black text-black focus:border-[#10B981] placeholder:text-black/30 shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                      : 'bg-[#1A1A1A] border-[#E3DAC9]/20 text-white focus:border-[#10B981] placeholder:text-white/20'
                  }`}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (currentStep === 15) {
    return <GlitchLoadingScreen language={language} onNext={() => navigate('/questions/16')} />;
  }
  if (currentStep === 16) {
    return <SwipeDeckScreen answers={allAnswers} onComplete={(habits) => {
      setAcceptedHabits(habits);
      navigate('/questions/17');
    }} onBack={() => navigate('/questions/14')} />;
  }
  if (currentStep === 17) {
    return (
      <>
        <RadarChartScreen
          language={language}
          acceptedHabits={acceptedHabits}
          answers={allAnswers}
          onNext={() => handleFinalSubmit(allAnswers, settings, acceptedHabits)}
          onBack={() => navigate('/questions/16')}
        />
        <AnimatePresence>
          {isSaving && <SavingOverlay language={language} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className={`h-[100dvh] font-['Inter'] relative flex flex-col items-center overflow-hidden select-none transition-colors duration-300 ${isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>
      
      {/* TOP HEADER */}
      <div className="relative z-20 w-full px-6 pt-12 flex flex-col gap-4">
        <div className="flex items-center justify-between relative">
          {/* Back Button */}
          <button 
            onClick={handleBack} 
            className={`w-10 h-10 flex items-center justify-center border-2 rounded-xl active:scale-95 transition-all ${
              isLight 
                ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
                : 'bg-[#1A1A1A] border-white/20 text-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]'
            }`}
          >
            <Icon icon="ph:caret-left-bold" width={20} height={20} />
          </button>
          
          {/* Language Toggle — top right, neobrutalist */}
          <div className="relative">
            <button 
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-2 rounded-lg text-[11px] font-black font-['Outfit'] shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all ${
                isLight 
                  ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
                  : 'bg-[#1A1A1A] border-white/20 text-white/90 shadow-[3px_3px_0px_rgba(255,255,255,0.15)]'
              }`}
            >
              <span>{language === 'Bahasa Indonesia' ? 'Indonesia' : language}</span>
              <Icon icon="solar:alt-arrow-down-bold" width={10} className={`opacity-60 transition-transform duration-150 ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLangDropdown && (
              <div className={`absolute right-0 mt-1 w-32 border-2 rounded-lg overflow-hidden z-50 transition-all ${
                isLight 
                  ? 'bg-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                  : 'bg-[#1A1A1A] border-white/20 shadow-[4px_4px_0px_rgba(255,255,255,0.15)]'
              }`}>
                {LANGUAGES_MAP.map((lang) => (
                  <button
                    key={lang.name}
                    onClick={() => {
                      updateSettings({ language: lang.name as any });
                      setShowLangDropdown(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-[11px] font-black font-['Outfit'] transition-colors ${
                      language === lang.name 
                        ? 'text-[#10B981] bg-[#10B981]/10' 
                        : isLight 
                          ? 'text-black/60 hover:text-black hover:bg-black/5' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {lang.name === 'Bahasa Indonesia' ? 'Indonesia' : lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
 
        {/* Progress Bar only — no counter */}
        <div className={`relative w-full h-[2px] rounded-full overflow-hidden ${isLight ? 'bg-black/10' : 'bg-white/10'}`}>
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${(currentStep / STEPS.length) * 100}%` }} 
            transition={{ duration: 0.8, ease: CUBIC_BEZIER }} 
            className="relative h-full bg-[#10B981] shadow-[0_0_12px_rgba(16, 185, 129,0.5)]"
          >
            <div className="absolute right-0 top-0 h-full w-2 bg-white/30 rounded-full" />
          </motion.div>
        </div>
      </div>
 
      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col flex-1 pt-24 overflow-hidden">
        
        {/* HEADING SECTION */}
        <div className="h-28 flex flex-col justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2 text-center"
            >
              <h2 className="text-[19px] font-bold font-['Outfit'] leading-tight tracking-normal px-4">
                {questionTitle}
              </h2>
              {questionInstruction && (
                <p className={`font-['Inter'] text-[12px] font-medium tracking-wide italic opacity-80 ${isLight ? 'text-neutral-500' : 'text-[#A0A0A0]'}`}>
                  {questionInstruction}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
 
        {/* INPUTS / OPTIONS AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col pb-8"
            >
              {currentQuestion?.type === 'custom' ? (
                renderCustomStepContent()
              ) : (
                <div className="flex flex-col gap-3">
                  {currentQuestion?.options?.map((option, idx) => {
                    const isSelected = selectedOptions.includes(option);
                    const translatedOption = questionOptions[idx] || option;
                    return (
                      <motion.button 
                        key={idx} 
                        variants={itemVariants} 
                        whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }} 
                        onClick={() => toggleOption(option)} 
                        className={`relative py-4 px-6 rounded-xl text-left transition-all duration-300 border-2 backdrop-blur-md ${
                          isSelected 
                          ? isLight
                            ? 'bg-[#10B981]/20 border-black text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                            : 'bg-[#10B981]/10 border-[#10B981] text-white shadow-[5px_5px_0px_rgba(0,0,0,1)]'
                          : isLight
                            ? 'bg-white border-black text-black hover:bg-neutral-50 shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                            : 'bg-[#1A1A1A] border-[#E3DAC9]/20 hover:border-[#E3DAC9]/40 text-white/80 shadow-[5px_5px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[15px] font-bold transition-colors ${isSelected ? (isLight ? 'text-black font-extrabold' : 'text-[#10B981]') : (isLight ? 'text-neutral-700 font-bold' : 'text-white/60')}`}>
                            {translatedOption}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected 
                              ? isLight ? 'bg-[#10B981] border-black' : 'bg-[#10B981] border-[#10B981]' 
                              : isLight ? 'bg-transparent border-black/25' : 'bg-transparent border-white/20'
                          }`}>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div 
                                  initial={{ scale: 0 }} 
                                  animate={{ scale: 1 }} 
                                  transition={{ duration: 0.2 }}
                                >
                                  <Icon icon="ph:check-bold" width={10} height={10} className="text-black font-bold" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
 
        {/* BOTTOM CONTINUE BUTTON */}
        <div className={`absolute bottom-0 left-0 w-full px-6 pb-6 pt-12 pointer-events-none ${
          isLight 
            ? 'bg-gradient-to-t from-white via-white/90 to-transparent' 
            : 'bg-gradient-to-t from-black via-black/90 to-transparent'
        }`}>
          <div className="h-14 pointer-events-auto">
            {isContinueEnabled() && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CinematicButton 
                  disabled={isSaving}
                  onClick={() => handleNext()} 
                  className="w-full"
                >
                  {isSaving 
                    ? (language === 'Bahasa Indonesia' ? 'Menyimpan...' : 'Saving...') 
                    : (language === 'Bahasa Indonesia' ? 'Lanjutkan' : 'Continue')}
                </CinematicButton>
              </motion.div>
            )}
          </div>
        </div>
 
      </div>
      <AnimatePresence>
        {isSaving && currentStep === 3 && <SavingOverlay language={language} isUsernameCheck={true} />}
      </AnimatePresence>
    </div>
  );
}
