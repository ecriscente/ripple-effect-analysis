import { useUsageStats } from '../hooks/useUsageStats';
import { useBetaStatus } from '../hooks/useBetaStatus';
import './BetaUsageCard.css';

const BetaUsageCard = () => {
  const { usageStats, isLoading: usageLoading } = useUsageStats();
  const { betaStatus, isLoading: betaLoading } = useBetaStatus();
  
  const isLoading = usageLoading || betaLoading;

  if (isLoading) {
    return (
      <div className="beta-usage-card loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Don't show the card if user is not authenticated, not in beta, or limits are disabled
  if (!localStorage.getItem('token') || !betaStatus?.is_beta || !usageStats || usageStats.limits_disabled) {
    return null;
  }

  const getUsagePercentage = (used: number, limit: number) => 
    Math.min(100, (used / limit) * 100);

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'beta_free':
        return 'Beta User';
      case 'beta_verified':
        return 'Beta Verified';
      default:
        return tier.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="beta-usage-card">
      <div className="usage-header">
        <h3>
          <span className="beta-badge">BETA</span>
          {getTierDisplayName(usageStats.user_tier)}
        </h3>
        {betaStatus.beta_end_date && (
          <p className="beta-end-date">
            Beta ends: {new Date(betaStatus.beta_end_date).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="usage-stats">
        <div className="usage-item">
          <div className="usage-label">
            <span>Monthly Usage</span>
            <span className="usage-count">
              {usageStats.usage.monthly.used} / {usageStats.usage.monthly.limit}
            </span>
          </div>
          <div className="usage-bar">
            <div 
              className="usage-fill"
              style={{ 
                width: `${getUsagePercentage(usageStats.usage.monthly.used, usageStats.usage.monthly.limit)}%`,
                backgroundColor: usageStats.usage.monthly.remaining > 5 ? '#4a90e2' : '#e74c3c'
              }}
            ></div>
          </div>
        </div>

        <div className="usage-item">
          <div className="usage-label">
            <span>Daily Usage</span>
            <span className="usage-count">
              {usageStats.usage.daily.used} / {usageStats.usage.daily.limit}
            </span>
          </div>
          <div className="usage-bar">
            <div 
              className="usage-fill"
              style={{ 
                width: `${getUsagePercentage(usageStats.usage.daily.used, usageStats.usage.daily.limit)}%`,
                backgroundColor: usageStats.usage.daily.remaining > 2 ? '#4a90e2' : '#e74c3c'
              }}
            ></div>
          </div>
        </div>

        {usageStats.usage.monthly.remaining === 0 && (
          <div className="usage-message warning">
            Monthly limit reached! Resets next month.
          </div>
        )}

        {usageStats.usage.daily.remaining === 0 && usageStats.usage.monthly.remaining > 0 && (
          <div className="usage-message info">
            Daily limit reached! Resets tomorrow.
          </div>
        )}

        {usageStats.usage.monthly.remaining > 0 && usageStats.usage.daily.remaining > 0 && (
          <div className="usage-message success">
            You have {usageStats.usage.daily.remaining} analyses remaining today!
          </div>
        )}
      </div>

      {usageStats.user_tier === 'beta_free' && (
        <div className="upgrade-hint">
          💡 Verify your email for higher limits!
        </div>
      )}
    </div>
  );
};

export default BetaUsageCard;