import { useEffect, useState } from 'react';

export function SecurityOverview({ owner, repo }: { owner: string; repo: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/repositories/${owner}/${repo}/security/summary`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load security summary');
        return res.json();
      })
      .then(data => setSummary(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <div>Loading security overview...</div>;
  if (error) return <div>No security scan available yet. {error}</div>;
  if (!summary) return <div>No security data found.</div>;

  return (
    <div className="security-overview">
      <h3>Security Risk Score: {summary.riskScore}/100</h3>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h4>Vulnerabilities</h4>
          <ul>
            <li>Critical: <span style={{color:'red'}}>{summary.vulnerabilityCounts.CRITICAL || 0}</span></li>
            <li>High: <span style={{color:'orange'}}>{summary.vulnerabilityCounts.HIGH || 0}</span></li>
            <li>Medium: <span style={{color:'goldenrod'}}>{summary.vulnerabilityCounts.MEDIUM || 0}</span></li>
          </ul>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h4>Code Findings</h4>
          <ul>
            <li>Critical: <span style={{color:'red'}}>{summary.findingCounts.CRITICAL || 0}</span></li>
            <li>High: <span style={{color:'orange'}}>{summary.findingCounts.HIGH || 0}</span></li>
          </ul>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h4>Secrets Detected</h4>
          <p style={{fontSize: '24px', fontWeight: 'bold'}}>{summary.secretsCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
