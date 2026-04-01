const ALLOWED_UPI_BANKS = new Set(["ybl", "upi", "oksbi", "okhdfc"]);

function onlyDigits(str) {
  return (str || "").toString().replace(/\D/g, "");
}

function luhnCheck(numStr) {
  const digits = onlyDigits(numStr);
  if (digits.length < 12) return false;

  let sum = 0;
  let doubleNext = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (doubleNext) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleNext = !doubleNext;
  }
  return sum % 10 === 0;
}

function parseExpiry(expiry) {
  // Expect MM/YYYY
  if (!expiry) return null;
  const cleaned = expiry.toString().trim();
  const m = cleaned.match(/^(\d{2})\s*\/\s*(\d{4})$/);
  if (!m) return null;
  const mm = parseInt(m[1], 10);
  const yyyy = parseInt(m[2], 10);
  if (mm < 1 || mm > 12) return null;
  if (yyyy < 2000 || yyyy > 2100) return null;
  return { mm, yyyy };
}

function isExpired({ mm, yyyy }) {
  // Expire at end of given month
  const expiryDate = new Date(yyyy, mm, 0, 23, 59, 59, 999);
  return Date.now() > expiryDate.getTime();
}

function validateCard({ cardNumber, expiry, cvv }) {
  const cardDigits = onlyDigits(cardNumber);
  const cvvDigits = onlyDigits(cvv);

  const expiryParsed = parseExpiry(expiry);
  const cvvOk = cvvDigits.length === 3 || cvvDigits.length === 4;
  if (!cardDigits || !expiryParsed || !cvvOk) {
    return { ok: false, status: "INVALID_CARD", reason: "FORMAT_OR_FIELDS_INVALID" };
  }

  if (!luhnCheck(cardDigits)) {
    return { ok: false, status: "INVALID_CARD", reason: "LUHN_FAILED" };
  }

  if (isExpired(expiryParsed)) {
    return { ok: false, status: "INVALID_CARD", reason: "EXPIRED" };
  }

  // Deterministic insufficient-funds rule for testing:
  // If the card number ends with "0000", simulate insufficient funds.
  if (cardDigits.endsWith("0000")) {
    return { ok: false, status: "FAILED", reason: "INSUFFICIENT_FUNDS" };
  }

  return { ok: true, status: "SUCCESS" };
}

function validateUPI({ upiId }) {
  const raw = (upiId || "").toString().trim();
  const m = raw.match(/^(.+)@(.+)$/);
  if (!m) return { ok: false, status: "INVALID_UPI", reason: "MISSING_AT_OR_FORMAT" };

  const localPart = m[1];
  const bankPart = m[2];

  if (!localPart || localPart.length < 2) {
    return { ok: false, status: "INVALID_UPI", reason: "LOCAL_PART_INVALID" };
  }
  const normalizedBank = bankPart.toLowerCase();
  if (!ALLOWED_UPI_BANKS.has(normalizedBank)) {
    return { ok: false, status: "INVALID_UPI", reason: "PROVIDER_NOT_ALLOWED" };
  }

  return { ok: true, status: "SUCCESS" };
}

function simulatePayment({ method, cardNumber, expiry, cvv, upiId }) {
  const normalizedMethod = (method || "").toString().toUpperCase();

  if (normalizedMethod === "CREDIT" || normalizedMethod === "DEBIT") {
    return validateCard({ cardNumber, expiry, cvv });
  }
  if (normalizedMethod === "UPI") {
    return validateUPI({ upiId });
  }

  return { ok: false, status: "INVALID_METHOD", reason: "UNKNOWN_METHOD" };
}

module.exports = {
  simulatePayment,
  validateCard,
  validateUPI,
};

