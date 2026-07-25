import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

export const advanceOnce = (subscription, from) => {
  const tz = subscription.timezone || "UTC";
  const base = dayjs(from).tz(tz);
  const [hour, minute] = (subscription.pickupTime || "09:00")
    .split(":")
    .map(Number);

  if (subscription.frequency === "weekly") {
    let next = base.hour(hour).minute(minute).second(0).millisecond(0);
    const currentDow = next.day();
    const targetDow = subscription.dayOfWeek;
    let daysAhead = targetDow - currentDow;
    if (daysAhead <= 0) daysAhead += 7;
    next = next.add(daysAhead, "day");
    return next.toDate();
  }

  if (subscription.frequency === "monthly") {
    let next = base.hour(hour).minute(minute).second(0).millisecond(0);
    let nextMonth = next.add(1, "month");
    let targetDay = subscription.dayOfMonth;
    const daysInMonth = nextMonth.daysInMonth();
    if (targetDay > daysInMonth) targetDay = daysInMonth;
    nextMonth = nextMonth.date(targetDay);
    return nextMonth.toDate();
  }

  return base.add(7, "day").toDate();
};

export const computeNextRunAt = (subscription, from) => {
  const baseFrom = from || subscription.nextRunAt;
  let next = advanceOnce(subscription, baseFrom);
  const now = new Date();
  let safety = 0;
  while (dayjs(next).isBefore(dayjs(now)) && safety < 100) {
    next = advanceOnce(subscription, next);
    safety++;
  }
  return next;
};

export const computeInitialNextRunAt = (subscription) => {
  const tz = subscription.timezone || "UTC";
  const now = dayjs().tz(tz);
  const [hour, minute] = (subscription.pickupTime || "09:00")
    .split(":")
    .map(Number);

  if (subscription.frequency === "weekly") {
    let next = now.hour(hour).minute(minute).second(0).millisecond(0);
    const targetDow = subscription.dayOfWeek;
    let daysAhead = targetDow - next.day();
    if (daysAhead < 0) daysAhead += 7;
    if (daysAhead === 0 && next.isAfter(now)) {
    } else if (daysAhead === 0) {
      daysAhead = 7;
    }
    next = next.add(daysAhead, "day");
    return next.toDate();
  }

  if (subscription.frequency === "monthly") {
    let targetDay = subscription.dayOfMonth;
    let candidate = now.date(targetDay).hour(hour).minute(minute).second(0).millisecond(0);
    if (candidate.isAfter(now)) {
      return candidate.toDate();
    }
    let nextMonth = now.add(1, "month");
    const daysInMonth = nextMonth.daysInMonth();
    if (targetDay > daysInMonth) targetDay = daysInMonth;
    nextMonth = nextMonth.date(targetDay).hour(hour).minute(minute).second(0).millisecond(0);
    return nextMonth.toDate();
  }

  return now.add(7, "day").hour(hour).minute(minute).second(0).millisecond(0).toDate();
};

export const formatInTimezone = (date, tz) => {
  return dayjs(date).tz(tz || "UTC").format("YYYY-MM-DD HH:mm z");
};

export const getDayName = (dayOfWeek) => {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[dayOfWeek] || "";
};
