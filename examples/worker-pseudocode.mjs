/** NON-RUNNABLE PRODUCTION PATTERN / contract for a DB-backed worker.
 * Claim at most one scheduled job per account; lease must be transactionally
 * managed in DB. No concurrent duplicate publish on job restarts.
 */
export async function workerTick({ db, graphForAccount, clock = () => new Date() }) {
  // claimDue returns locked/leased SCHEDULED job, or null; use SKIP LOCKED.
  const job = await db.claimDue({ at: clock() });
  if (!job) return null;
  try {
    const graph = await graphForAccount(job.accountId);
    if (!job.containerId) {
      const container = await graph.createImageContainer(job.imageUrl, job.caption);
      await db.markContainerCreated(job.id, container.id);
      job.containerId = container.id;
    }
    const status = await graph.containerStatus(job.containerId);
    if (status.status_code !== 'FINISHED') {
      await db.retryWhenReady(job.id, status.status_code);
      return { jobId: job.id, state: status.status_code };
    }
    await db.markPublishing(job.id); // locks future claims before side effect
    // Ambiguous publish response is NOT safe to blindly replay.
    const published = await graph.publishContainer(job.containerId);
    await db.markPublished(job.id, published.id);
    return { jobId: job.id, publishedId: published.id };
  } catch (error) {
    await db.markFailure(job.id, { message: String(error?.message || error), reconciliationRequired: true });
    throw error;
  }
}
