export function phoneHref(phone) {
  const value = String(phone || "").trim();
  return value ? `tel:${value.replace(/[^\d+]/g, "")}` : "";
}

export function whatsappHref(number) {
  let digits = String(number || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `961${digits.slice(1)}`;
  if (digits && !digits.startsWith("961")) digits = `961${digits}`;
  return digits ? `https://wa.me/${digits}` : "";
}

export function mapsHref(address, townName = "") {
  const query = [address, townName, "Lebanon"].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}
