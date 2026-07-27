// Translations of the regime content (source language: ru). Maintained by hand:
// after regimes-import.py adds new Russian source strings to data.ts, add their
// translations here — anything missing falls back to the Russian source.
import { type LanguageCode } from '@/i18n';

type Lang = Exclude<LanguageCode, 'ru' | 'uk'>;

// Maps each Russian source string to its translations; missing entries
// fall back to the Russian source at runtime.
export const REGIME_STRINGS: Record<string, Record<Lang, string>> = {
  "0–6 недель": {
    "en": "0–6 weeks",
    "pl": "0–6 tygodni",
    "es": "0–6 semanas",
    "fr": "0–6 semaines"
  },
  "Часто 14–17 ч; индивидуальный разброс большой": {
    "en": "Often 14–17 h; wide individual variation",
    "pl": "Zwykle 14–17 godz.; duże różnice indywidualne",
    "es": "A menudo 14–17 h; gran variación individual",
    "fr": "Souvent 14–17 h ; grande variation individuelle"
  },
  "5–8 и более": {
    "en": "5–8 or more",
    "pl": "5–8 i więcej",
    "es": "5–8 o más",
    "fr": "5–8 ou plus"
  },
  "30–60 мин": {
    "en": "30–60 min",
    "pl": "30–60 min",
    "es": "30–60 min",
    "fr": "30–60 min"
  },
  "Не фиксируется": {
    "en": "Not fixed",
    "pl": "Nie ustalone",
    "es": "No fijo",
    "fr": "Non fixé"
  },
  "Кормление → короткое бодрствование → сон; день и ночь постепенно различают светом и активностью.": {
    "en": "Feeding → short awake time → sleep; day and night are gradually distinguished with light and activity.",
    "pl": "Karmienie → krótkie czuwanie → sen; dzień i noc stopniowo rozróżniane światłem i aktywnością.",
    "es": "Toma → vigilia corta → sueño; el día y la noche se distinguen poco a poco con luz y actividad.",
    "fr": "Repas → court éveil → sommeil ; jour et nuit se distinguent peu à peu par la lumière et l'activité."
  },
  "Цикл, а не строгий график": {
    "en": "A cycle, not a strict schedule",
    "pl": "Cykl, a nie sztywny harmonogram",
    "es": "Un ciclo, no un horario estricto",
    "fr": "Un cycle, pas un horaire strict"
  },
  "Кормление": {
    "en": "Feeding",
    "pl": "Karmienie",
    "es": "Toma",
    "fr": "Repas"
  },
  "Грудное молоко или смесь по потребности и рекомендациям врача.": {
    "en": "Breast milk or formula on demand and per your doctor's advice.",
    "pl": "Mleko mamy lub mieszanka na żądanie i zgodnie z zaleceniami lekarza.",
    "es": "Leche materna o fórmula a demanda y según las indicaciones del médico.",
    "fr": "Lait maternel ou infantile à la demande et selon l'avis du médecin."
  },
  "Подгузник и спокойное общение": {
    "en": "Diaper and calm interaction",
    "pl": "Pielucha i spokojny kontakt",
    "es": "Pañal e interacción tranquila",
    "fr": "Couche et échange calme"
  },
  "Короткий контакт, разговор, рассматривание лица.": {
    "en": "Brief contact, talking, looking at your face.",
    "pl": "Krótki kontakt, rozmowa, patrzenie na twarz.",
    "es": "Contacto breve, hablar, mirar la cara.",
    "fr": "Contact bref, parler, regarder le visage."
  },
  "Время на животе": {
    "en": "Tummy time",
    "pl": "Leżenie na brzuchu",
    "es": "Tiempo boca abajo",
    "fr": "Temps sur le ventre"
  },
  "Только в бодрствовании и под постоянным наблюдением.": {
    "en": "Only while awake and under constant supervision.",
    "pl": "Tylko na czuwaniu i pod stałym nadzorem.",
    "es": "Solo despierto y bajo supervisión constante.",
    "fr": "Uniquement éveillé et sous surveillance constante."
  },
  "Сон": {
    "en": "Sleep",
    "pl": "Sen",
    "es": "Sueño",
    "fr": "Sommeil"
  },
  "Не растягивать бодрствование ради более долгого ночного сна.": {
    "en": "Don't stretch awake time hoping for longer night sleep.",
    "pl": "Nie wydłużaj czuwania dla dłuższego snu nocnego.",
    "es": "No alargues la vigilia buscando un sueño nocturno más largo.",
    "fr": "N'allongez pas l'éveil pour un sommeil de nuit plus long."
  },
  "Повторение цикла": {
    "en": "Repeat the cycle",
    "pl": "Powtórzenie cyklu",
    "es": "Repetir el ciclo",
    "fr": "Répéter le cycle"
  },
  "Ночные кормления в этом возрасте обычны.": {
    "en": "Night feedings are normal at this age.",
    "pl": "Karmienia nocne w tym wieku są normalne.",
    "es": "Las tomas nocturnas son normales a esta edad.",
    "fr": "Les repas de nuit sont normaux à cet âge."
  },
  "6–12 недель": {
    "en": "6–12 weeks",
    "pl": "6–12 tygodni",
    "es": "6–12 semanas",
    "fr": "6–12 semaines"
  },
  "Обычно около 14–17 ч": {
    "en": "Usually about 14–17 h",
    "pl": "Zwykle około 14–17 godz.",
    "es": "Normalmente unas 14–17 h",
    "fr": "Habituellement environ 14–17 h"
  },
  "4–6": {
    "en": "4–6",
    "pl": "4–6",
    "es": "4–6",
    "fr": "4–6"
  },
  "45–90 мин": {
    "en": "45–90 min",
    "pl": "45–90 min",
    "es": "45–90 min",
    "fr": "45–90 min"
  },
  "Около 07:00 ± 1 ч": {
    "en": "Around 07:00 ± 1 h",
    "pl": "Około 07:00 ± 1 godz.",
    "es": "Alrededor de 07:00 ± 1 h",
    "fr": "Vers 07:00 ± 1 h"
  },
  "20:00–21:30": {
    "en": "20:00–21:30",
    "pl": "20:00–21:30",
    "es": "20:00–21:30",
    "fr": "20:00–21:30"
  },
  "Время ещё может заметно сдвигаться; важнее повторяемая последовательность действий.": {
    "en": "Times can still shift noticeably; a repeatable sequence matters more.",
    "pl": "Godziny mogą się jeszcze wyraźnie przesuwać; ważniejsza jest powtarzalna kolejność.",
    "es": "Los horarios aún pueden variar bastante; importa más una secuencia repetible.",
    "fr": "Les horaires peuvent encore bouger nettement ; une séquence répétable compte plus."
  },
  "Пример дня": {
    "en": "Sample day",
    "pl": "Przykładowy dzień",
    "es": "Día de ejemplo",
    "fr": "Journée type"
  },
  "Пробуждение и кормление": {
    "en": "Wake-up and feeding",
    "pl": "Pobudka i karmienie",
    "es": "Despertar y toma",
    "fr": "Réveil et repas"
  },
  "Допустимо отклонение примерно на час.": {
    "en": "A deviation of about an hour is fine.",
    "pl": "Odchylenie około godziny jest dopuszczalne.",
    "es": "Se admite una variación de aproximadamente una hora.",
    "fr": "Un écart d'environ une heure est acceptable."
  },
  "Подгузник, общение, время на животе": {
    "en": "Diaper, interaction, tummy time",
    "pl": "Pielucha, kontakt, leżenie na brzuchu",
    "es": "Pañal, interacción, tiempo boca abajo",
    "fr": "Couche, échange, temps sur le ventre"
  },
  "Спокойная активность.": {
    "en": "Calm activity.",
    "pl": "Spokojna aktywność.",
    "es": "Actividad tranquila.",
    "fr": "Activité calme."
  },
  "Первый сон": {
    "en": "First nap",
    "pl": "Pierwsza drzemka",
    "es": "Primera siesta",
    "fr": "Première sieste"
  },
  "Второй сон": {
    "en": "Second nap",
    "pl": "Druga drzemka",
    "es": "Segunda siesta",
    "fr": "Deuxième sieste"
  },
  "Третий сон": {
    "en": "Third nap",
    "pl": "Trzecia drzemka",
    "es": "Tercera siesta",
    "fr": "Troisième sieste"
  },
  "Четвёртый сон": {
    "en": "Fourth nap",
    "pl": "Czwarta drzemka",
    "es": "Cuarta siesta",
    "fr": "Quatrième sieste"
  },
  "Короткий пятый сон": {
    "en": "Short fifth nap",
    "pl": "Krótka piąta drzemka",
    "es": "Quinta siesta corta",
    "fr": "Courte cinquième sieste"
  },
  "Нужен не всем детям.": {
    "en": "Not all babies need it.",
    "pl": "Nie każde dziecko go potrzebuje.",
    "es": "No todos los bebés la necesitan.",
    "fr": "Tous les bébés n'en ont pas besoin."
  },
  "Кормление и приглушённый свет": {
    "en": "Feeding and dim light",
    "pl": "Karmienie i przyćmione światło",
    "es": "Toma y luz tenue",
    "fr": "Repas et lumière tamisée"
  },
  "Начало ночного сна": {
    "en": "Start of night sleep",
    "pl": "Początek snu nocnego",
    "es": "Inicio del sueño nocturno",
    "fr": "Début du sommeil de nuit"
  },
  "Ночные кормления сохраняются.": {
    "en": "Night feedings continue.",
    "pl": "Karmienia nocne pozostają.",
    "es": "Las tomas nocturnas se mantienen.",
    "fr": "Les repas de nuit se poursuivent."
  },
  "3–4 месяца": {
    "en": "3–4 months",
    "pl": "3–4 miesiące",
    "es": "3–4 meses",
    "fr": "3–4 mois"
  },
  "Обычно около 14–16 ч": {
    "en": "Usually about 14–16 h",
    "pl": "Zwykle około 14–16 godz.",
    "es": "Normalmente unas 14–16 h",
    "fr": "Habituellement environ 14–16 h"
  },
  "4–5": {
    "en": "4–5",
    "pl": "4–5",
    "es": "4–5",
    "fr": "4–5"
  },
  "1 ч 15 мин – 2 ч": {
    "en": "1 h 15 min – 2 h",
    "pl": "1 godz. 15 min – 2 godz.",
    "es": "1 h 15 min – 2 h",
    "fr": "1 h 15 min – 2 h"
  },
  "Около 07:00 ± 30 мин": {
    "en": "Around 07:00 ± 30 min",
    "pl": "Około 07:00 ± 30 min",
    "es": "Alrededor de 07:00 ± 30 min",
    "fr": "Vers 07:00 ± 30 min"
  },
  "19:30–20:30": {
    "en": "19:30–20:30",
    "pl": "19:30–20:30",
    "es": "19:30–20:30",
    "fr": "19:30–20:30"
  },
  "Можно закреплять подъём и вечерний ритуал; короткие дневные сны остаются нормальными.": {
    "en": "You can start fixing wake-up and the bedtime routine; short naps are still normal.",
    "pl": "Można utrwalać pobudkę i rytuał wieczorny; krótkie drzemki są nadal normalne.",
    "es": "Puedes fijar el despertar y la rutina de la noche; las siestas cortas siguen siendo normales.",
    "fr": "On peut fixer le réveil et le rituel du soir ; les siestes courtes restent normales."
  },
  "4 дневных сна": {
    "en": "4 naps",
    "pl": "4 drzemki",
    "es": "4 siestas",
    "fr": "4 siestes"
  },
  "Подъём и молочное кормление": {
    "en": "Wake-up and milk feeding",
    "pl": "Pobudka i karmienie mlekiem",
    "es": "Despertar y toma de leche",
    "fr": "Réveil et repas lacté"
  },
  "Короткий четвёртый сон": {
    "en": "Short fourth nap",
    "pl": "Krótka czwarta drzemka",
    "es": "Cuarta siesta corta",
    "fr": "Courte quatrième sieste"
  },
  "Вечерний ритуал": {
    "en": "Bedtime routine",
    "pl": "Rytuał wieczorny",
    "es": "Rutina de la noche",
    "fr": "Rituel du soir"
  },
  "Приглушённый свет, переодевание, песня или короткая книга.": {
    "en": "Dim light, changing, a song or a short book.",
    "pl": "Przyćmione światło, przebranie, piosenka lub krótka książeczka.",
    "es": "Luz tenue, cambio de ropa, una canción o un cuento corto.",
    "fr": "Lumière tamisée, change, une chanson ou un petit livre."
  },
  "Последнее кормление и ночной сон": {
    "en": "Last feeding and night sleep",
    "pl": "Ostatnie karmienie i sen nocny",
    "es": "Última toma y sueño nocturno",
    "fr": "Dernier repas et sommeil de nuit"
  },
  "5–6 месяцев": {
    "en": "5–6 months",
    "pl": "5–6 miesięcy",
    "es": "5–6 meses",
    "fr": "5–6 mois"
  },
  "12–16 ч, включая дневной сон": {
    "en": "12–16 h, including daytime sleep",
    "pl": "12–16 godz., wliczając sen dzienny",
    "es": "12–16 h, incluido el sueño diurno",
    "fr": "12–16 h, sieste comprise"
  },
  "3–4": {
    "en": "3–4",
    "pl": "3–4",
    "es": "3–4",
    "fr": "3–4"
  },
  "2–2,5 ч": {
    "en": "2–2.5 h",
    "pl": "2–2,5 godz.",
    "es": "2–2,5 h",
    "fr": "2–2,5 h"
  },
  "Около 07:00": {
    "en": "Around 07:00",
    "pl": "Około 07:00",
    "es": "Alrededor de 07:00",
    "fr": "Vers 07:00"
  },
  "19:30–20:00": {
    "en": "19:30–20:00",
    "pl": "19:30–20:00",
    "es": "19:30–20:00",
    "fr": "19:30–20:00"
  },
  "При коротких снах может временно сохраняться четвёртый сон.": {
    "en": "With short naps, a fourth nap may remain for a while.",
    "pl": "Przy krótkich drzemkach czwarta drzemka może chwilowo pozostać.",
    "es": "Con siestas cortas, puede mantenerse temporalmente una cuarta siesta.",
    "fr": "Avec des siestes courtes, une quatrième sieste peut subsister un temps."
  },
  "3 дневных сна": {
    "en": "3 naps",
    "pl": "3 drzemki",
    "es": "3 siestas",
    "fr": "3 siestes"
  },
  "Молочное кормление": {
    "en": "Milk feeding",
    "pl": "Karmienie mlekiem",
    "es": "Toma de leche",
    "fr": "Repas lacté"
  },
  "Прикорм при наличии готовности": {
    "en": "Solids if signs of readiness",
    "pl": "Pokarmy stałe, jeśli są oznaki gotowości",
    "es": "Alimentos sólidos si hay señales de preparación",
    "fr": "Diversification si signes de préparation"
  },
  "Небольшое количество; не заменяет молочное кормление.": {
    "en": "A small amount; does not replace milk feeding.",
    "pl": "Niewielka ilość; nie zastępuje karmienia mlekiem.",
    "es": "Una pequeña cantidad; no sustituye la toma de leche.",
    "fr": "Une petite quantité ; ne remplace pas le repas lacté."
  },
  "Третий короткий сон": {
    "en": "Third short nap",
    "pl": "Trzecia krótka drzemka",
    "es": "Tercera siesta corta",
    "fr": "Troisième sieste courte"
  },
  "Спокойные игры и купание": {
    "en": "Calm play and bath",
    "pl": "Spokojna zabawa i kąpiel",
    "es": "Juego tranquilo y baño",
    "fr": "Jeu calme et bain"
  },
  "Ночной сон": {
    "en": "Night sleep",
    "pl": "Sen nocny",
    "es": "Sueño nocturno",
    "fr": "Sommeil de nuit"
  },
  "Если третий сон пропущен, укладывание часто делают раньше.": {
    "en": "If the third nap is skipped, bedtime is often earlier.",
    "pl": "Jeśli trzecia drzemka wypadnie, kładzenie spać jest często wcześniejsze.",
    "es": "Si se salta la tercera siesta, la hora de dormir suele adelantarse.",
    "fr": "Si la troisième sieste saute, le coucher est souvent avancé."
  },
  "7–9 месяцев": {
    "en": "7–9 months",
    "pl": "7–9 miesięcy",
    "es": "7–9 meses",
    "fr": "7–9 mois"
  },
  "2–3": {
    "en": "2–3",
    "pl": "2–3",
    "es": "2–3",
    "fr": "2–3"
  },
  "2,5–3,5 ч": {
    "en": "2.5–3.5 h",
    "pl": "2,5–3,5 godz.",
    "es": "2,5–3,5 h",
    "fr": "2,5–3,5 h"
  },
  "Третий короткий сон убирают, когда он регулярно мешает ночному укладыванию.": {
    "en": "Drop the third short nap when it regularly interferes with bedtime.",
    "pl": "Trzecią krótką drzemkę usuwa się, gdy regularnie zaburza wieczorne kładzenie.",
    "es": "Se elimina la tercera siesta corta cuando interfiere de forma habitual con la hora de dormir.",
    "fr": "On supprime la troisième sieste courte quand elle gêne régulièrement le coucher."
  },
  "2 дневных сна": {
    "en": "2 naps",
    "pl": "2 drzemki",
    "es": "2 siestas",
    "fr": "2 siestes"
  },
  "Подъём и грудное молоко/смесь": {
    "en": "Wake-up and breast milk/formula",
    "pl": "Pobudka i mleko mamy/mieszanka",
    "es": "Despertar y leche materna/fórmula",
    "fr": "Réveil et lait maternel/infantile"
  },
  "Завтрак": {
    "en": "Breakfast",
    "pl": "Śniadanie",
    "es": "Desayuno",
    "fr": "Petit-déjeuner"
  },
  "Грудное молоко/смесь": {
    "en": "Breast milk/formula",
    "pl": "Mleko mamy/mieszanka",
    "es": "Leche materna/fórmula",
    "fr": "Lait maternel/infantile"
  },
  "Обед": {
    "en": "Lunch",
    "pl": "Obiad",
    "es": "Almuerzo",
    "fr": "Déjeuner"
  },
  "Ужин или небольшое кормление": {
    "en": "Dinner or a small feeding",
    "pl": "Kolacja lub niewielkie karmienie",
    "es": "Cena o una toma pequeña",
    "fr": "Dîner ou petit repas"
  },
  "Купание, спокойные игры, книга.": {
    "en": "Bath, calm play, a book.",
    "pl": "Kąpiel, spokojna zabawa, książeczka.",
    "es": "Baño, juego tranquilo, un cuento.",
    "fr": "Bain, jeu calme, un livre."
  },
  "3 сна при коротких снах": {
    "en": "3 naps if naps are short",
    "pl": "3 drzemki przy krótkich drzemkach",
    "es": "3 siestas si las siestas son cortas",
    "fr": "3 siestes si les siestes sont courtes"
  },
  "Подъём": {
    "en": "Wake-up",
    "pl": "Pobudka",
    "es": "Despertar",
    "fr": "Réveil"
  },
  "Убирают, когда он регулярно мешает ночному засыпанию.": {
    "en": "Dropped when it regularly interferes with falling asleep at night.",
    "pl": "Usuwa się, gdy regularnie zaburza zasypianie w nocy.",
    "es": "Se elimina cuando interfiere de forma habitual con conciliar el sueño por la noche.",
    "fr": "On la supprime quand elle gêne régulièrement l'endormissement du soir."
  },
  "10–12 месяцев": {
    "en": "10–12 months",
    "pl": "10–12 miesięcy",
    "es": "10–12 meses",
    "fr": "10–12 mois"
  },
  "Обычно 2": {
    "en": "Usually 2",
    "pl": "Zwykle 2",
    "es": "Normalmente 2",
    "fr": "Habituellement 2"
  },
  "3–4 ч": {
    "en": "3–4 h",
    "pl": "3–4 godz.",
    "es": "3–4 h",
    "fr": "3–4 h"
  },
  "06:30–07:00": {
    "en": "06:30–07:00",
    "pl": "06:30–07:00",
    "es": "06:30–07:00",
    "fr": "06:30–07:00"
  },
  "Переход на один сон часто ещё преждевременен.": {
    "en": "Switching to one nap is often still premature.",
    "pl": "Przejście na jedną drzemkę często jest jeszcze przedwczesne.",
    "es": "Pasar a una sola siesta suele ser aún prematuro.",
    "fr": "Passer à une seule sieste est souvent encore prématuré."
  },
  "2 стабильных сна": {
    "en": "2 steady naps",
    "pl": "2 stabilne drzemki",
    "es": "2 siestas estables",
    "fr": "2 siestes stables"
  },
  "Молочное кормление или перекус": {
    "en": "Milk feeding or a snack",
    "pl": "Karmienie mlekiem lub przekąska",
    "es": "Toma de leche o un tentempié",
    "fr": "Repas lacté ou collation"
  },
  "Зависит от индивидуального рациона.": {
    "en": "Depends on the individual diet.",
    "pl": "Zależy od indywidualnej diety.",
    "es": "Depende de la dieta individual.",
    "fr": "Dépend du régime individuel."
  },
  "Ужин": {
    "en": "Dinner",
    "pl": "Kolacja",
    "es": "Cena",
    "fr": "Dîner"
  },
  "Тихий вечерний ритуал": {
    "en": "Quiet bedtime routine",
    "pl": "Cichy rytuał wieczorny",
    "es": "Rutina de noche tranquila",
    "fr": "Rituel du soir calme"
  },
  "12–15 месяцев": {
    "en": "12–15 months",
    "pl": "12–15 miesięcy",
    "es": "12–15 meses",
    "fr": "12–15 mois"
  },
  "11–14 ч, включая дневной сон": {
    "en": "11–14 h, including daytime sleep",
    "pl": "11–14 godz., wliczając sen dzienny",
    "es": "11–14 h, incluido el sueño diurno",
    "fr": "11–14 h, sieste comprise"
  },
  "1–2": {
    "en": "1–2",
    "pl": "1–2",
    "es": "1–2",
    "fr": "1–2"
  },
  "3,5–5 ч": {
    "en": "3.5–5 h",
    "pl": "3,5–5 godz.",
    "es": "3,5–5 h",
    "fr": "3,5–5 h"
  },
  "Переход на один сон оценивают по устойчивым признакам минимум 1–2 недели.": {
    "en": "Judge the switch to one nap by steady signs over at least 1–2 weeks.",
    "pl": "Przejście na jedną drzemkę ocenia się po stałych oznakach przez co najmniej 1–2 tygodnie.",
    "es": "Valora el paso a una siesta por señales estables durante al menos 1–2 semanas.",
    "fr": "Évaluez le passage à une sieste sur des signes stables pendant au moins 1–2 semaines."
  },
  "Первый короткий сон": {
    "en": "First short nap",
    "pl": "Pierwsza krótka drzemka",
    "es": "Primera siesta corta",
    "fr": "Première sieste courte"
  },
  "Короткий первый сон помогает сохранить второй.": {
    "en": "A short first nap helps keep the second one.",
    "pl": "Krótka pierwsza drzemka pomaga zachować drugą.",
    "es": "Una primera siesta corta ayuda a mantener la segunda.",
    "fr": "Une première sieste courte aide à garder la seconde."
  },
  "Перекус": {
    "en": "Snack",
    "pl": "Przekąska",
    "es": "Tentempié",
    "fr": "Collation"
  },
  "1 дневной сон": {
    "en": "1 nap",
    "pl": "1 drzemka",
    "es": "1 siesta",
    "fr": "1 sieste"
  },
  "Ранний обед": {
    "en": "Early lunch",
    "pl": "Wczesny obiad",
    "es": "Almuerzo temprano",
    "fr": "Déjeuner tôt"
  },
  "Дневной сон": {
    "en": "Nap",
    "pl": "Drzemka",
    "es": "Siesta",
    "fr": "Sieste"
  },
  "Во время перехода укладывание часто временно делают раньше.": {
    "en": "During the transition, bedtime is often temporarily earlier.",
    "pl": "W czasie przejścia kładzenie spać jest często chwilowo wcześniejsze.",
    "es": "Durante la transición, la hora de dormir suele adelantarse temporalmente.",
    "fr": "Pendant la transition, le coucher est souvent avancé temporairement."
  },
  "15–18 месяцев": {
    "en": "15–18 months",
    "pl": "15–18 miesięcy",
    "es": "15–18 meses",
    "fr": "15–18 mois"
  },
  "Обычно 1": {
    "en": "Usually 1",
    "pl": "Zwykle 1",
    "es": "Normalmente 1",
    "fr": "Habituellement 1"
  },
  "4,5–5,5 ч": {
    "en": "4.5–5.5 h",
    "pl": "4,5–5,5 godz.",
    "es": "4,5–5,5 h",
    "fr": "4,5–5,5 h"
  },
  "19:45–20:00": {
    "en": "19:45–20:00",
    "pl": "19:45–20:00",
    "es": "19:45–20:00",
    "fr": "19:45–20:00"
  },
  "Основные точки дня уже можно достаточно стабильно привязать ко времени.": {
    "en": "The main points of the day can now be tied to fairly stable times.",
    "pl": "Główne punkty dnia można już dość stabilnie przypisać do godzin.",
    "es": "Los momentos clave del día ya pueden fijarse a horas bastante estables.",
    "fr": "Les moments clés de la journée peuvent désormais être fixés à des heures assez stables."
  },
  "Прогулка и активные игры": {
    "en": "Walk and active play",
    "pl": "Spacer i aktywna zabawa",
    "es": "Paseo y juego activo",
    "fr": "Promenade et jeu actif"
  },
  "Прогулка и игры": {
    "en": "Walk and play",
    "pl": "Spacer i zabawa",
    "es": "Paseo y juego",
    "fr": "Promenade et jeu"
  },
  "Купание, чистка зубов, книга": {
    "en": "Bath, brushing teeth, a book",
    "pl": "Kąpiel, mycie zębów, książeczka",
    "es": "Baño, cepillado de dientes, un cuento",
    "fr": "Bain, brossage des dents, un livre"
  },
  "18–24 месяца": {
    "en": "18–24 months",
    "pl": "18–24 miesiące",
    "es": "18–24 meses",
    "fr": "18–24 mois"
  },
  "1": {
    "en": "1",
    "pl": "1",
    "es": "1",
    "fr": "1"
  },
  "5–6 ч": {
    "en": "5–6 h",
    "pl": "5–6 godz.",
    "es": "5–6 h",
    "fr": "5–6 h"
  },
  "Около 20:00": {
    "en": "Around 20:00",
    "pl": "Około 20:00",
    "es": "Alrededor de 20:00",
    "fr": "Vers 20:00"
  },
  "Желательно сохранять близкий график в будни и выходные.": {
    "en": "It's best to keep a similar schedule on weekdays and weekends.",
    "pl": "Warto zachować zbliżony harmonogram w dni robocze i weekendy.",
    "es": "Conviene mantener un horario similar entre semana y el fin de semana.",
    "fr": "Mieux vaut garder un horaire proche en semaine et le week-end."
  },
  "Прогулка, игры, бытовые занятия": {
    "en": "Walk, play, everyday activities",
    "pl": "Spacer, zabawa, zajęcia domowe",
    "es": "Paseo, juego, tareas cotidianas",
    "fr": "Promenade, jeux, activités du quotidien"
  },
  "Только спокойная активность": {
    "en": "Calm activity only",
    "pl": "Tylko spokojna aktywność",
    "es": "Solo actividad tranquila",
    "fr": "Activité calme uniquement"
  },
  "Умывание или ванна, зубы, книга": {
    "en": "Washing up or a bath, teeth, a book",
    "pl": "Mycie lub kąpiel, zęby, książeczka",
    "es": "Aseo o baño, dientes, un cuento",
    "fr": "Toilette ou bain, dents, un livre"
  }
};
