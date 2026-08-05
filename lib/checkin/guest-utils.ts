// Edad cumplida en referenceDate (normalmente la fecha de check-in), no en hoy —
// determina si la firma es obligatoria según el RD 933/2021 Art. 4.2 (>14 años).
export function calculateAge(birthDate: string, referenceDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00')
  const ref = new Date(referenceDate + 'T00:00:00')
  let age = ref.getFullYear() - birth.getFullYear()
  const monthDiff = ref.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--
  }
  return age
}
