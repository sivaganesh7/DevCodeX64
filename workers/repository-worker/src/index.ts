import { PrismaClient } from '@prisma/client';
import Queue from 'bull';
import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const ingestionQueue = new Queue('ingestion_queue', {
  redis: {
    host: redisHost,
    port: redisPort,
  },
});

const MAX_FILE_SIZE = parseInt(process.env.MAX_INGEST_FILE_SIZE || '1048576', 10); // 1MB default

// Supported extensions
const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
  '.go', '.rs', '.php', '.rb', '.cs', '.sql', '.html', '.css', '.scss',
  '.json', '.yaml', '.yml', '.xml', '.md', '.txt'
]);

// Directories to skip
const IGNORED_DIRECTORIES = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'target',
  'bin', 'obj', 'vendor', '__pycache__', '.venv', 'venv'
]);

function isSupportedFile(filePath: string): boolean {
  const parts = filePath.split('/');
  
  // Check if any part of the path is an ignored directory
  for (const part of parts) {
    if (IGNORED_DIRECTORIES.has(part)) {
      return false;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (SUPPORTED_EXTENSIONS.has(ext)) return true;
  if (['dockerfile', 'makefile', 'package.json', 'pom.xml', 'requirements.txt'].includes(base)) return true;
  
  return false;
}

async function getInstallationOctokit(installationId: string) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('GitHub App credentials are not configured');
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      installationId: parseInt(installationId, 10),
    },
  });
}

ingestionQueue.process('INGEST_REPOSITORY', async (job) => {
  const { jobId, repositoryId, owner, repo, branch, installationId } = job.data;
  
  console.log(`[repository-worker] Starting ingestion job ${jobId} for ${owner}/${repo}`);

  try {
    // 1. Mark job as PROCESSING
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    // 2. Fetch repository tree
    console.log(`[repository-worker] Fetching tree for ${owner}/${repo} at branch ${branch}`);
    const octokit = await getInstallationOctokit(installationId);
    
    const treeResponse = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: '1',
    });

    const tree = treeResponse.data.tree;
    const filesToProcess = tree.filter((item: any) => item.type === 'blob');
    
    let totalFiles = filesToProcess.length;
    let processedFiles = 0;
    let skippedFiles = 0;
    let failedFiles = 0;

    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { totalFiles },
    });

    // 3. Process files
    for (const file of filesToProcess) {
      if (!file.path) continue;
      
      const filePath = file.path;

      // Filter check
      if (!isSupportedFile(filePath)) {
        skippedFiles++;
        continue;
      }

      // Size check
      if (file.size && file.size > MAX_FILE_SIZE) {
        skippedFiles++;
        continue;
      }

      try {
        // Fetch content
        const contentResponse = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branch,
        });

        const data = contentResponse.data as any;
        
        let contentStr = null;
        if (data.type === 'file' && data.encoding === 'base64') {
          contentStr = Buffer.from(data.content, 'base64').toString('utf8');
        }

        // 4. Save normalized file
        await prisma.repositoryFile.upsert({
          where: {
            repositoryId_path: {
              repositoryId,
              path: filePath,
            },
          },
          create: {
            repositoryId,
            path: filePath,
            name: path.basename(filePath),
            extension: path.extname(filePath),
            size: file.size || 0,
            sha: file.sha || '',
            content: contentStr,
          },
          update: {
            size: file.size || 0,
            sha: file.sha || '',
            content: contentStr,
          },
        });

        processedFiles++;
        console.log(`[repository-worker] Ingested file: ${filePath}`);
      } catch (err) {
        console.error(`[repository-worker] Failed to process file ${filePath}`, err);
        failedFiles++;
      }

      // Update progress periodically (e.g., every 10 files)
      if ((processedFiles + skippedFiles + failedFiles) % 10 === 0) {
        await prisma.ingestionJob.update({
          where: { id: jobId },
          data: { processedFiles, skippedFiles, failedFiles },
        });
      }
    }

    // 5. Mark job as COMPLETED
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        processedFiles,
        skippedFiles,
        failedFiles,
      },
    });

    console.log(`[repository-worker] Ingestion job ${jobId} completed. Processed: ${processedFiles}, Skipped: ${skippedFiles}, Failed: ${failedFiles}`);
  } catch (error: any) {
    console.error(`[repository-worker] Ingestion job ${jobId} failed:`, error);
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'Unknown error occurred',
        completedAt: new Date(),
      },
    });
  }
});

ingestionQueue.on('error', (error) => {
  console.error('[repository-worker] Queue error:', error);
});

console.log(`[repository-worker] Bull worker initialized. Listening for jobs on 'ingestion_queue'...`);
