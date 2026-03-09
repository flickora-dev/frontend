# Flickora — Frontend

Frontend React platformy Flickora do odkrywania filmów z AI. Interfejs do przeglądania filmów, czatu z asystentem AI i zarządzania kontem.

## Stack

- **React 18** + Vite
- **Tailwind CSS** + shadcn/ui (komponenty Radix)
- **TanStack Query** — pobieranie i cache danych
- **Zustand** — stan globalny (auth, motyw)
- **react-i18next** — tłumaczenia PL/EN
- **vite-plugin-pwa** — PWA, service worker

## Uruchomienie lokalne

```bash
npm install
```

Utwórz plik `.env`:
```env
VITE_API_URL=http://localhost:8000/api/
```

```bash
npm run dev      # http://localhost:5173
npm run build    # build produkcyjny do dist/
```

## Docker

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000/api/ -t flickora-frontend .
docker run -d -p 3000:3000 flickora-frontend
```

## Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---|---|---|
| `VITE_API_URL` | Tak | Bazowy URL API backendu (musi zawierać `/api/`) |

> Zmienna `VITE_API_URL` jest wbudowywana w build w czasie kompilacji. Przy deploymencie na Railway ustaw ją jako zmienną build, nie runtime.

## Strony

| Ścieżka | Opis |
|---|---|
| `/` | Strona główna — polecane i popularne filmy |
| `/movies` | Katalog filmów z wyszukiwarką i filtrami |
| `/movies/:id` | Szczegóły filmu z analizą AI i czatem |
| `/trending` | Filmy na czasie |
| `/chat` | Globalny czat z asystentem AI |
| `/favorites` | Ulubione filmy użytkownika |
| `/recent-chats` | Historia rozmów |
| `/profile` | Profil i statystyki użytkownika |
| `/settings` | Ustawienia (motyw, język, instalacja PWA) |

## Wdrożenie (Railway)

Konfiguracja w `railway.toml`. Ustaw `VITE_API_URL` jako zmienną build wskazującą na URL backendu.

## Licencja

MIT
