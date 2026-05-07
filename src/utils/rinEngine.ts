
/**
 * Rin Snarky Engine
 * Generates randomized, snarky, but motivating comments for the Global Feed.
 * No API tokens needed.
 */

type PostType = 'habit_completion' | 'milestone' | 'text' | 'streak';

interface RinTemplate {
  templates: string[];
  type: PostType;
}

const templates: RinTemplate[] = [
  {
    type: 'habit_completion',
    templates: [
      "{nickname}. lihat si {postUser} udah {task}, kamu masih mau rebahan?",
      "Gokil {postUser} udah kelar {task}. {nickname}, lu kapan nyusul?",
      "{nickname}, {postUser} aja bisa beresin {task}. Masa lu ngga?",
      "Ok, {postUser} dapet poin dari {task}. {nickname}, skor lu masih nol kan? Gerak woi!",
      "Liat tuh {postUser}, {task} dilibas. {nickname} jangan kebanyakan alasan."
    ]
  },
  {
    type: 'milestone',
    templates: [
      "{nickname}. lihat si {postUser} udah tembus milestone baru. Kamu masih di situ-situ aja?",
      "Aura {postUser} makin ngeri setelah milestone ini. {nickname}, lu mau jadi figuran terus?",
      "Fix, {postUser} bentar lagi jadi main character. {nickname}, lu masih mau jadi penonton?",
      "Pencapaian {postUser} ini harusnya bikin {nickname} malu sih. Gas teroos!",
      "Level up! {postUser} beneran ninggalin kalian di belakang. {nickname}, lari woi!"
    ]
  },
  {
    type: 'streak',
    templates: [
      "{nickname}. lihat si {postUser} udah {count} hari berturut-turut. Lu sehari aja bolong.",
      "{count} hari? {postUser} nggak main-main. {nickname}, liat tuh mental baja.",
      "Liat streak {postUser}. {nickname}, kalo lu ngga gerak sekarang, makin jauh ketinggalannya.",
      "{postUser} lagi 'on fire' {count} hari. {nickname} masih adem ayem di kasur?",
      "Streak {postUser} udah {count} hari. {nickname}, jangan mau kalah lah!"
    ]
  },
  {
    type: 'text',
    templates: [
      "{nickname}, dengerin tuh kata-kata si {postUser}. Lu butuh denger ginian.",
      "Tumben {postUser} bener ngomongnya. {nickname}, catet trus praktekin!",
      "{nickname}, si {postUser} lagi mode bijak. Lu lagi mode apa? Malas?",
      "Status {postUser} hari ini valid no debat. {nickname} harusnya paham.",
      "{nickname}, liat {postUser} tetep semangat ngetik ginian. Lu semangat apa?"
    ]
  }
];

export const getRinComment = (nickname: string, postUser: string, type: PostType, task?: string, count?: number): string => {
  const category = templates.find(t => t.type === type) || templates[templates.length - 1];
  const template = category.templates[Math.floor(Math.random() * category.templates.length)];
  
  return template
    .replace(/{nickname}/g, nickname)
    .replace(/{postUser}/g, postUser)
    .replace(/{task}/g, task || 'tugasnya')
    .replace(/{count}/g, count?.toString() || '0');
};
