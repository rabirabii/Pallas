export function formatRM(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not stated";
  }

  return `RM ${new Intl.NumberFormat("en-MY", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function formatRMCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not stated";
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSqft(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not stated";
  }

  return `${new Intl.NumberFormat("en-MY", {
    maximumFractionDigits: 0,
  }).format(value)} sqft`;
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not stated";
  }

  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not stated";
  }

  return new Intl.NumberFormat("en-MY").format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not stated";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not stated";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not stated";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not stated";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  }).format(date);
}

export function formatNullableText(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return "Not stated";
  }

  return value;
}
