import { useEffect, useState } from 'react';

export function SecretsList({ owner, repo }: { owner: string; repo: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [secrets, setSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/repositories/${owner}/${repo}/security/secrets`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setSecrets(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <div>Loading secrets...</div>;
  if (!secrets.length) return <div>No secrets found! 🎉</div>;

  return (
    <div>
      <h3>Detected Secrets</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th>Type</th>
            <th>Value (Redacted)</th>
            <th>File</th>
            <th>Line</th>
          </tr>
        </thead>
        <tbody>
          {secrets.map(secret => (
            <tr key={secret.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{secret.secretType}</td>
              <td style={{ fontFamily: 'monospace', color: '#d32f2f' }}>{secret.redactedValue}</td>
              <td>{secret.filePath}</td>
              <td>{secret.lineNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
