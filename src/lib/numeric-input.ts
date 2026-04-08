export type NumericInputMode = "integer" | "decimal";

// ─── Money display formatting ─────────────────────────────────────────────────
// State always stores raw digit strings (e.g. "20000").
// These helpers only affect what the <input value> shows (e.g. "20.000" for CLP).

function getThousandSep(currencyCode: string): string {
  return currencyCode === "USD" ? "," : "."; // CLP → dot, USD → comma
}

/**
 * Format raw digit string for money display.
 * "20000" + "CLP" → "20.000"
 * "20000" + "USD" → "20,000"
 */
export function formatMoneyInput(rawDigits: string, currencyCode: string = "CLP"): string {
  if (!rawDigits || rawDigits === "") return "";
  const sep = getThousandSep(currencyCode);
  return rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/**
 * Strip thousand separators from a formatted display value to recover raw digits.
 * "20.000" + "CLP" → "20000"
 * "20,000" + "USD" → "20000"
 */
export function stripMoneyFormat(formattedValue: string, currencyCode: string = "CLP"): string {
  const sep = getThousandSep(currencyCode);
  return formattedValue.split(sep).join("");
}

export function sanitizeNumericInput(value: string, mode: NumericInputMode = "integer"): string {
  const compactValue = value.replace(/\s+/g, "").replace("$", "");

  if (mode === "integer") {
    const digitsOnly = compactValue.replace(/\D/g, "");

    if (digitsOnly === "") {
      return "";
    }

    return digitsOnly.replace(/^0+(?=\d)/, "");
  }

  const normalizedSeparators = compactValue.replace(/,/g, ".");
  let sanitized = "";
  let hasDecimalSeparator = false;

  for (const character of normalizedSeparators) {
    if (/\d/.test(character)) {
      sanitized += character;
      continue;
    }

    if (character === "." && !hasDecimalSeparator) {
      sanitized += sanitized === "" ? "0." : ".";
      hasDecimalSeparator = true;
    }
  }

  if (sanitized === "") {
    return "";
  }

  if (!sanitized.includes(".")) {
    return sanitized.replace(/^0+(?=\d)/, "");
  }

  const [integerPart, decimalPart = ""] = sanitized.split(".");
  const normalizedInteger = (integerPart || "0").replace(/^0+(?=\d)/, "");

  return `${normalizedInteger}.${decimalPart}`;
}

export function normalizeNumericBlurValue(value: string, mode: NumericInputMode = "integer"): string {
  const sanitized = sanitizeNumericInput(value, mode);

  if (sanitized === "" || sanitized === ".") {
    return "0";
  }

  if (mode === "decimal" && sanitized.endsWith(".")) {
    return sanitized.slice(0, -1) || "0";
  }

  return sanitized;
}

export function parseNumericInput(value: string): number {
  return Number.parseFloat(value.replace(/,/g, ".")) || 0;
}

export function getNumericInputWidth(value: string, minChars = 3): string {
  return `${Math.max(value.length || 1, minChars)}ch`;
}
