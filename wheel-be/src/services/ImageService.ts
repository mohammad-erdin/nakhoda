import * as JobService from './JobService.js';
import * as RudderService from './RudderService.js';
import { logger } from '../utils/logger.js';
import { dispatchJob } from '../websocket/index.js';

const JOB_ACTIONS = {
	IMAGE_PULL: 'image.pull',
	IMAGE_DELETE: 'image.delete',
} as const;

export interface PullImageInput {
  rudderId: string;
  repo: string;
}

export interface ImageActionResult {
  jobId: string;
  status: string;
  message?: string;
}

export async function pullImage(input: PullImageInput): Promise<ImageActionResult> {
	await RudderService.ensureRudderOnline(input.rudderId);

	const job = await JobService.createJob({
		rudderId: input.rudderId,
		action: JOB_ACTIONS.IMAGE_PULL,
		params: { repo: input.repo },
	});

	logger.info('Image pull job created', { jobId: job.id, repo: input.repo, rudderId: input.rudderId });

	// Dispatch job to rudder
	await dispatchJob(input.rudderId, job.id, JOB_ACTIONS.IMAGE_PULL, job.params);

	return {
		jobId: job.id,
		status: 'running',
		message: 'Pulling image...',
	};
}

export interface DeleteImageInput {
  rudderId: string;
  imageId: string;
  force?: boolean;
}

export async function deleteImage(input: DeleteImageInput): Promise<ImageActionResult> {
	await RudderService.ensureRudderOnline(input.rudderId);

	const job = await JobService.createJob({
		rudderId: input.rudderId,
		action: JOB_ACTIONS.IMAGE_DELETE,
		params: { imageId: input.imageId, force: input.force },
	});

	// Dispatch job to rudder
	await dispatchJob(input.rudderId, job.id, JOB_ACTIONS.IMAGE_DELETE, job.params);

	return {
		jobId: job.id,
		status: 'running',
		message: 'Image deletion queued',
	};
}
