const GRACE_MINUTES = 15;

function timeToMinutes(t) {
  if (!t) return null;
  const s = String(t);
  const part = s.length >= 5 ? s.slice(0, 5) : s;
  const [h, m] = part.split(':').map(Number);
  return h * 60 + m;
}

function compareRosterAttendance(roster, attendance) {
  if (!roster && attendance) {
    return {
      mismatch: true,
      mismatch_type: 'NO_ROSTER',
      message: 'Attendance recorded but no roster entry',
    };
  }
  if (!roster) {
    return { mismatch: false, mismatch_type: null, message: null };
  }

  const planned = roster.status;
  const attStatus = attendance?.status;
  const punchIn = timeToMinutes(attendance?.punch_in);
  const punchOut = timeToMinutes(attendance?.punch_out);
  const mandStart = timeToMinutes(roster.mandatory_start || roster.shift_start);
  const mandEnd = timeToMinutes(roster.mandatory_end || roster.shift_end);

  if (planned === 'W') {
    if (!attendance || attStatus === 'ABSENT') {
      return {
        mismatch: true,
        mismatch_type: 'ABSENT',
        message: 'Scheduled to work but marked absent / no punch',
      };
    }
    if (attStatus === 'ON_LEAVE') {
      return {
        mismatch: true,
        mismatch_type: 'UNEXPECTED_LEAVE',
        message: 'Scheduled to work but on leave',
      };
    }
    if (punchIn != null && mandStart != null && punchIn > mandStart + GRACE_MINUTES) {
      return {
        mismatch: true,
        mismatch_type: 'LATE',
        message: `Late punch-in (after ${roster.mandatory_start || roster.shift_start})`,
      };
    }
    if (punchOut != null && mandEnd != null && punchOut < mandEnd) {
      return {
        mismatch: true,
        mismatch_type: 'EARLY_LEAVE',
        message: `Early punch-out (before ${roster.mandatory_end || roster.shift_end})`,
      };
    }
    if (attStatus === 'PRESENT' && punchIn != null && punchOut == null) {
      return {
        mismatch: true,
        mismatch_type: 'NO_PUNCH_OUT',
        message: 'Punched in but no punch-out recorded',
      };
    }
  }

  if ((planned === 'WO' || planned === 'H') && attendance) {
    if (attStatus === 'PRESENT' || punchIn != null) {
      return {
        mismatch: true,
        mismatch_type: planned === 'H' ? 'HOLIDAY_WORK' : 'UNEXPECTED_PRESENT',
        message: planned === 'H'
          ? 'Worked on a company holiday'
          : 'Present on scheduled weekly off',
      };
    }
  }

  return { mismatch: false, mismatch_type: null, message: null };
}

module.exports = { compareRosterAttendance, timeToMinutes, GRACE_MINUTES };
