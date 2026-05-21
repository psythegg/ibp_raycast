import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
  popToRoot,
  openExtensionPreferences,
} from "@raycast/api";
import { useState, useEffect } from "react";

const API_BASE = "https://reserve112.vercel.app";

interface Preferences {
  name: string;
  email: string;
  studentId: string;
}

interface Booking {
  date: string;
  time: string[];
}

function generateTimeSlots(): string[] {
  const times: string[] = [];
  let start = 8;
  const end = 22;
  while (start <= end) {
    const hour = start < 10 ? `0${start}:00` : `${start}:00`;
    const half = start < 10 ? `0${start}:30` : `${start}:30`;
    if (start === 22) {
      times.push(hour);
    } else {
      times.push(hour, half);
    }
    start++;
  }
  return times;
}

const ALL_SLOTS = generateTimeSlots();

function getSlotsInRange(start: string, end: string): string[] {
  const startIdx = ALL_SLOTS.indexOf(start);
  const endIdx = ALL_SLOTS.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return [];
  return ALL_SLOTS.slice(startIdx, endIdx + 1);
}

export default function BookLounge() {
  const preferences = getPreferenceValues<Preferences>();

  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!preferences.name || !preferences.email || !preferences.studentId) {
      showToast({
        style: Toast.Style.Failure,
        title: "Please set your preferences first",
        primaryAction: {
          title: "Open Preferences",
          onAction: openExtensionPreferences,
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    const dateStr = date.toISOString().split("T")[0];
    fetch(`${API_BASE}/api/bookings`)
      .then((r) => r.json())
      .then((bookings: Booking[]) => {
        const dayBookings = bookings.filter((b) => {
          const d = new Date(b.date);
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            return d.toISOString().split("T")[0] === dateStr;
            });
        const slots: string[] = [];
        dayBookings.forEach((b) => slots.push(...b.time));
        setBookedSlots(slots);
        setStartTime("");
        setEndTime("");
      })
      .catch(() => setBookedSlots([]));
  }, [date]);

  // Available start times — exclude fully booked middle slots
    const availableStartTimes = ALL_SLOTS.filter((s, idx) => {
      // Can't start at last slot
      if (idx >= ALL_SLOTS.length - 1) return false;
      // Can't start on a booked slot
      if (bookedSlots.includes(s)) return false;
      return true;
    });

  // Available end times — must be after start, max 9 slots, no booked middle slots in between
  const availableEndTimes = (() => {
    if (!startTime) return [];
    const startIdx = ALL_SLOTS.indexOf(startTime);
    const maxIdx = Math.min(startIdx + 9, ALL_SLOTS.length - 1);
    const result: string[] = [];
    for (let i = startIdx + 1; i <= maxIdx; i++) {
      const slot = ALL_SLOTS[i];
      // Check if any slot strictly between start and this slot is booked (middle block)
      const range = ALL_SLOTS.slice(startIdx + 1, i);
      const hasBlockedMiddle = range.some((s) => bookedSlots.includes(s));
      if (hasBlockedMiddle) break;
      result.push(slot);
    }
    return result;
  })();

  const selectedSlots = startTime && endTime ? getSlotsInRange(startTime, endTime) : [];

  async function handleSubmit() {
    if (!date) {
      await showToast({ style: Toast.Style.Failure, title: "Please select a date" });
      return;
    }

    const dateStr = date.toISOString().split("T")[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date < tomorrow) {
      await showToast({ style: Toast.Style.Failure, title: "Same-day bookings are not allowed" });
      return;
    }

    if (!startTime || !endTime) {
      await showToast({ style: Toast.Style.Failure, title: "Please select start and end time" });
      return;
    }

    if (selectedSlots.length < 3) {
      await showToast({ style: Toast.Style.Failure, title: "Please select at least 1 hour" });
      return;
    }

    if (selectedSlots.length > 8) {
      await showToast({ style: Toast.Style.Failure, title: "Maximum 4 hours allowed" });
      return;
    }

    const amountNum = parseInt(amount);
    if (!amount || amountNum < 7 || amountNum > 30) {
      await showToast({ style: Toast.Style.Failure, title: "Number of people must be between 7 and 30" });
      return;
    }

    setIsLoading(true);

    try {
      const checkRes = await fetch(
        `${API_BASE}/api/check-bookings?date=${dateStr}&id=${preferences.studentId}`
      );
      const checkData = await checkRes.json();

      if (checkData.totalBookings >= 2) {
        await showToast({ style: Toast.Style.Failure, title: "No more bookings allowed for this date" });
        return;
      }
      if (checkData.userDailyBookings >= 1) {
        await showToast({ style: Toast.Style.Failure, title: "You already have a booking on this day" });
        return;
      }
      if (checkData.userWeeklyBookings >= 2) {
        await showToast({ style: Toast.Style.Failure, title: "You have reached the weekly booking limit" });
        return;
      }

      const res = await fetch(`${API_BASE}/api/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preferences.name,
          email: preferences.email,
          id: preferences.studentId,
          date: dateStr,
          time: selectedSlots.sort(),
          amount: amountNum,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await showToast({ style: Toast.Style.Success, title: "Booking Successful! 🎉" });
        popToRoot();
      } else {
        await showToast({ style: Toast.Style.Failure, title: data.message });
      }
    } catch {
      await showToast({ style: Toast.Style.Failure, title: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Book Lounge" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="IBP Lounge Booking"
        text={`Booking as: ${preferences.name || "?"} (${preferences.studentId || "?"})`}
      />
      <Form.DatePicker
        id="date"
        title="Date"
        type={Form.DatePicker.Type.Date}
        value={date}
        onChange={setDate}
      />
      <Form.Dropdown
        id="startTime"
        title="Start Time"
        value={startTime}
        onChange={(val) => {
          setStartTime(val);
          setEndTime("");
        }}
      >
        <Form.Dropdown.Item value="" title="Select start time" />
        {availableStartTimes.map((slot) => (
          <Form.Dropdown.Item
            key={slot}
            value={slot}
            title={bookedSlots.includes(slot) ? `${slot} (booked)` : slot}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        id="endTime"
        title="End Time"
        value={endTime}
        onChange={setEndTime}
      >
        <Form.Dropdown.Item value="" title={startTime ? "Select end time" : "Select start time first"} />
        {availableEndTimes.map((slot) => (
          <Form.Dropdown.Item key={slot} value={slot} title={slot} />
        ))}
      </Form.Dropdown>
      {selectedSlots.length > 0 && (
        <Form.Description
          title="Selected Slots"
          text={`${startTime} – ${endTime} (${((selectedSlots.length - 1) * 0.5).toFixed(1)} hrs)`}
        />
      )}
      <Form.TextField
        id="amount"
        title="Number of People"
        placeholder="Between 7 and 30"
        value={amount}
        onChange={setAmount}
      />
    </Form>
  );
}