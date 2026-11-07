/* DevSpire Nexus: Resource Status Indicators (Requirement 6)
   Separately evaluates and renders "Newly Added" (creation/expansion batch) and
   "Recently Verified" (verified status with genuine verification timestamp) badges. */
(() => {
  'use strict';

  // In the DevSpire Nexus dataset, the 2026-11-04 batch represents newly added resources,
  // while status === 'verified' with valid timestamp indicates verified information.
  function isNewlyAdded(record) {
    if (!record) return false;
    if (record.is_new === true) return true;
    return record.verified === '2026-11-04';
  }

  function isRecentlyVerified(record) {
    if (!record) return false;
    return record.status === 'verified' && Boolean(record.verified);
  }

  function newBadgeHTML() {
    return `<span class="badge-new" title="Newly added to DevSpire Nexus"><span class="material-symbols-outlined text-[13px]" aria-hidden="true">sparkles</span>NEW</span>`;
  }

  function verifiedBadgeHTML() {
    return `<span class="badge-verified" title="Recently verified resource information"><span class="material-symbols-outlined text-[13px]" aria-hidden="true">verified</span>VERIFIED</span>`;
  }

  function statusBadgesHTML(record) {
    const badges = [];
    if (isNewlyAdded(record)) {
      badges.push(newBadgeHTML());
    }
    if (isRecentlyVerified(record)) {
      badges.push(verifiedBadgeHTML());
    }
    return badges.join(' ');
  }

  window.ResourceStatus = {
    isNewlyAdded,
    isRecentlyVerified,
    newBadgeHTML,
    verifiedBadgeHTML,
    statusBadgesHTML
  };
})();
