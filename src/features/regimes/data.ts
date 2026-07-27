// AUTO-GENERATED from the published Google Sheet by scripts/regimes-import.py.
// Do not edit by hand.
import { type RegimeAge } from './types';

export const REGIMES: RegimeAge[] = [
  {
    "age": "0–6 недель",
    "timed": false,
    "summary": {
      "sleep24": "Часто 14–17 ч; индивидуальный разброс большой",
      "naps": "5–8 и более",
      "wakeWindow": "30–60 мин",
      "wakeUp": "Не фиксируется",
      "nightSleep": "Не фиксируется",
      "features": "Кормление → короткое бодрствование → сон; день и ночь постепенно различают светом и активностью."
    },
    "source": "https://www.nhs.uk/best-start-in-life/baby/baby-basics/newborn-and-baby-sleeping-advice-for-parents/your-babys-sleep-patterns/",
    "variants": [
      {
        "name": "Цикл, а не строгий график",
        "steps": [
          {
            "time": "После пробуждения",
            "startMin": null,
            "endMin": null,
            "action": "Кормление",
            "note": "Грудное молоко или смесь по потребности и рекомендациям врача.",
            "kind": "meal"
          },
          {
            "time": "Следующие 5–20 мин",
            "startMin": null,
            "endMin": null,
            "action": "Подгузник и спокойное общение",
            "note": "Короткий контакт, разговор, рассматривание лица.",
            "kind": "other"
          },
          {
            "time": "Несколько минут",
            "startMin": null,
            "endMin": null,
            "action": "Время на животе",
            "note": "Только в бодрствовании и под постоянным наблюдением.",
            "kind": "play"
          },
          {
            "time": "При первых признаках усталости",
            "startMin": null,
            "endMin": null,
            "action": "Сон",
            "note": "Не растягивать бодрствование ради более долгого ночного сна.",
            "kind": "sleep"
          },
          {
            "time": "Круглосуточно",
            "startMin": null,
            "endMin": null,
            "action": "Повторение цикла",
            "note": "Ночные кормления в этом возрасте обычны.",
            "kind": "other"
          }
        ]
      }
    ]
  },
  {
    "age": "6–12 недель",
    "timed": true,
    "summary": {
      "sleep24": "Обычно около 14–17 ч",
      "naps": "4–6",
      "wakeWindow": "45–90 мин",
      "wakeUp": "Около 07:00 ± 1 ч",
      "nightSleep": "20:00–21:30",
      "features": "Время ещё может заметно сдвигаться; важнее повторяемая последовательность действий."
    },
    "source": "https://www.nhs.uk/best-start-in-life/baby/baby-basics/newborn-and-baby-sleeping-advice-for-parents/your-babys-sleep-patterns/",
    "variants": [
      {
        "name": "Пример дня",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Пробуждение и кормление",
            "note": "Допустимо отклонение примерно на час.",
            "kind": "meal"
          },
          {
            "time": "07:20–08:00",
            "startMin": 440,
            "endMin": 480,
            "action": "Подгузник, общение, время на животе",
            "note": "Спокойная активность.",
            "kind": "play"
          },
          {
            "time": "08:00–09:15",
            "startMin": 480,
            "endMin": 555,
            "action": "Первый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "09:15",
            "startMin": 555,
            "endMin": null,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "10:15–11:30",
            "startMin": 615,
            "endMin": 690,
            "action": "Второй сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "11:30–12:00",
            "startMin": 690,
            "endMin": 720,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "12:45–14:00",
            "startMin": 765,
            "endMin": 840,
            "action": "Третий сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "14:00–14:30",
            "startMin": 840,
            "endMin": 870,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "15:15–16:15",
            "startMin": 915,
            "endMin": 975,
            "action": "Четвёртый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "16:30–17:00",
            "startMin": 990,
            "endMin": 1020,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "17:45–18:30",
            "startMin": 1065,
            "endMin": 1110,
            "action": "Короткий пятый сон",
            "note": "Нужен не всем детям.",
            "kind": "sleep"
          },
          {
            "time": "19:00",
            "startMin": 1140,
            "endMin": null,
            "action": "Кормление и приглушённый свет",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "20:00–21:30",
            "startMin": 1200,
            "endMin": 1290,
            "action": "Начало ночного сна",
            "note": "Ночные кормления сохраняются.",
            "kind": "sleep"
          }
        ]
      }
    ]
  },
  {
    "age": "3–4 месяца",
    "timed": true,
    "summary": {
      "sleep24": "Обычно около 14–16 ч",
      "naps": "4–5",
      "wakeWindow": "1 ч 15 мин – 2 ч",
      "wakeUp": "Около 07:00 ± 30 мин",
      "nightSleep": "19:30–20:30",
      "features": "Можно закреплять подъём и вечерний ритуал; короткие дневные сны остаются нормальными."
    },
    "source": "https://www.cdc.gov/act-early/milestones/1-year.html",
    "variants": [
      {
        "name": "4 дневных сна",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Подъём и молочное кормление",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "08:20–09:30",
            "startMin": 500,
            "endMin": 570,
            "action": "Первый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "09:30–10:00",
            "startMin": 570,
            "endMin": 600,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "11:10–12:20",
            "startMin": 670,
            "endMin": 740,
            "action": "Второй сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "12:30",
            "startMin": 750,
            "endMin": null,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "14:00–15:15",
            "startMin": 840,
            "endMin": 915,
            "action": "Третий сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "15:15–15:45",
            "startMin": 915,
            "endMin": 945,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "17:00–17:40",
            "startMin": 1020,
            "endMin": 1060,
            "action": "Короткий четвёртый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "18:00",
            "startMin": 1080,
            "endMin": null,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "19:00",
            "startMin": 1140,
            "endMin": null,
            "action": "Вечерний ритуал",
            "note": "Приглушённый свет, переодевание, песня или короткая книга.",
            "kind": "ritual"
          },
          {
            "time": "19:30–20:00",
            "startMin": 1170,
            "endMin": 1200,
            "action": "Последнее кормление и ночной сон",
            "note": "",
            "kind": "sleep"
          }
        ]
      }
    ]
  },
  {
    "age": "5–6 месяцев",
    "timed": true,
    "summary": {
      "sleep24": "12–16 ч, включая дневной сон",
      "naps": "3–4",
      "wakeWindow": "2–2,5 ч",
      "wakeUp": "Около 07:00",
      "nightSleep": "19:30–20:00",
      "features": "При коротких снах может временно сохраняться четвёртый сон."
    },
    "source": "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html",
    "variants": [
      {
        "name": "3 дневных сна",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Подъём и молочное кормление",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "09:00–10:15",
            "startMin": 540,
            "endMin": 615,
            "action": "Первый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "10:15",
            "startMin": 615,
            "endMin": null,
            "action": "Молочное кормление",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "11:00",
            "startMin": 660,
            "endMin": null,
            "action": "Прикорм при наличии готовности",
            "note": "Небольшое количество; не заменяет молочное кормление.",
            "kind": "meal"
          },
          {
            "time": "12:30–14:00",
            "startMin": 750,
            "endMin": 840,
            "action": "Второй сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "14:00",
            "startMin": 840,
            "endMin": null,
            "action": "Молочное кормление",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "16:30–17:00",
            "startMin": 990,
            "endMin": 1020,
            "action": "Третий короткий сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "17:00–17:30",
            "startMin": 1020,
            "endMin": 1050,
            "action": "Кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "18:30",
            "startMin": 1110,
            "endMin": null,
            "action": "Спокойные игры и купание",
            "note": "",
            "kind": "ritual"
          },
          {
            "time": "19:15",
            "startMin": 1155,
            "endMin": null,
            "action": "Молочное кормление",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "19:30–20:00",
            "startMin": 1170,
            "endMin": 1200,
            "action": "Ночной сон",
            "note": "Если третий сон пропущен, укладывание часто делают раньше.",
            "kind": "sleep"
          }
        ]
      }
    ]
  },
  {
    "age": "7–9 месяцев",
    "timed": true,
    "summary": {
      "sleep24": "12–16 ч, включая дневной сон",
      "naps": "2–3",
      "wakeWindow": "2,5–3,5 ч",
      "wakeUp": "Около 07:00",
      "nightSleep": "19:30–20:00",
      "features": "Третий короткий сон убирают, когда он регулярно мешает ночному укладыванию."
    },
    "source": "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/how-much-and-how-often-to-feed.html",
    "variants": [
      {
        "name": "2 дневных сна",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Подъём и грудное молоко/смесь",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "08:00",
            "startMin": 480,
            "endMin": null,
            "action": "Завтрак",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "09:30–10:45",
            "startMin": 570,
            "endMin": 645,
            "action": "Первый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "11:00",
            "startMin": 660,
            "endMin": null,
            "action": "Грудное молоко/смесь",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "12:30",
            "startMin": 750,
            "endMin": null,
            "action": "Обед",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "14:00–15:30",
            "startMin": 840,
            "endMin": 930,
            "action": "Второй сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "15:30–16:00",
            "startMin": 930,
            "endMin": 960,
            "action": "Грудное молоко/смесь",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "17:30–18:00",
            "startMin": 1050,
            "endMin": 1080,
            "action": "Ужин или небольшое кормление",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "18:45",
            "startMin": 1125,
            "endMin": null,
            "action": "Вечерний ритуал",
            "note": "Купание, спокойные игры, книга.",
            "kind": "ritual"
          },
          {
            "time": "19:15",
            "startMin": 1155,
            "endMin": null,
            "action": "Грудное молоко/смесь",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "19:30–20:00",
            "startMin": 1170,
            "endMin": 1200,
            "action": "Ночной сон",
            "note": "",
            "kind": "sleep"
          }
        ]
      },
      {
        "name": "3 сна при коротких снах",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Подъём",
            "note": "",
            "kind": "wake"
          },
          {
            "time": "09:00–09:45",
            "startMin": 540,
            "endMin": 585,
            "action": "Первый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "12:15–13:15",
            "startMin": 735,
            "endMin": 795,
            "action": "Второй сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "16:00–16:30",
            "startMin": 960,
            "endMin": 990,
            "action": "Третий короткий сон",
            "note": "Убирают, когда он регулярно мешает ночному засыпанию.",
            "kind": "sleep"
          },
          {
            "time": "19:30–20:00",
            "startMin": 1170,
            "endMin": 1200,
            "action": "Ночной сон",
            "note": "",
            "kind": "sleep"
          }
        ]
      }
    ]
  },
  {
    "age": "10–12 месяцев",
    "timed": true,
    "summary": {
      "sleep24": "12–16 ч, включая дневной сон",
      "naps": "Обычно 2",
      "wakeWindow": "3–4 ч",
      "wakeUp": "06:30–07:00",
      "nightSleep": "19:30–20:00",
      "features": "Переход на один сон часто ещё преждевременен."
    },
    "source": "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/how-much-and-how-often-to-feed.html",
    "variants": [
      {
        "name": "2 стабильных сна",
        "steps": [
          {
            "time": "06:30–07:00",
            "startMin": 390,
            "endMin": 420,
            "action": "Подъём и грудное молоко/смесь",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "08:00",
            "startMin": 480,
            "endMin": null,
            "action": "Завтрак",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "09:30–10:45",
            "startMin": 570,
            "endMin": 645,
            "action": "Первый сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "11:00",
            "startMin": 660,
            "endMin": null,
            "action": "Молочное кормление",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "12:30",
            "startMin": 750,
            "endMin": null,
            "action": "Обед",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "14:15–15:30",
            "startMin": 855,
            "endMin": 930,
            "action": "Второй сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "15:30",
            "startMin": 930,
            "endMin": null,
            "action": "Молочное кормление или перекус",
            "note": "Зависит от индивидуального рациона.",
            "kind": "milk"
          },
          {
            "time": "18:00",
            "startMin": 1080,
            "endMin": null,
            "action": "Ужин",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "19:00",
            "startMin": 1140,
            "endMin": null,
            "action": "Тихий вечерний ритуал",
            "note": "",
            "kind": "ritual"
          },
          {
            "time": "19:30",
            "startMin": 1170,
            "endMin": null,
            "action": "Грудное молоко/смесь",
            "note": "",
            "kind": "milk"
          },
          {
            "time": "19:45–20:00",
            "startMin": 1185,
            "endMin": 1200,
            "action": "Ночной сон",
            "note": "",
            "kind": "sleep"
          }
        ]
      }
    ]
  },
  {
    "age": "12–15 месяцев",
    "timed": true,
    "summary": {
      "sleep24": "11–14 ч, включая дневной сон",
      "naps": "1–2",
      "wakeWindow": "3,5–5 ч",
      "wakeUp": "Около 07:00",
      "nightSleep": "19:30–20:00",
      "features": "Переход на один сон оценивают по устойчивым признакам минимум 1–2 недели."
    },
    "source": "https://www.cdc.gov/child-development/positive-parenting-tips/toddlers-1-2-years.html",
    "variants": [
      {
        "name": "2 дневных сна",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Подъём",
            "note": "",
            "kind": "wake"
          },
          {
            "time": "07:30",
            "startMin": 450,
            "endMin": null,
            "action": "Завтрак",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "09:45–10:30",
            "startMin": 585,
            "endMin": 630,
            "action": "Первый короткий сон",
            "note": "Короткий первый сон помогает сохранить второй.",
            "kind": "sleep"
          },
          {
            "time": "11:00",
            "startMin": 660,
            "endMin": null,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "12:30",
            "startMin": 750,
            "endMin": null,
            "action": "Обед",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "14:30–15:30",
            "startMin": 870,
            "endMin": 930,
            "action": "Второй сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "16:00",
            "startMin": 960,
            "endMin": null,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "18:30",
            "startMin": 1110,
            "endMin": null,
            "action": "Ужин",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "19:30",
            "startMin": 1170,
            "endMin": null,
            "action": "Вечерний ритуал",
            "note": "",
            "kind": "ritual"
          },
          {
            "time": "20:00",
            "startMin": 1200,
            "endMin": null,
            "action": "Ночной сон",
            "note": "",
            "kind": "sleep"
          }
        ]
      },
      {
        "name": "1 дневной сон",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Подъём",
            "note": "",
            "kind": "wake"
          },
          {
            "time": "07:30",
            "startMin": 450,
            "endMin": null,
            "action": "Завтрак",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "09:30",
            "startMin": 570,
            "endMin": null,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "11:30",
            "startMin": 690,
            "endMin": null,
            "action": "Ранний обед",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "12:00–14:00",
            "startMin": 720,
            "endMin": 840,
            "action": "Дневной сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "14:30",
            "startMin": 870,
            "endMin": null,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "18:00",
            "startMin": 1080,
            "endMin": null,
            "action": "Ужин",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "19:00",
            "startMin": 1140,
            "endMin": null,
            "action": "Вечерний ритуал",
            "note": "",
            "kind": "ritual"
          },
          {
            "time": "19:30",
            "startMin": 1170,
            "endMin": null,
            "action": "Ночной сон",
            "note": "Во время перехода укладывание часто временно делают раньше.",
            "kind": "sleep"
          }
        ]
      }
    ]
  },
  {
    "age": "15–18 месяцев",
    "timed": true,
    "summary": {
      "sleep24": "11–14 ч, включая дневной сон",
      "naps": "Обычно 1",
      "wakeWindow": "4,5–5,5 ч",
      "wakeUp": "Около 07:00",
      "nightSleep": "19:45–20:00",
      "features": "Основные точки дня уже можно достаточно стабильно привязать ко времени."
    },
    "source": "https://www.cdc.gov/child-development/positive-parenting-tips/toddlers-1-2-years.html",
    "variants": [
      {
        "name": "1 дневной сон",
        "steps": [
          {
            "time": "07:00",
            "startMin": 420,
            "endMin": null,
            "action": "Подъём",
            "note": "",
            "kind": "wake"
          },
          {
            "time": "07:30",
            "startMin": 450,
            "endMin": null,
            "action": "Завтрак",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "09:30–10:00",
            "startMin": 570,
            "endMin": 600,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "10:00–11:30",
            "startMin": 600,
            "endMin": 690,
            "action": "Прогулка и активные игры",
            "note": "",
            "kind": "play"
          },
          {
            "time": "11:45–12:00",
            "startMin": 705,
            "endMin": 720,
            "action": "Обед",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "12:30–14:30",
            "startMin": 750,
            "endMin": 870,
            "action": "Дневной сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "15:00",
            "startMin": 900,
            "endMin": null,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "15:30–18:00",
            "startMin": 930,
            "endMin": 1080,
            "action": "Прогулка и игры",
            "note": "",
            "kind": "play"
          },
          {
            "time": "18:00–18:30",
            "startMin": 1080,
            "endMin": 1110,
            "action": "Ужин",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "19:15",
            "startMin": 1155,
            "endMin": null,
            "action": "Купание, чистка зубов, книга",
            "note": "",
            "kind": "ritual"
          },
          {
            "time": "19:45–20:00",
            "startMin": 1185,
            "endMin": 1200,
            "action": "Ночной сон",
            "note": "",
            "kind": "sleep"
          }
        ]
      }
    ]
  },
  {
    "age": "18–24 месяца",
    "timed": true,
    "summary": {
      "sleep24": "11–14 ч, включая дневной сон",
      "naps": "1",
      "wakeWindow": "5–6 ч",
      "wakeUp": "06:30–07:00",
      "nightSleep": "Около 20:00",
      "features": "Желательно сохранять близкий график в будни и выходные."
    },
    "source": "https://www.cdc.gov/child-development/positive-parenting-tips/toddlers-1-2-years.html",
    "variants": [
      {
        "name": "1 дневной сон",
        "steps": [
          {
            "time": "06:30–07:00",
            "startMin": 390,
            "endMin": 420,
            "action": "Подъём",
            "note": "",
            "kind": "wake"
          },
          {
            "time": "07:30",
            "startMin": 450,
            "endMin": null,
            "action": "Завтрак",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "10:00",
            "startMin": 600,
            "endMin": null,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "10:30–12:00",
            "startMin": 630,
            "endMin": 720,
            "action": "Прогулка и активные игры",
            "note": "",
            "kind": "play"
          },
          {
            "time": "12:00",
            "startMin": 720,
            "endMin": null,
            "action": "Обед",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "12:30–14:30",
            "startMin": 750,
            "endMin": 870,
            "action": "Дневной сон",
            "note": "",
            "kind": "sleep"
          },
          {
            "time": "15:00",
            "startMin": 900,
            "endMin": null,
            "action": "Перекус",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "15:30–18:00",
            "startMin": 930,
            "endMin": 1080,
            "action": "Прогулка, игры, бытовые занятия",
            "note": "",
            "kind": "play"
          },
          {
            "time": "18:00–18:30",
            "startMin": 1080,
            "endMin": 1110,
            "action": "Ужин",
            "note": "",
            "kind": "meal"
          },
          {
            "time": "19:00",
            "startMin": 1140,
            "endMin": null,
            "action": "Только спокойная активность",
            "note": "",
            "kind": "play"
          },
          {
            "time": "19:30",
            "startMin": 1170,
            "endMin": null,
            "action": "Умывание или ванна, зубы, книга",
            "note": "",
            "kind": "ritual"
          },
          {
            "time": "20:00",
            "startMin": 1200,
            "endMin": null,
            "action": "Ночной сон",
            "note": "",
            "kind": "sleep"
          }
        ]
      }
    ]
  }
];
