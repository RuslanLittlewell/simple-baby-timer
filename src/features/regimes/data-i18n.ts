// Translations of the regime content (source language: ru). Maintained by hand:
// after regimes-import.py adds new Russian source strings to data.ts, add their
// translations here — anything missing falls back to the Russian source.
import { type LanguageCode } from '@/i18n';

type Lang = Exclude<LanguageCode, 'ru' | 'uk'>;

// Maps each Russian source string to its translations; missing entries
// fall back to the Russian source at runtime.
export const REGIME_STRINGS: Record<string, Partial<Record<Lang, string>>> = {
  "0–6 недель": {
    "en": "0–6 weeks",
    "pl": "0–6 tygodni",
    "es": "0–6 semanas",
    "fr": "0–6 semaines",
    "de": "0–6 Wochen",
    "pt": "0–6 semanas",
    "it": "0–6 settimane"
  },
  "Часто 14–17 ч; индивидуальный разброс большой": {
    "en": "Often 14–17 h; wide individual variation",
    "pl": "Zwykle 14–17 godz.; duże różnice indywidualne",
    "es": "A menudo 14–17 h; gran variación individual",
    "fr": "Souvent 14–17 h ; grande variation individuelle",
    "de": "Oft 14–17 Std.; große individuelle Schwankungen",
    "pt": "Frequentemente 14–17 h; grande variação individual",
    "it": "Spesso 14–17 h; ampia variazione individuale"
  },
  "5–8 и более": {
    "en": "5–8 or more",
    "pl": "5–8 i więcej",
    "es": "5–8 o más",
    "fr": "5–8 ou plus",
    "de": "5–8 oder mehr",
    "pt": "5–8 ou mais",
    "it": "5–8 o più"
  },
  "30–60 мин": {
    "en": "30–60 min",
    "pl": "30–60 min",
    "es": "30–60 min",
    "fr": "30–60 min",
    "de": "30–60 Min.",
    "pt": "30–60 min",
    "it": "30–60 min"
  },
  "Не фиксируется": {
    "en": "Not fixed",
    "pl": "Nie ustalone",
    "es": "No fijo",
    "fr": "Non fixé",
    "de": "Nicht festgelegt",
    "pt": "Não fixo",
    "it": "Non fisso"
  },
  "Кормление → короткое бодрствование → сон; день и ночь постепенно различают светом и активностью.": {
    "en": "Feeding → short awake time → sleep; day and night are gradually distinguished with light and activity.",
    "pl": "Karmienie → krótkie czuwanie → sen; dzień i noc stopniowo rozróżniane światłem i aktywnością.",
    "es": "Toma → vigilia corta → sueño; el día y la noche se distinguen poco a poco con luz y actividad.",
    "fr": "Repas → court éveil → sommeil ; jour et nuit se distinguent peu à peu par la lumière et l'activité.",
    "de": "Füttern → kurze Wachphase → Schlaf; Tag und Nacht werden allmählich durch Licht und Aktivität unterschieden.",
    "pt": "Alimentação → vigília curta → sono; o dia e a noite são gradualmente distinguidos pela luz e pela atividade.",
    "it": "Pasto → breve veglia → sonno; giorno e notte vengono gradualmente distinti con luce e attività."
  },
  "Цикл, а не строгий график": {
    "en": "A cycle, not a strict schedule",
    "pl": "Cykl, a nie sztywny harmonogram",
    "es": "Un ciclo, no un horario estricto",
    "fr": "Un cycle, pas un horaire strict",
    "de": "Ein Zyklus, kein starrer Zeitplan",
    "pt": "Um ciclo, não um horário rígido",
    "it": "Un ciclo, non un orario rigido"
  },
  "Кормление": {
    "en": "Feeding",
    "pl": "Karmienie",
    "es": "Toma",
    "fr": "Repas",
    "de": "Fütterung",
    "pt": "Alimentação",
    "it": "Pasto"
  },
  "Грудное молоко или смесь по потребности и рекомендациям врача.": {
    "en": "Breast milk or formula on demand and per your doctor's advice.",
    "pl": "Mleko mamy lub mieszanka na żądanie i zgodnie z zaleceniami lekarza.",
    "es": "Leche materna o fórmula a demanda y según las indicaciones del médico.",
    "fr": "Lait maternel ou infantile à la demande et selon l'avis du médecin.",
    "de": "Muttermilch oder Formulanahrung nach Bedarf und ärztlicher Empfehlung.",
    "pt": "Leite materno ou fórmula a pedido e segundo as recomendações do médico.",
    "it": "Latte materno o artificiale a richiesta e secondo le indicazioni del pediatra."
  },
  "Подгузник и спокойное общение": {
    "en": "Diaper and calm interaction",
    "pl": "Pielucha i spokojny kontakt",
    "es": "Pañal e interacción tranquila",
    "fr": "Couche et échange calme",
    "de": "Windel wechseln und ruhiger Kontakt",
    "pt": "Fralda e interação calma",
    "it": "Cambio del pannolino e interazione tranquilla"
  },
  "Короткий контакт, разговор, рассматривание лица.": {
    "en": "Brief contact, talking, looking at your face.",
    "pl": "Krótki kontakt, rozmowa, patrzenie na twarz.",
    "es": "Contacto breve, hablar, mirar la cara.",
    "fr": "Contact bref, parler, regarder le visage.",
    "de": "Kurzer Kontakt, Sprechen, Betrachten des Gesichts.",
    "pt": "Contacto breve, conversa, observar o rosto.",
    "it": "Breve contatto, parlare, osservare il viso."
  },
  "Время на животе": {
    "en": "Tummy time",
    "pl": "Leżenie na brzuchu",
    "es": "Tiempo boca abajo",
    "fr": "Temps sur le ventre",
    "de": "Bauchlage-Zeit",
    "pt": "Tempo de barriga para baixo",
    "it": "Tempo a pancia in giù"
  },
  "Только в бодрствовании и под постоянным наблюдением.": {
    "en": "Only while awake and under constant supervision.",
    "pl": "Tylko na czuwaniu i pod stałym nadzorem.",
    "es": "Solo despierto y bajo supervisión constante.",
    "fr": "Uniquement éveillé et sous surveillance constante.",
    "de": "Nur im Wachzustand und unter ständiger Aufsicht.",
    "pt": "Apenas enquanto acordado e sob supervisão constante.",
    "it": "Solo da svegli e sotto supervisione costante."
  },
  "Сон": {
    "en": "Sleep",
    "pl": "Sen",
    "es": "Sueño",
    "fr": "Sommeil",
    "de": "Schlaf",
    "pt": "Sono",
    "it": "Sonno"
  },
  "Не растягивать бодрствование ради более долгого ночного сна.": {
    "en": "Don't stretch awake time hoping for longer night sleep.",
    "pl": "Nie wydłużaj czuwania dla dłuższego snu nocnego.",
    "es": "No alargues la vigilia buscando un sueño nocturno más largo.",
    "fr": "N'allongez pas l'éveil pour un sommeil de nuit plus long.",
    "de": "Die Wachzeit nicht verlängern, um einen längeren Nachtschlaf zu erzwingen.",
    "pt": "Não prolongue a vigília na esperança de um sono noturno mais longo.",
    "it": "Non allungare la veglia sperando in un sonno notturno più lungo."
  },
  "Повторение цикла": {
    "en": "Repeat the cycle",
    "pl": "Powtórzenie cyklu",
    "es": "Repetir el ciclo",
    "fr": "Répéter le cycle",
    "de": "Zyklus wiederholen",
    "pt": "Repetição do ciclo",
    "it": "Ripetizione del ciclo"
  },
  "Ночные кормления в этом возрасте обычны.": {
    "en": "Night feedings are normal at this age.",
    "pl": "Karmienia nocne w tym wieku są normalne.",
    "es": "Las tomas nocturnas son normales a esta edad.",
    "fr": "Les repas de nuit sont normaux à cet âge.",
    "de": "Nächtliches Füttern ist in diesem Alter normal.",
    "pt": "As alimentações noturnas são normais nesta idade.",
    "it": "I pasti notturni sono normali a questa età."
  },
  "6–12 недель": {
    "en": "6–12 weeks",
    "pl": "6–12 tygodni",
    "es": "6–12 semanas",
    "fr": "6–12 semaines",
    "de": "6–12 Wochen",
    "pt": "6–12 semanas",
    "it": "6–12 settimane"
  },
  "Обычно около 14–17 ч": {
    "en": "Usually about 14–17 h",
    "pl": "Zwykle około 14–17 godz.",
    "es": "Normalmente unas 14–17 h",
    "fr": "Habituellement environ 14–17 h",
    "de": "Meist etwa 14–17 Std.",
    "pt": "Geralmente cerca de 14–17 h",
    "it": "Di solito circa 14–17 h"
  },
  "4–6": {
    "en": "4–6",
    "pl": "4–6",
    "es": "4–6",
    "fr": "4–6",
    "de": "4–6",
    "pt": "4–6",
    "it": "4–6"
  },
  "45–90 мин": {
    "en": "45–90 min",
    "pl": "45–90 min",
    "es": "45–90 min",
    "fr": "45–90 min",
    "de": "45–90 Min.",
    "pt": "45–90 min",
    "it": "45–90 min"
  },
  "Около 07:00 ± 1 ч": {
    "en": "Around 07:00 ± 1 h",
    "pl": "Około 07:00 ± 1 godz.",
    "es": "Alrededor de 07:00 ± 1 h",
    "fr": "Vers 07:00 ± 1 h",
    "de": "Etwa 07:00 ± 1 Std.",
    "pt": "Cerca das 07:00 ± 1 h",
    "it": "Circa le 07:00 ± 1 h"
  },
  "20:00–21:30": {
    "en": "20:00–21:30",
    "pl": "20:00–21:30",
    "es": "20:00–21:30",
    "fr": "20:00–21:30",
    "de": "20:00–21:30",
    "pt": "20:00–21:30",
    "it": "20:00–21:30"
  },
  "Время ещё может заметно сдвигаться; важнее повторяемая последовательность действий.": {
    "en": "Times can still shift noticeably; a repeatable sequence matters more.",
    "pl": "Godziny mogą się jeszcze wyraźnie przesuwać; ważniejsza jest powtarzalna kolejność.",
    "es": "Los horarios aún pueden variar bastante; importa más una secuencia repetible.",
    "fr": "Les horaires peuvent encore bouger nettement ; une séquence répétable compte plus.",
    "de": "Die Zeiten können sich noch deutlich verschieben; eine wiederholbare Abfolge ist wichtiger.",
    "pt": "Os horários ainda podem variar bastante; é mais importante uma sequência repetível.",
    "it": "Gli orari possono ancora spostarsi molto; conta di più una sequenza ripetibile."
  },
  "Пример дня": {
    "en": "Sample day",
    "pl": "Przykładowy dzień",
    "es": "Día de ejemplo",
    "fr": "Journée type",
    "de": "Beispieltag",
    "pt": "Dia de exemplo",
    "it": "Esempio di giornata"
  },
  "Пробуждение и кормление": {
    "en": "Wake-up and feeding",
    "pl": "Pobudka i karmienie",
    "es": "Despertar y toma",
    "fr": "Réveil et repas",
    "de": "Aufwachen und Füttern",
    "pt": "Acordar e alimentação",
    "it": "Risveglio e pasto"
  },
  "Допустимо отклонение примерно на час.": {
    "en": "A deviation of about an hour is fine.",
    "pl": "Odchylenie około godziny jest dopuszczalne.",
    "es": "Se admite una variación de aproximadamente una hora.",
    "fr": "Un écart d'environ une heure est acceptable.",
    "de": "Eine Abweichung von etwa einer Stunde ist in Ordnung.",
    "pt": "É aceitável um desvio de cerca de uma hora.",
    "it": "È accettabile uno scostamento di circa un'ora."
  },
  "Подгузник, общение, время на животе": {
    "en": "Diaper, interaction, tummy time",
    "pl": "Pielucha, kontakt, leżenie na brzuchu",
    "es": "Pañal, interacción, tiempo boca abajo",
    "fr": "Couche, échange, temps sur le ventre",
    "de": "Windel, Kontakt, Bauchlage-Zeit",
    "pt": "Fralda, interação, tempo de barriga para baixo",
    "it": "Pannolino, interazione, tempo a pancia in giù"
  },
  "Спокойная активность.": {
    "en": "Calm activity.",
    "pl": "Spokojna aktywność.",
    "es": "Actividad tranquila.",
    "fr": "Activité calme.",
    "de": "Ruhige Aktivität.",
    "pt": "Atividade calma.",
    "it": "Attività tranquilla."
  },
  "Первый сон": {
    "en": "First nap",
    "pl": "Pierwsza drzemka",
    "es": "Primera siesta",
    "fr": "Première sieste",
    "de": "Erster Schlaf",
    "pt": "Primeira sesta",
    "it": "Prima nanna"
  },
  "Второй сон": {
    "en": "Second nap",
    "pl": "Druga drzemka",
    "es": "Segunda siesta",
    "fr": "Deuxième sieste",
    "de": "Zweiter Schlaf",
    "pt": "Segunda sesta",
    "it": "Seconda nanna"
  },
  "Третий сон": {
    "en": "Third nap",
    "pl": "Trzecia drzemka",
    "es": "Tercera siesta",
    "fr": "Troisième sieste",
    "de": "Dritter Schlaf",
    "pt": "Terceira sesta",
    "it": "Terza nanna"
  },
  "Четвёртый сон": {
    "en": "Fourth nap",
    "pl": "Czwarta drzemka",
    "es": "Cuarta siesta",
    "fr": "Quatrième sieste",
    "de": "Vierter Schlaf",
    "pt": "Quarta sesta",
    "it": "Quarta nanna"
  },
  "Короткий пятый сон": {
    "en": "Short fifth nap",
    "pl": "Krótka piąta drzemka",
    "es": "Quinta siesta corta",
    "fr": "Courte cinquième sieste",
    "de": "Kurzer fünfter Schlaf",
    "pt": "Quinta sesta curta",
    "it": "Quinta nanna breve"
  },
  "Нужен не всем детям.": {
    "en": "Not all babies need it.",
    "pl": "Nie każde dziecko go potrzebuje.",
    "es": "No todos los bebés la necesitan.",
    "fr": "Tous les bébés n'en ont pas besoin.",
    "de": "Nicht jedes Baby braucht ihn.",
    "pt": "Nem todos os bebés precisam dela.",
    "it": "Non serve a tutti i bambini."
  },
  "Кормление и приглушённый свет": {
    "en": "Feeding and dim light",
    "pl": "Karmienie i przyćmione światło",
    "es": "Toma y luz tenue",
    "fr": "Repas et lumière tamisée",
    "de": "Füttern und gedämpftes Licht",
    "pt": "Alimentação e luz suave",
    "it": "Pasto e luce soffusa"
  },
  "Начало ночного сна": {
    "en": "Start of night sleep",
    "pl": "Początek snu nocnego",
    "es": "Inicio del sueño nocturno",
    "fr": "Début du sommeil de nuit",
    "de": "Beginn des Nachtschlafs",
    "pt": "Início do sono noturno",
    "it": "Inizio del sonno notturno"
  },
  "Ночные кормления сохраняются.": {
    "en": "Night feedings continue.",
    "pl": "Karmienia nocne pozostają.",
    "es": "Las tomas nocturnas se mantienen.",
    "fr": "Les repas de nuit se poursuivent.",
    "de": "Nächtliches Füttern bleibt bestehen.",
    "pt": "As alimentações noturnas mantêm-se.",
    "it": "I pasti notturni continuano."
  },
  "3–4 месяца": {
    "en": "3–4 months",
    "pl": "3–4 miesiące",
    "es": "3–4 meses",
    "fr": "3–4 mois",
    "de": "3–4 Monate",
    "pt": "3–4 meses",
    "it": "3–4 mesi"
  },
  "Обычно около 14–16 ч": {
    "en": "Usually about 14–16 h",
    "pl": "Zwykle około 14–16 godz.",
    "es": "Normalmente unas 14–16 h",
    "fr": "Habituellement environ 14–16 h",
    "de": "Meist etwa 14–16 Std.",
    "pt": "Geralmente cerca de 14–16 h",
    "it": "Di solito circa 14–16 h"
  },
  "4–5": {
    "en": "4–5",
    "pl": "4–5",
    "es": "4–5",
    "fr": "4–5",
    "de": "4–5",
    "pt": "4–5",
    "it": "4–5"
  },
  "1 ч 15 мин – 2 ч": {
    "en": "1 h 15 min – 2 h",
    "pl": "1 godz. 15 min – 2 godz.",
    "es": "1 h 15 min – 2 h",
    "fr": "1 h 15 min – 2 h",
    "de": "1 Std. 15 Min. – 2 Std.",
    "pt": "1 h 15 min – 2 h",
    "it": "1 h 15 min – 2 h"
  },
  "Около 07:00 ± 30 мин": {
    "en": "Around 07:00 ± 30 min",
    "pl": "Około 07:00 ± 30 min",
    "es": "Alrededor de 07:00 ± 30 min",
    "fr": "Vers 07:00 ± 30 min",
    "de": "Etwa 07:00 ± 30 Min.",
    "pt": "Cerca das 07:00 ± 30 min",
    "it": "Circa le 07:00 ± 30 min"
  },
  "19:30–20:30": {
    "en": "19:30–20:30",
    "pl": "19:30–20:30",
    "es": "19:30–20:30",
    "fr": "19:30–20:30",
    "de": "19:30–20:30",
    "pt": "19:30–20:30",
    "it": "19:30–20:30"
  },
  "Можно закреплять подъём и вечерний ритуал; короткие дневные сны остаются нормальными.": {
    "en": "You can start fixing wake-up and the bedtime routine; short naps are still normal.",
    "pl": "Można utrwalać pobudkę i rytuał wieczorny; krótkie drzemki są nadal normalne.",
    "es": "Puedes fijar el despertar y la rutina de la noche; las siestas cortas siguen siendo normales.",
    "fr": "On peut fixer le réveil et le rituel du soir ; les siestes courtes restent normales.",
    "de": "Aufwachzeit und Abendritual können jetzt gefestigt werden; kurze Tagschläfchen sind weiterhin normal.",
    "pt": "Já é possível fixar a hora de acordar e o ritual noturno; sestas curtas continuam normais.",
    "it": "Si può fissare l'orario di sveglia e il rituale serale; le nanne brevi restano normali."
  },
  "4 дневных сна": {
    "en": "4 naps",
    "pl": "4 drzemki",
    "es": "4 siestas",
    "fr": "4 siestes",
    "de": "4 Tagschläfchen",
    "pt": "4 sestas",
    "it": "4 nanne"
  },
  "Подъём и молочное кормление": {
    "en": "Wake-up and milk feeding",
    "pl": "Pobudka i karmienie mlekiem",
    "es": "Despertar y toma de leche",
    "fr": "Réveil et repas lacté",
    "de": "Aufwachen und Milchmahlzeit",
    "pt": "Acordar e mamada",
    "it": "Sveglia e pasto di latte"
  },
  "Короткий четвёртый сон": {
    "en": "Short fourth nap",
    "pl": "Krótka czwarta drzemka",
    "es": "Cuarta siesta corta",
    "fr": "Courte quatrième sieste",
    "de": "Kurzer vierter Schlaf",
    "pt": "Quarta sesta curta",
    "it": "Quarta nanna breve"
  },
  "Вечерний ритуал": {
    "en": "Bedtime routine",
    "pl": "Rytuał wieczorny",
    "es": "Rutina de la noche",
    "fr": "Rituel du soir",
    "de": "Abendritual",
    "pt": "Ritual noturno",
    "it": "Rituale serale"
  },
  "Приглушённый свет, переодевание, песня или короткая книга.": {
    "en": "Dim light, changing, a song or a short book.",
    "pl": "Przyćmione światło, przebranie, piosenka lub krótka książeczka.",
    "es": "Luz tenue, cambio de ropa, una canción o un cuento corto.",
    "fr": "Lumière tamisée, change, une chanson ou un petit livre.",
    "de": "Gedämpftes Licht, Umziehen, ein Lied oder ein kurzes Buch.",
    "pt": "Luz suave, mudar a fralda/roupa, uma canção ou um livro curto.",
    "it": "Luce soffusa, cambio, una canzone o un libro breve."
  },
  "Последнее кормление и ночной сон": {
    "en": "Last feeding and night sleep",
    "pl": "Ostatnie karmienie i sen nocny",
    "es": "Última toma y sueño nocturno",
    "fr": "Dernier repas et sommeil de nuit",
    "de": "Letzte Mahlzeit und Nachtschlaf",
    "pt": "Última alimentação e sono noturno",
    "it": "Ultimo pasto e sonno notturno"
  },
  "5–6 месяцев": {
    "en": "5–6 months",
    "pl": "5–6 miesięcy",
    "es": "5–6 meses",
    "fr": "5–6 mois",
    "de": "5–6 Monate",
    "pt": "5–6 meses",
    "it": "5–6 mesi"
  },
  "12–16 ч, включая дневной сон": {
    "en": "12–16 h, including daytime sleep",
    "pl": "12–16 godz., wliczając sen dzienny",
    "es": "12–16 h, incluido el sueño diurno",
    "fr": "12–16 h, sieste comprise",
    "de": "12–16 Std., einschließlich Tagschlaf",
    "pt": "12–16 h, incluindo o sono diurno",
    "it": "12–16 h, incluso il sonno diurno"
  },
  "3–4": {
    "en": "3–4",
    "pl": "3–4",
    "es": "3–4",
    "fr": "3–4",
    "de": "3–4",
    "pt": "3–4",
    "it": "3–4"
  },
  "2–2,5 ч": {
    "en": "2–2.5 h",
    "pl": "2–2,5 godz.",
    "es": "2–2,5 h",
    "fr": "2–2,5 h",
    "de": "2–2,5 Std.",
    "pt": "2–2,5 h",
    "it": "2–2,5 h"
  },
  "Около 07:00": {
    "en": "Around 07:00",
    "pl": "Około 07:00",
    "es": "Alrededor de 07:00",
    "fr": "Vers 07:00",
    "de": "Etwa 07:00",
    "pt": "Cerca das 07:00",
    "it": "Circa le 07:00"
  },
  "19:30–20:00": {
    "en": "19:30–20:00",
    "pl": "19:30–20:00",
    "es": "19:30–20:00",
    "fr": "19:30–20:00",
    "de": "19:30–20:00",
    "pt": "19:30–20:00",
    "it": "19:30–20:00"
  },
  "При коротких снах может временно сохраняться четвёртый сон.": {
    "en": "With short naps, a fourth nap may remain for a while.",
    "pl": "Przy krótkich drzemkach czwarta drzemka może chwilowo pozostać.",
    "es": "Con siestas cortas, puede mantenerse temporalmente una cuarta siesta.",
    "fr": "Avec des siestes courtes, une quatrième sieste peut subsister un temps.",
    "de": "Bei kurzen Schläfchen kann der vierte Schlaf vorübergehend bestehen bleiben.",
    "pt": "Com sestas curtas, a quarta sesta pode manter-se temporariamente.",
    "it": "Con nanne brevi, la quarta nanna può rimanere temporaneamente."
  },
  "3 дневных сна": {
    "en": "3 naps",
    "pl": "3 drzemki",
    "es": "3 siestas",
    "fr": "3 siestes",
    "de": "3 Tagschläfchen",
    "pt": "3 sestas",
    "it": "3 nanne"
  },
  "Молочное кормление": {
    "en": "Milk feeding",
    "pl": "Karmienie mlekiem",
    "es": "Toma de leche",
    "fr": "Repas lacté",
    "de": "Milchmahlzeit",
    "pt": "Mamada",
    "it": "Pasto di latte"
  },
  "Прикорм при наличии готовности": {
    "en": "Solids if signs of readiness",
    "pl": "Pokarmy stałe, jeśli są oznaki gotowości",
    "es": "Alimentos sólidos si hay señales de preparación",
    "fr": "Diversification si signes de préparation",
    "de": "Beikost bei entsprechender Reife",
    "pt": "Diversificação alimentar se houver sinais de prontidão",
    "it": "Svezzamento se sono presenti i segnali di prontezza"
  },
  "Небольшое количество; не заменяет молочное кормление.": {
    "en": "A small amount; does not replace milk feeding.",
    "pl": "Niewielka ilość; nie zastępuje karmienia mlekiem.",
    "es": "Una pequeña cantidad; no sustituye la toma de leche.",
    "fr": "Une petite quantité ; ne remplace pas le repas lacté.",
    "de": "Eine kleine Menge; ersetzt nicht die Milchmahlzeit.",
    "pt": "Uma pequena quantidade; não substitui a mamada.",
    "it": "Una piccola quantità; non sostituisce il pasto di latte."
  },
  "Третий короткий сон": {
    "en": "Third short nap",
    "pl": "Trzecia krótka drzemka",
    "es": "Tercera siesta corta",
    "fr": "Troisième sieste courte",
    "de": "Dritter kurzer Schlaf",
    "pt": "Terceira sesta curta",
    "it": "Terza nanna breve"
  },
  "Спокойные игры и купание": {
    "en": "Calm play and bath",
    "pl": "Spokojna zabawa i kąpiel",
    "es": "Juego tranquilo y baño",
    "fr": "Jeu calme et bain",
    "de": "Ruhiges Spielen und Baden",
    "pt": "Brincadeiras calmas e banho",
    "it": "Gioco tranquillo e bagnetto"
  },
  "Ночной сон": {
    "en": "Night sleep",
    "pl": "Sen nocny",
    "es": "Sueño nocturno",
    "fr": "Sommeil de nuit",
    "de": "Nachtschlaf",
    "pt": "Sono noturno",
    "it": "Sonno notturno"
  },
  "Если третий сон пропущен, укладывание часто делают раньше.": {
    "en": "If the third nap is skipped, bedtime is often earlier.",
    "pl": "Jeśli trzecia drzemka wypadnie, kładzenie spać jest często wcześniejsze.",
    "es": "Si se salta la tercera siesta, la hora de dormir suele adelantarse.",
    "fr": "Si la troisième sieste saute, le coucher est souvent avancé.",
    "de": "Wird das dritte Schläfchen ausgelassen, erfolgt das Zubettgehen oft früher.",
    "pt": "Se a terceira sesta for saltada, deitar mais cedo é frequente.",
    "it": "Se la terza nanna viene saltata, si mette a letto spesso prima."
  },
  "7–9 месяцев": {
    "en": "7–9 months",
    "pl": "7–9 miesięcy",
    "es": "7–9 meses",
    "fr": "7–9 mois",
    "de": "7–9 Monate",
    "pt": "7–9 meses",
    "it": "7–9 mesi"
  },
  "2–3": {
    "en": "2–3",
    "pl": "2–3",
    "es": "2–3",
    "fr": "2–3",
    "de": "2–3",
    "pt": "2–3",
    "it": "2–3"
  },
  "2,5–3,5 ч": {
    "en": "2.5–3.5 h",
    "pl": "2,5–3,5 godz.",
    "es": "2,5–3,5 h",
    "fr": "2,5–3,5 h",
    "de": "2,5–3,5 Std.",
    "pt": "2,5–3,5 h",
    "it": "2,5–3,5 h"
  },
  "Третий короткий сон убирают, когда он регулярно мешает ночному укладыванию.": {
    "en": "Drop the third short nap when it regularly interferes with bedtime.",
    "pl": "Trzecią krótką drzemkę usuwa się, gdy regularnie zaburza wieczorne kładzenie.",
    "es": "Se elimina la tercera siesta corta cuando interfiere de forma habitual con la hora de dormir.",
    "fr": "On supprime la troisième sieste courte quand elle gêne régulièrement le coucher.",
    "de": "Das dritte kurze Schläfchen wird gestrichen, wenn es regelmäßig das nächtliche Einschlafen stört.",
    "pt": "A terceira sesta curta é eliminada quando interfere regularmente com o deitar noturno.",
    "it": "La terza nanna breve viene eliminata quando interferisce regolarmente con l'addormentamento notturno."
  },
  "2 дневных сна": {
    "en": "2 naps",
    "pl": "2 drzemki",
    "es": "2 siestas",
    "fr": "2 siestes",
    "de": "2 Tagschläfchen",
    "pt": "2 sestas",
    "it": "2 nanne"
  },
  "Подъём и грудное молоко/смесь": {
    "en": "Wake-up and breast milk/formula",
    "pl": "Pobudka i mleko mamy/mieszanka",
    "es": "Despertar y leche materna/fórmula",
    "fr": "Réveil et lait maternel/infantile",
    "de": "Aufwachen und Muttermilch/Formulanahrung",
    "pt": "Acordar e leite materno/fórmula",
    "it": "Sveglia e latte materno/artificiale"
  },
  "Завтрак": {
    "en": "Breakfast",
    "pl": "Śniadanie",
    "es": "Desayuno",
    "fr": "Petit-déjeuner",
    "de": "Frühstück",
    "pt": "Pequeno-almoço",
    "it": "Colazione"
  },
  "Грудное молоко/смесь": {
    "en": "Breast milk/formula",
    "pl": "Mleko mamy/mieszanka",
    "es": "Leche materna/fórmula",
    "fr": "Lait maternel/infantile",
    "de": "Muttermilch/Formulanahrung",
    "pt": "Leite materno/fórmula",
    "it": "Latte materno/artificiale"
  },
  "Обед": {
    "en": "Lunch",
    "pl": "Obiad",
    "es": "Almuerzo",
    "fr": "Déjeuner",
    "de": "Mittagessen",
    "pt": "Almoço",
    "it": "Pranzo"
  },
  "Ужин или небольшое кормление": {
    "en": "Dinner or a small feeding",
    "pl": "Kolacja lub niewielkie karmienie",
    "es": "Cena o una toma pequeña",
    "fr": "Dîner ou petit repas",
    "de": "Abendessen oder eine kleine Mahlzeit",
    "pt": "Jantar ou uma pequena alimentação",
    "it": "Cena o un piccolo pasto"
  },
  "Купание, спокойные игры, книга.": {
    "en": "Bath, calm play, a book.",
    "pl": "Kąpiel, spokojna zabawa, książeczka.",
    "es": "Baño, juego tranquilo, un cuento.",
    "fr": "Bain, jeu calme, un livre.",
    "de": "Baden, ruhiges Spielen, ein Buch.",
    "pt": "Banho, brincadeiras calmas, um livro.",
    "it": "Bagnetto, gioco tranquillo, un libro."
  },
  "3 сна при коротких снах": {
    "en": "3 naps if naps are short",
    "pl": "3 drzemki przy krótkich drzemkach",
    "es": "3 siestas si las siestas son cortas",
    "fr": "3 siestes si les siestes sont courtes",
    "de": "3 Schläfchen bei kurzen Schlafphasen",
    "pt": "3 sestas quando são curtas",
    "it": "3 nanne se sono brevi"
  },
  "Подъём": {
    "en": "Wake-up",
    "pl": "Pobudka",
    "es": "Despertar",
    "fr": "Réveil",
    "de": "Aufwachen",
    "pt": "Acordar",
    "it": "Sveglia"
  },
  "Убирают, когда он регулярно мешает ночному засыпанию.": {
    "en": "Dropped when it regularly interferes with falling asleep at night.",
    "pl": "Usuwa się, gdy regularnie zaburza zasypianie w nocy.",
    "es": "Se elimina cuando interfiere de forma habitual con conciliar el sueño por la noche.",
    "fr": "On la supprime quand elle gêne régulièrement l'endormissement du soir.",
    "de": "Wird gestrichen, wenn es regelmäßig das nächtliche Einschlafen stört.",
    "pt": "É eliminada quando interfere regularmente com adormecer à noite.",
    "it": "Viene eliminata quando interferisce regolarmente con l'addormentamento notturno."
  },
  "10–12 месяцев": {
    "en": "10–12 months",
    "pl": "10–12 miesięcy",
    "es": "10–12 meses",
    "fr": "10–12 mois",
    "de": "10–12 Monate",
    "pt": "10–12 meses",
    "it": "10–12 mesi"
  },
  "Обычно 2": {
    "en": "Usually 2",
    "pl": "Zwykle 2",
    "es": "Normalmente 2",
    "fr": "Habituellement 2",
    "de": "Meist 2",
    "pt": "Geralmente 2",
    "it": "Di solito 2"
  },
  "3–4 ч": {
    "en": "3–4 h",
    "pl": "3–4 godz.",
    "es": "3–4 h",
    "fr": "3–4 h",
    "de": "3–4 Std.",
    "pt": "3–4 h",
    "it": "3–4 h"
  },
  "06:30–07:00": {
    "en": "06:30–07:00",
    "pl": "06:30–07:00",
    "es": "06:30–07:00",
    "fr": "06:30–07:00",
    "de": "06:30–07:00",
    "pt": "06:30–07:00",
    "it": "06:30–07:00"
  },
  "Переход на один сон часто ещё преждевременен.": {
    "en": "Switching to one nap is often still premature.",
    "pl": "Przejście na jedną drzemkę często jest jeszcze przedwczesne.",
    "es": "Pasar a una sola siesta suele ser aún prematuro.",
    "fr": "Passer à une seule sieste est souvent encore prématuré.",
    "de": "Der Übergang zu einem Schläfchen ist oft noch verfrüht.",
    "pt": "A transição para uma única sesta é frequentemente ainda prematura.",
    "it": "Il passaggio a una sola nanna è spesso ancora prematuro."
  },
  "2 стабильных сна": {
    "en": "2 steady naps",
    "pl": "2 stabilne drzemki",
    "es": "2 siestas estables",
    "fr": "2 siestes stables",
    "de": "2 feste Schläfchen",
    "pt": "2 sestas estáveis",
    "it": "2 nanne stabili"
  },
  "Молочное кормление или перекус": {
    "en": "Milk feeding or a snack",
    "pl": "Karmienie mlekiem lub przekąska",
    "es": "Toma de leche o un tentempié",
    "fr": "Repas lacté ou collation",
    "de": "Milchmahlzeit oder ein Snack",
    "pt": "Mamada ou um lanche",
    "it": "Pasto di latte o uno spuntino"
  },
  "Зависит от индивидуального рациона.": {
    "en": "Depends on the individual diet.",
    "pl": "Zależy od indywidualnej diety.",
    "es": "Depende de la dieta individual.",
    "fr": "Dépend du régime individuel.",
    "de": "Hängt von der individuellen Ernährung ab.",
    "pt": "Depende da dieta individual.",
    "it": "Dipende dalla dieta individuale."
  },
  "Ужин": {
    "en": "Dinner",
    "pl": "Kolacja",
    "es": "Cena",
    "fr": "Dîner",
    "de": "Abendessen",
    "pt": "Jantar",
    "it": "Cena"
  },
  "Тихий вечерний ритуал": {
    "en": "Quiet bedtime routine",
    "pl": "Cichy rytuał wieczorny",
    "es": "Rutina de noche tranquila",
    "fr": "Rituel du soir calme",
    "de": "Ruhiges Abendritual",
    "pt": "Ritual noturno tranquilo",
    "it": "Rituale serale tranquillo"
  },
  "12–15 месяцев": {
    "en": "12–15 months",
    "pl": "12–15 miesięcy",
    "es": "12–15 meses",
    "fr": "12–15 mois",
    "de": "12–15 Monate",
    "pt": "12–15 meses",
    "it": "12–15 mesi"
  },
  "11–14 ч, включая дневной сон": {
    "en": "11–14 h, including daytime sleep",
    "pl": "11–14 godz., wliczając sen dzienny",
    "es": "11–14 h, incluido el sueño diurno",
    "fr": "11–14 h, sieste comprise",
    "de": "11–14 Std., einschließlich Tagschlaf",
    "pt": "11–14 h, incluindo o sono diurno",
    "it": "11–14 h, incluso il sonno diurno"
  },
  "1–2": {
    "en": "1–2",
    "pl": "1–2",
    "es": "1–2",
    "fr": "1–2",
    "de": "1–2",
    "pt": "1–2",
    "it": "1–2"
  },
  "3,5–5 ч": {
    "en": "3.5–5 h",
    "pl": "3,5–5 godz.",
    "es": "3,5–5 h",
    "fr": "3,5–5 h",
    "de": "3,5–5 Std.",
    "pt": "3,5–5 h",
    "it": "3,5–5 h"
  },
  "Переход на один сон оценивают по устойчивым признакам минимум 1–2 недели.": {
    "en": "Judge the switch to one nap by steady signs over at least 1–2 weeks.",
    "pl": "Przejście na jedną drzemkę ocenia się po stałych oznakach przez co najmniej 1–2 tygodnie.",
    "es": "Valora el paso a una siesta por señales estables durante al menos 1–2 semanas.",
    "fr": "Évaluez le passage à une sieste sur des signes stables pendant au moins 1–2 semaines.",
    "de": "Der Übergang zu einem Schläfchen wird anhand stabiler Anzeichen über mindestens 1–2 Wochen beurteilt.",
    "pt": "A transição para uma sesta é avaliada por sinais consistentes durante pelo menos 1–2 semanas.",
    "it": "Il passaggio a una nanna si valuta in base a segnali costanti per almeno 1–2 settimane."
  },
  "Первый короткий сон": {
    "en": "First short nap",
    "pl": "Pierwsza krótka drzemka",
    "es": "Primera siesta corta",
    "fr": "Première sieste courte",
    "de": "Erster kurzer Schlaf",
    "pt": "Primeira sesta curta",
    "it": "Prima nanna breve"
  },
  "Короткий первый сон помогает сохранить второй.": {
    "en": "A short first nap helps keep the second one.",
    "pl": "Krótka pierwsza drzemka pomaga zachować drugą.",
    "es": "Una primera siesta corta ayuda a mantener la segunda.",
    "fr": "Une première sieste courte aide à garder la seconde.",
    "de": "Ein kurzer erster Schlaf hilft, den zweiten zu erhalten.",
    "pt": "Uma primeira sesta curta ajuda a preservar a segunda.",
    "it": "Una prima nanna breve aiuta a mantenere la seconda."
  },
  "Перекус": {
    "en": "Snack",
    "pl": "Przekąska",
    "es": "Tentempié",
    "fr": "Collation",
    "de": "Snack",
    "pt": "Lanche",
    "it": "Spuntino"
  },
  "1 дневной сон": {
    "en": "1 nap",
    "pl": "1 drzemka",
    "es": "1 siesta",
    "fr": "1 sieste",
    "de": "1 Tagschläfchen",
    "pt": "1 sesta",
    "it": "1 nanna"
  },
  "Ранний обед": {
    "en": "Early lunch",
    "pl": "Wczesny obiad",
    "es": "Almuerzo temprano",
    "fr": "Déjeuner tôt",
    "de": "Frühes Mittagessen",
    "pt": "Almoço cedo",
    "it": "Pranzo anticipato"
  },
  "Дневной сон": {
    "en": "Nap",
    "pl": "Drzemka",
    "es": "Siesta",
    "fr": "Sieste",
    "de": "Tagschlaf",
    "pt": "Sesta",
    "it": "Nanna"
  },
  "Во время перехода укладывание часто временно делают раньше.": {
    "en": "During the transition, bedtime is often temporarily earlier.",
    "pl": "W czasie przejścia kładzenie spać jest często chwilowo wcześniejsze.",
    "es": "Durante la transición, la hora de dormir suele adelantarse temporalmente.",
    "fr": "Pendant la transition, le coucher est souvent avancé temporairement.",
    "de": "Während der Übergangsphase erfolgt das Zubettgehen oft vorübergehend früher.",
    "pt": "Durante a transição, deitar mais cedo é frequentemente temporário.",
    "it": "Durante la transizione, si mette a letto spesso temporaneamente prima."
  },
  "15–18 месяцев": {
    "en": "15–18 months",
    "pl": "15–18 miesięcy",
    "es": "15–18 meses",
    "fr": "15–18 mois",
    "de": "15–18 Monate",
    "pt": "15–18 meses",
    "it": "15–18 mesi"
  },
  "Обычно 1": {
    "en": "Usually 1",
    "pl": "Zwykle 1",
    "es": "Normalmente 1",
    "fr": "Habituellement 1",
    "de": "Meist 1",
    "pt": "Geralmente 1",
    "it": "Di solito 1"
  },
  "4,5–5,5 ч": {
    "en": "4.5–5.5 h",
    "pl": "4,5–5,5 godz.",
    "es": "4,5–5,5 h",
    "fr": "4,5–5,5 h",
    "de": "4,5–5,5 Std.",
    "pt": "4,5–5,5 h",
    "it": "4,5–5,5 h"
  },
  "19:45–20:00": {
    "en": "19:45–20:00",
    "pl": "19:45–20:00",
    "es": "19:45–20:00",
    "fr": "19:45–20:00",
    "de": "19:45–20:00",
    "pt": "19:45–20:00",
    "it": "19:45–20:00"
  },
  "Основные точки дня уже можно достаточно стабильно привязать ко времени.": {
    "en": "The main points of the day can now be tied to fairly stable times.",
    "pl": "Główne punkty dnia można już dość stabilnie przypisać do godzin.",
    "es": "Los momentos clave del día ya pueden fijarse a horas bastante estables.",
    "fr": "Les moments clés de la journée peuvent désormais être fixés à des heures assez stables.",
    "de": "Die wichtigsten Tagespunkte lassen sich jetzt recht stabil an feste Zeiten binden.",
    "pt": "Os principais pontos do dia já podem ser associados a horários bastante estáveis.",
    "it": "I punti principali della giornata possono ormai essere legati a orari abbastanza stabili."
  },
  "Прогулка и активные игры": {
    "en": "Walk and active play",
    "pl": "Spacer i aktywna zabawa",
    "es": "Paseo y juego activo",
    "fr": "Promenade et jeu actif",
    "de": "Spaziergang und aktives Spielen",
    "pt": "Passeio e brincadeiras ativas",
    "it": "Passeggiata e gioco attivo"
  },
  "Прогулка и игры": {
    "en": "Walk and play",
    "pl": "Spacer i zabawa",
    "es": "Paseo y juego",
    "fr": "Promenade et jeu",
    "de": "Spaziergang und Spielen",
    "pt": "Passeio e brincadeiras",
    "it": "Passeggiata e gioco"
  },
  "Купание, чистка зубов, книга": {
    "en": "Bath, brushing teeth, a book",
    "pl": "Kąpiel, mycie zębów, książeczka",
    "es": "Baño, cepillado de dientes, un cuento",
    "fr": "Bain, brossage des dents, un livre",
    "de": "Baden, Zähneputzen, ein Buch",
    "pt": "Banho, escovar os dentes, um livro",
    "it": "Bagnetto, lavaggio dei denti, un libro"
  },
  "18–24 месяца": {
    "en": "18–24 months",
    "pl": "18–24 miesiące",
    "es": "18–24 meses",
    "fr": "18–24 mois",
    "de": "18–24 Monate",
    "pt": "18–24 meses",
    "it": "18–24 mesi"
  },
  "1": {
    "en": "1",
    "pl": "1",
    "es": "1",
    "fr": "1",
    "de": "1",
    "pt": "1",
    "it": "1"
  },
  "5–6 ч": {
    "en": "5–6 h",
    "pl": "5–6 godz.",
    "es": "5–6 h",
    "fr": "5–6 h",
    "de": "5–6 Std.",
    "pt": "5–6 h",
    "it": "5–6 h"
  },
  "Около 20:00": {
    "en": "Around 20:00",
    "pl": "Około 20:00",
    "es": "Alrededor de 20:00",
    "fr": "Vers 20:00",
    "de": "Etwa 20:00",
    "pt": "Cerca das 20:00",
    "it": "Circa le 20:00"
  },
  "Желательно сохранять близкий график в будни и выходные.": {
    "en": "It's best to keep a similar schedule on weekdays and weekends.",
    "pl": "Warto zachować zbliżony harmonogram w dni robocze i weekendy.",
    "es": "Conviene mantener un horario similar entre semana y el fin de semana.",
    "fr": "Mieux vaut garder un horaire proche en semaine et le week-end.",
    "de": "Es ist ratsam, an Wochentagen und Wochenenden einen ähnlichen Zeitplan beizubehalten.",
    "pt": "É aconselhável manter um horário semelhante durante a semana e ao fim de semana.",
    "it": "È preferibile mantenere un orario simile nei giorni feriali e nel weekend."
  },
  "Прогулка, игры, бытовые занятия": {
    "en": "Walk, play, everyday activities",
    "pl": "Spacer, zabawa, zajęcia domowe",
    "es": "Paseo, juego, tareas cotidianas",
    "fr": "Promenade, jeux, activités du quotidien",
    "de": "Spaziergang, Spielen, Alltagsaktivitäten",
    "pt": "Passeio, brincadeiras, tarefas do dia a dia",
    "it": "Passeggiata, gioco, attività quotidiane"
  },
  "Только спокойная активность": {
    "en": "Calm activity only",
    "pl": "Tylko spokojna aktywność",
    "es": "Solo actividad tranquila",
    "fr": "Activité calme uniquement",
    "de": "Nur ruhige Aktivität",
    "pt": "Apenas atividade calma",
    "it": "Solo attività tranquilla"
  },
  "Умывание или ванна, зубы, книга": {
    "en": "Washing up or a bath, teeth, a book",
    "pl": "Mycie lub kąpiel, zęby, książeczka",
    "es": "Aseo o baño, dientes, un cuento",
    "fr": "Toilette ou bain, dents, un livre",
    "de": "Waschen oder Baden, Zähne, ein Buch",
    "pt": "Lavar ou tomar banho, dentes, um livro",
    "it": "Lavarsi o fare il bagnetto, denti, un libro"
  }
};
