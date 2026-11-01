// Shift times (24-hour clock). Keep in step with SHIFTS in the staff frontend's OperatorReport.jsx.
module.exports = {
  WHOLE_DAY: { label: "Whole day", from: 0, to: 24 },
  MORNING: { label: "Morning shift (before 1 pm)", from: 0, to: 13 },
  AFTERNOON: { label: "Afternoon shift (from 1 pm)", from: 13, to: 24 },
};
