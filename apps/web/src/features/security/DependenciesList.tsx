import { useEffect, useState } from 'react';

export function DependenciesList({ owner, repo }: { owner: string; repo: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/repositories/${owner}/${repo}/security/dependencies`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setDependencies(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <div>Loading dependencies...</div>;
  if (!dependencies.length) return <div>No dependencies found.</div>;

  return (
    <div>
      <h3>Dependencies</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th>Name</th>
            <th>Version</th>
            <th>Ecosystem</th>
            <th>Vulnerabilities</th>
          </tr>
        </thead>
        <tbody>
          {dependencies.map(dep => (
            <tr key={dep.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{dep.name}</td>
              <td>{dep.version}</td>
              <td>{dep.ecosystem}</td>
              <td>{dep.vulnerabilities?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
