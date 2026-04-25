# OwnDelivery — Courier App
Vue 3 + TypeScript + Vite + Pinia + Vue Router
## Запуск
```bash
npm install
npm run dev
```
## Структура
```
src/
├── api/           # HTTP-клієнт (axios)
├── assets/        # Зображення, іконки, стилі
├── components/    # UI-компоненти
│   ├── common/    # Базові: ui, layout, feedback, form
│   └── courier/   # Специфічні для кур'єра
├── composables/   # Vue composables
├── constants/     # Константи
├── plugins/       # Реєстрація плагінів
├── router/        # Vue Router
├── stores/        # Pinia stores
├── types/         # TypeScript типи
├── utils/         # Утиліти
└── views/         # Сторінки
```
