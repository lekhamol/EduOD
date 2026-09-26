/**
 * Smart Approval Priority Helper
 * Calculates OD request priority based on days until event start.
 *
 * RULES:
 *  - EXPIRED : event start_date < today (already passed)
 *  - HIGH    : 0–2 days until event start
 *  - MEDIUM  : 3–5 days until event start
 *  - NORMAL  : more than 5 days until event start
 */

/**
 * @param {string|Date} startDate  – The event start date from the DB row
 * @returns {{ priority: 'HIGH'|'MEDIUM'|'NORMAL'|'EXPIRED', daysRemaining: number }}
 */
export function calculatePriority(startDate) {
  const today = new Date();
  // Normalise to midnight so we compare calendar days only
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(startDate);
  eventDate.setHours(0, 0, 0, 0);

  const diffMs = eventDate - today;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let priority;
  if (daysRemaining < 0) {
    priority = 'EXPIRED';
  } else if (daysRemaining <= 2) {
    priority = 'HIGH';
  } else if (daysRemaining <= 5) {
    priority = 'MEDIUM';
  } else {
    priority = 'NORMAL';
  }

  return { priority, daysRemaining };
}

/**
 * Sorting weight: HIGH → MEDIUM → NORMAL → EXPIRED
 */
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, NORMAL: 2, EXPIRED: 3 };

/**
 * Sort an array of OD request objects by priority (highest urgency first).
 * @param {Array} requests
 * @returns {Array}
 */
export function sortByPriority(requests) {
  return [...requests].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
  );
}

/**
 * Attach computed priority & daysRemaining to every request object.
 * Mutates each item in-place AND updates it in the DB via the provided query fn.
 *
 * @param {Array}    requests  – Array of od_request DB rows
 * @param {Function} queryFn  – The DB query helper (optional – pass null to skip DB update)
 * @returns {Array}  Enriched & sorted requests
 */
export async function enrichWithPriority(requests, queryFn = null) {
  const enriched = requests.map((req) => {
    const { priority, daysRemaining } = calculatePriority(req.start_date);
    return { ...req, priority, daysRemaining };
  });

  // Persist recalculated priorities back to DB asynchronously (best-effort)
  if (queryFn) {
    const updates = enriched.map((req) =>
      queryFn('UPDATE od_requests SET priority = ? WHERE id = ?', [req.priority, req.id]).catch(
        () => {}  // ignore individual update failures – non-critical
      )
    );
    await Promise.all(updates);
  }

  return sortByPriority(enriched);
}
