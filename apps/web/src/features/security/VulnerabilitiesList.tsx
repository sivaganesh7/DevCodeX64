import { useEffect, useState } from 'react';

export function VulnerabilitiesList({ owner, repo }: { owner: string; repo: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/repositories/${owner}/${repo}/security/vulnerabilities`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setVulnerabilities(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <div>Loading vulnerabilities...</div>;
  if (!vulnerabilities.length) return <div>No vulnerabilities found!</div>;

  return (
    <div>
      <h3>Vulnerabilities</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {vulnerabilities.map(vuln => (
          <li key={vuln.id} style={{ padding: '10px', marginBottom: '10px', border: '1px solid #ffcccc', borderRadius: '4px', backgroundColor: '#fff5f5' }}>
            <div style={{ fontWeight: 'bold' }}>
              <span style={{ color: 'red' }}>[{vuln.severity}]</span> {vuln.identifier} in {vuln.dependency?.name}
            </div>
            <p>{vuln.description}</p>
            {vuln.recommendation && <p><strong>Recommendation:</strong> {vuln.recommendation}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
