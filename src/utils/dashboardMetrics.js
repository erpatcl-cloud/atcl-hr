export function bangladeshDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function attendanceSummary(employees, logs, date) {
  const activeCodes = new Set(employees.filter(e => e.status === 'Active').map(e => e.employeeCode));
  const today = logs.filter(log => log.date === date && activeCodes.has(log.employeeCode));
  const present = today.filter(log => log.status === 'Present');
  const uniqueCount = records => new Set(records.map(log => log.employeeCode)).size;
  const presentCount = uniqueCount(present);
  return {
    presentCount,
    absentCount: activeCodes.size - presentCount,
    lateCount: uniqueCount(present.filter(log => log.isLate)),
    overtimeCount: uniqueCount(present.filter(log => Number(log.overtimeHours) > 0)),
  };
}
