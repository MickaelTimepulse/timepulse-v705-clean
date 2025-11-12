export function formatAthleteName(firstName: string, lastName: string): string {
  const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const formattedLastName = lastName.toUpperCase();
  return `${formattedFirstName} ${formattedLastName}`;
}
