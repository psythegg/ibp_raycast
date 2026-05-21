import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";

const API_BASE = "https://reserve112.vercel.app";

interface Booking {
  _id: string;
  name: string;
  email: string;
  id: string;
  date: string;
  time: string[];
  amount: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTimeRange(times: string[]): string {
  if (!times || times.length === 0) return "No time";
  const sorted = [...times].sort();
  return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
}

function getDateStatus(dateStr: string): { tag: string; color: Color } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(dateStr);
  bookingDate.setMinutes(bookingDate.getMinutes() + bookingDate.getTimezoneOffset());
  bookingDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { tag: "Today", color: Color.Red };
  if (diffDays === 1) return { tag: "Tomorrow", color: Color.Orange };
  if (diffDays <= 7) return { tag: "This Week", color: Color.Yellow };
  return { tag: "Upcoming", color: Color.Green };
}

export default function ViewBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/bookings`)
      .then((r) => r.json())
      .then((data: Booking[]) => {
        // Only show future bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = data.filter((b) => {
          const d = new Date(b.date);
          d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
          d.setHours(0, 0, 0, 0);
          return d >= today;
        });
        setBookings(upcoming);
      })
      .catch(() => setError("Failed to load bookings. Check your internet connection."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <List isLoading={isLoading} navigationTitle="Upcoming Bookings">
      {error ? (
        <List.EmptyView icon={Icon.Warning} title="Error" description={error} />
      ) : bookings.length === 0 && !isLoading ? (
        <List.EmptyView icon={Icon.Calendar} title="No Upcoming Bookings" description="The lounge is all yours!" />
      ) : (
        bookings.map((booking) => {
          const status = getDateStatus(booking.date);
          return (
            <List.Item
              key={booking._id}
              icon={Icon.Calendar}
              title={formatDate(booking.date)}
              subtitle={formatTimeRange(booking.time)}
              accessories={[
                { text: `${booking.amount} people`, icon: Icon.Person },
                { tag: { value: status.tag, color: status.color } },
              ]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Booking Details"
                    content={`${formatDate(booking.date)} | ${formatTimeRange(booking.time)} | ${booking.name} | ${booking.amount} people`}
                  />
                </ActionPanel>
              }
              detail={
                <List.Item.Detail
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="Name" text={booking.name} />
                      <List.Item.Detail.Metadata.Label title="Date" text={formatDate(booking.date)} />
                      <List.Item.Detail.Metadata.Label title="Time" text={formatTimeRange(booking.time)} />
                      <List.Item.Detail.Metadata.Label title="People" text={String(booking.amount)} />
                    </List.Item.Detail.Metadata>
                  }
                />
              }
            />
          );
        })
      )}
    </List>
  );
}