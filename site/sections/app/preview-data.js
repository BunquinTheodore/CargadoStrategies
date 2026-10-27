/**
 * Sample data for the local dashboard preview (preview.js). Clearly fake: "Sample"
 * names, example.com emails and amounts made up for the layout only. Dates are
 * relative to `now`, so the preview always has upcoming and past bookings.
 * Loaded only by preview.js on localhost with ?preview=1.
 */
const DAY_MS = 86400000;
const at = (now, days, hour = 20) => {
  const d = new Date(now.getTime() + days * DAY_MS);
  d.setUTCHours(hour, 30, 0, 0);
  return d.toISOString();
};

function client(now) {
  return {
    user: { uid: 'samplecl1ent', name: 'Sample Client', email: 'sample.client@example.com', role: 'client', profile: { phone: '' } },
    points: [
      { id: 'p1', points: 5, kind: 'booking', at: at(now, -120) },
      { id: 'p2', points: 5, kind: 'referral', at: at(now, -84) },
      { id: 'p3', points: 5, kind: 'service', at: at(now, -51) },
      { id: 'p4', points: 5, kind: 'booking', at: at(now, -30) },
      { id: 'p5', points: -2, kind: 'adjustment', reason: 'Sample adjustment', at: at(now, -20) },
      { id: 'p6', points: 5, kind: 'referral', at: at(now, -6) },
    ],
    bookings: [
      { id: 'b1', start: at(now, 3), status: 'confirmed', service: 'Sample Service', meetUrl: 'https://meet.google.com/' },
      { id: 'b2', start: at(now, 17), status: 'pending', service: 'Sample Service' },
      { id: 'b3', start: at(now, -30), status: 'completed', service: 'Sample Service' },
      { id: 'b4', start: at(now, -120), status: 'completed', service: 'Sample Service' },
      { id: 'b5', start: at(now, -60), status: 'cancelled', service: 'Sample Service' },
    ],
  };
}

function partner(now) {
  return {
    user: { uid: 'samplepartner', name: 'Sample Partner', email: 'sample.partner@example.com', role: 'partner' },
    stored: { status: 'approved', business: 'Sample Partner Business', contact: 'Sample Partner', pendingProfile: { business: 'Sample Partner Business', name: 'Sample Partner', serviceArea: 'Sample City' } },
    referrals: [
      { id: 'r1', clientName: 'Sample Client A', note: 'Sample note', status: 'assigned', at: at(now, -70) },
      { id: 'r2', clientName: 'Sample Client B', status: 'assigned', at: at(now, -35) },
      { id: 'r3', clientName: 'Sample Client C', note: 'Sample note', status: 'assigned', at: at(now, -9) },
    ],
  };
}

function admin(now) {
  const users = [
    { id: 'u1', name: 'Sample Client A', email: 'client.a@example.com', role: 'client', points: 18, referralCode: 'SAMPLEA1' },
    { id: 'u2', name: 'Sample Client B', email: 'client.b@example.com', role: 'client', points: 5, referralCode: 'SAMPLEB2' },
    { id: 'u3', name: 'Sample Client C', email: 'client.c@example.com', points: 0, referralCode: 'SAMPLEC3' },
    { id: 'u4', name: 'Sample Partner', email: 'partner@example.com', role: 'partner', points: 0 },
    { id: 'u5', name: 'Sample Owner', email: 'owner@example.com', role: 'admin', points: 0 },
  ];
  return {
    user: { uid: 'sampleadmin', name: 'Sample Owner', email: 'owner@example.com', role: 'admin' },
    lists: {
      applications: [
        { id: 'a1', business: 'Sample Law Office', contact: 'Sample Contact', email: 'apply.a@example.com', createdAt: at(now, -2) },
        { id: 'a2', business: 'Sample Mortgage Desk', contact: 'Sample Contact', email: 'apply.b@example.com', createdAt: at(now, -5) },
        { id: 'a3', business: 'Sample Tax Studio', email: 'apply.c@example.com', status: 'approved', createdAt: at(now, -40) },
      ],
      bookings: [
        { id: 'b1', start: at(now, 4), status: 'confirmed', name: 'Sample Client A', email: 'client.a@example.com', service: 'Sample Service' },
        { id: 'b2', start: at(now, 9), status: 'pending', name: 'Sample Client B', email: 'client.b@example.com', service: 'Sample Service' },
        { id: 'b3', start: at(now, -12), status: 'completed', name: 'Sample Client C', email: 'client.c@example.com', service: 'Sample Service' },
      ],
      users,
    },
  };
}

const SAMPLES = Object.freeze({ client, partner, admin });

export const sampleFor = (role, now = new Date()) => (SAMPLES[role] || client)(now);
