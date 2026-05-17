const { create } = require('zustand');
const socialMediaService = require('../services/socialMediaService');

async function getAccounts(set, get) {
  set({ isLoading: true, error: null });
  try {
    const res = await socialMediaService.getAccounts();
    const raw = res?.data || [];
    const mapped = raw.map((ch) => ({
      id:             ch.id ?? ch._id,
      platform:       ch.platform,
      accountName:    ch.accountName,
      username:       ch.accountUsername,
      profilePicture: ch.profilePicture,
      status:         ch.status,
      platformData:   ch.platformData,
      isSimulated:    ch.platformData?.isSimulated   ?? false,
      // ── ADD THESE THREE ──
      followers:      ch.platformData?.followers     ??
                      ch.platformData?.followerCount ?? null,
      engagement:     ch.platformData?.engagement    ?? null,
      // ─────────────────────
      lastSyncAt:     ch.lastSyncAt,
      createdAt:      ch.createdAt,
    }));
    set({ accounts: mapped, isLoading: false });
  } catch (err) {
    set({ error: err?.message || 'Failed to load channels', isLoading: false });
  }
}

async function disconnectAccount(set, get, channelId) {
  set({ isLoading: true });
  try {
    await socialMediaService.disconnectAccount(channelId);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== channelId),
      isLoading: false,
    }));
    return { success: true };
  } catch (err) {
    set({ isLoading: false });
    return { success: false, error: err?.message || 'Failed to disconnect' };
  }
}

async function getStats(set, get, channelId) {
  try {
    const res = await socialMediaService.getStats(channelId);
    const data = res?.data;
    if (data) {
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === channelId
            ? {
                ...a,
                engagement:
                  data.total_impressions ?? data.total_reach ?? a.engagement,
                followers: a.followers,
              }
            : a
        ),
      }));
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err?.message };
  }
}

module.exports = create((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,
  getAccounts: (...args) => getAccounts(set, get, ...args),
  disconnectAccount: (...args) => disconnectAccount(set, get, ...args),
  getStats: (...args) => getStats(set, get, ...args),
}));
