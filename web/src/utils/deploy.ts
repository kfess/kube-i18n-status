const formatDeployDate = (timestamp: number): string => {
  if (timestamp === 0) {
    return '';
  }

  return new Date(timestamp * 1000).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
};

export const getDeploymentInfo = () => {
  const rawTimestamp = parseInt(import.meta.env.VITE_DEPLOY_TIMESTAMP || '0', 10);

  return {
    deployedAt: formatDeployDate(rawTimestamp),
    gitCommit: (import.meta.env.VITE_GIT_SHA || 'unknown').slice(0, 7),
  };
};
