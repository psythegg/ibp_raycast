# IBP Booking — Raycast Extension

A Raycast extension for booking the IBP Lounge (Room 112, Education Building) without opening a browser.

## Book Lounge
![Book Lounge](../book-lounge.png)

## View Bookings
![View Bookings](../view-bookings.png)

## Features

- 📅 **Book Lounge** — Pick a date, select a time range, and submit a booking directly from Raycast
- 📋 **View Bookings** — See all upcoming lounge bookings for the current month
- ⚡ **Saves your info** — Your name, email, and student ID are stored in Raycast preferences so you never have to retype them

## Booking Rules

- No same-day bookings — must book at least 1 day in advance
- Minimum **1 hour** per booking
- Maximum **4 hours** per booking
- Maximum **2 bookings per date** (across all users)
- Maximum **1 booking per user per day**
- Maximum **2 bookings per user per week**
- Number of people must be between **7 and 30**

## Setup

### Requirements
- [Raycast](https://raycast.com) installed on macOS
- [Node.js](https://nodejs.org) v18 or higher

### Installation

1. Clone the repo:
```bash
   git clone https://github.com/sithuaung_eric/ibp_raycast.git
   cd ibp_raycast/ibp-booking
```

2. Install dependencies:
```bash
   npm install
```

3. Start the dev server:
```bash
   npm run dev
```

4. Open Raycast and search for **"Book Lounge"**

### Setting Up Your Preferences

Before booking, set your personal info in Raycast:

1. Open Raycast
2. Search **"Book Lounge"**
3. Press **⌘,** to open extension preferences
4. Fill in your **Full Name**, **Email**, and **Student ID**

## Commands

| Command | Description |
|---|---|
| Book Lounge | Book the IBP Lounge with a date and time range |
| View Bookings | View all upcoming lounge bookings this month |

## Built With

- [Raycast API](https://developers.raycast.com)
- TypeScript + React
- [reserve112.vercel.app](https://reserve112.vercel.app) — booking backend by [@shionkorsak](https://github.com/shionkorsak)

## License

MIT
