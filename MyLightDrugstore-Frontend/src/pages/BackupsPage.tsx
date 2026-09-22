import { useState, useEffect } from 'react';
import { mockApi } from '../shared/api/client';
import type { BackupJob } from '../shared/api/types';
import { MockApiError } from '../shared/api/types';
import { PageHeader, Button, Card, Badge, Table, Th, Td, Tr, ConfirmDialog, showToast, formatDateTime } from '../shared/ui';
import { useSession } from '../shared/SessionContext';

function jobBadge(state: BackupJob['state']) {
  if (state === 'completed') return <Badge variant="green">Completed</Badge>;
  if (state === 'failed') return <Badge variant="red">Failed</Badge>;
  if (state === 'running') return <Badge variant="teal">Running</Badge>;
  return <Badge variant="amber">Queued</Badge>;
}

export default function BackupsPage() {
  const { user } = useSession();
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);

  const load = async () => {
    try {
      setJobs(await mockApi.listBackups());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => { void load(); }, 3000);
    return () => clearInterval(id);
  }, []);

  const handleRequest = async () => {
    setReqLoading(true);
    try {
      const job = await mockApi.requestBackup();
      showToast(`Backup job ${job.id} queued.`);
      setConfirmOpen(false);
      await load();
    } catch (e) {
      if (e instanceof MockApiError) showToast(e.apiError.message, 'error');
    } finally {
      setReqLoading(false);
    }
  };

  const handleDownload = (job: BackupJob) => {
    if (job.state !== 'completed') return;
    const content = `# MyLight Drugstore — Mock Backup Artifact\n# Job ID: ${job.id}\n# Completed: ${job.completedAt}\n# Requested by: ${job.requestedByName}\n# \n# This is a placeholder artifact. No real database content is included.\n# In production, this would contain a compressed SQL dump.\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mld_backup_${job.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Mock backup artifact downloaded (no real data).', 'info');
  };

  return (
    <div>
      <PageHeader
        title="Backup Jobs"
        subtitle="Request and monitor database backup jobs"
        action={<Button onClick={() => setConfirmOpen(true)}>Request Backup</Button>}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 flex items-start gap-2 text-sm text-amber-800">
        <span>⚠</span>
        <div>
          <strong>Demo notice:</strong> This is a simulated backup system. No real database content is created or downloaded. Mock artifacts contain only placeholder metadata.
        </div>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Job ID</Th>
              <Th>Requested By</Th>
              <Th>Created</Th>
              <Th>Completed</Th>
              <Th>Status</Th>
              <Th>Notes</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && !loading && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No backup jobs yet.</td></tr>
            )}
            {jobs.map(job => (
              <Tr key={job.id}>
                <Td><span className="font-mono text-xs text-slate-400">{job.id}</span></Td>
                <Td className="text-slate-600">{job.requestedByName}</Td>
                <Td className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(job.createdAt)}</Td>
                <Td className="text-xs text-slate-500 whitespace-nowrap">{job.completedAt ? formatDateTime(job.completedAt) : '—'}</Td>
                <Td>{jobBadge(job.state)}</Td>
                <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100 text-xs text-slate-500 max-w-xs truncate" title={job.notes}>{job.notes}</td>
                <Td>
                  {job.state === 'completed' && (
                    <button onClick={() => handleDownload(job)} className="text-xs text-teal-600 hover:underline font-medium">
                      ↓ Download
                    </button>
                  )}
                  {(job.state === 'queued' || job.state === 'running') && (
                    <span className="text-xs text-slate-400 animate-pulse">Processing…</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRequest}
        title="Request Backup"
        message="Queue a new backup job? This will simulate a database backup. The job runs asynchronously and should complete within 30 seconds."
        confirmLabel="Request Backup"
        variant="primary"
        loading={reqLoading}
      />
    </div>
  );
}
