import Docker from 'dockerode';
import { logger } from '../utils/logger.js';

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'exited';
  ports: Record<string, number>;
  mounts: Array<{ source: string; destination: string }>;
  createdAt: string;
  startedAt?: string;
}

export interface ImageInfo {
  id: string;
  repo: string;
  tag: string;
  size: number;
  createdAt: string;
}

export interface VolumeInfo {
  name: string;
  driver: string;
  mountPoint: string;
  createdAt: string;
}

export interface CreateContainerOpts {
  image: string;
  name: string;
  ports?: Record<string, number>;
  env?: Record<string, string>;
  mounts?: Array<{ source: string; destination: string }>;
  cmd?: string[];
}

export interface CreateVolumeOpts {
  name: string;
  driver?: string;
  labels?: Record<string, string>;
}

export interface DockerInfo {
  dockerVersion: string;
  containers: number;
  images: number;
  hostname: string;
}

export class DockerClient {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  async getInfo(): Promise<DockerInfo> {
    const info = await this.docker.info();
    const version = await this.docker.version();
    return {
      dockerVersion: version.Version || 'unknown',
      containers: info.Containers || 0,
      images: info.Images || 0,
      hostname: info.Name || 'unknown',
    };
  }

  async listContainers(all = true): Promise<ContainerInfo[]> {
    const containers = await this.docker.listContainers({ all });
    return containers.map((c) => this.mapContainerInfo(c));
  }

  async getContainer(id: string): Promise<ContainerInfo> {
    const container = this.docker.getContainer(id);
    const info = await container.inspect();
    return this.mapContainerInspect(info);
  }

  async createContainer(opts: CreateContainerOpts): Promise<ContainerInfo> {
    logger.info(`Creating container: ${opts.name}`, { image: opts.image });

    const portBindings: Record<string, Array<{ HostPort: string }>> = {};
    const exposedPorts: Record<string, object> = {};

    if (opts.ports) {
      for (const [containerPort, hostPort] of Object.entries(opts.ports)) {
        const portKey = `${containerPort}/tcp`;
        exposedPorts[portKey] = {};
        portBindings[portKey] = [{ HostPort: String(hostPort) }];
      }
    }

    const binds: string[] = [];
    if (opts.mounts) {
      for (const mount of opts.mounts) {
        binds.push(`${mount.source}:${mount.destination}`);
      }
    }

    const env: string[] = [];
    if (opts.env) {
      for (const [key, value] of Object.entries(opts.env)) {
        env.push(`${key}=${value}`);
      }
    }

    const container = await this.docker.createContainer({
      Image: opts.image,
      name: opts.name,
      ExposedPorts: exposedPorts,
      Env: env,
      Cmd: opts.cmd,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds,
      },
    });

    await container.start();
    logger.info(`Container started: ${container.id}`);

    return this.getContainer(container.id);
  }

  async startContainer(id: string): Promise<void> {
    logger.info(`Starting container: ${id}`);
    const container = this.docker.getContainer(id);
    await container.start();
    logger.info(`Container started: ${id}`);
  }

  async stopContainer(id: string): Promise<void> {
    logger.info(`Stopping container: ${id}`);
    const container = this.docker.getContainer(id);
    await container.stop();
    logger.info(`Container stopped: ${id}`);
  }

  async restartContainer(id: string): Promise<void> {
    logger.info(`Restarting container: ${id}`);
    const container = this.docker.getContainer(id);
    await container.restart();
    logger.info(`Container restarted: ${id}`);
  }

  async removeContainer(id: string, force = false): Promise<void> {
    logger.info(`Removing container: ${id}`, { force });
    const container = this.docker.getContainer(id);
    await container.remove({ force });
    logger.info(`Container removed: ${id}`);
  }

  async listImages(): Promise<ImageInfo[]> {
    const images = await this.docker.listImages();
    return images.map((img) => this.mapImageInfo(img));
  }

  async pullImage(repo: string): Promise<ImageInfo> {
    logger.info(`Pulling image: ${repo}`);
    
    return new Promise((resolve, reject) => {
      this.docker.pull(repo, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) {
          logger.error(`Failed to pull image: ${repo}`, { error: err.message });
          reject(err);
          return;
        }

        this.docker.modem.followProgress(stream, async (pullErr: Error | null) => {
          if (pullErr) {
            logger.error(`Failed to pull image: ${repo}`, { error: pullErr.message });
            reject(pullErr);
            return;
          }

          logger.info(`Image pulled: ${repo}`);
          
          // Get the image info
          const images = await this.docker.listImages({ filters: { reference: [repo] } });
          if (images.length > 0) {
            resolve(this.mapImageInfo(images[0]));
          } else {
            resolve({
              id: 'unknown',
              repo: repo.split(':')[0],
              tag: repo.split(':')[1] || 'latest',
              size: 0,
              createdAt: new Date().toISOString(),
            });
          }
        });
      });
    });
  }

  async removeImage(id: string, force = false): Promise<void> {
    logger.info(`Removing image: ${id}`, { force });
    const image = this.docker.getImage(id);
    await image.remove({ force });
    logger.info(`Image removed: ${id}`);
  }

  async listVolumes(): Promise<VolumeInfo[]> {
    const result = await this.docker.listVolumes();
    return (result.Volumes || []).map((v) => ({
      name: v.Name,
      driver: v.Driver,
      mountPoint: v.Mountpoint,
      createdAt: (v as unknown as { CreatedAt?: string }).CreatedAt || new Date().toISOString(),
    }));
  }

  async createVolume(opts: CreateVolumeOpts): Promise<VolumeInfo> {
    logger.info(`Creating volume: ${opts.name}`);
    await this.docker.createVolume({
      Name: opts.name,
      Driver: opts.driver || 'local',
      Labels: opts.labels,
    });
    // Get volume info after creation
    const volume = this.docker.getVolume(opts.name);
    const info = await volume.inspect();
    logger.info(`Volume created: ${opts.name}`);
    return {
      name: info.Name,
      driver: info.Driver,
      mountPoint: info.Mountpoint,
      createdAt: (info as unknown as { CreatedAt?: string }).CreatedAt || new Date().toISOString(),
    };
  }

  async removeVolume(name: string): Promise<void> {
    logger.info(`Removing volume: ${name}`);
    const volume = this.docker.getVolume(name);
    await volume.remove();
    logger.info(`Volume removed: ${name}`);
  }

  private mapContainerInfo(c: Docker.ContainerInfo): ContainerInfo {
    const ports: Record<string, number> = {};
    for (const port of c.Ports || []) {
      if (port.PublicPort) {
        ports[String(port.PrivatePort)] = port.PublicPort;
      }
    }

    const mounts: Array<{ source: string; destination: string }> = [];
    for (const mount of c.Mounts || []) {
      mounts.push({
        source: mount.Source || '',
        destination: mount.Destination || '',
      });
    }

    let status: 'running' | 'stopped' | 'exited' = 'stopped';
    if (c.State === 'running') {
      status = 'running';
    } else if (c.State === 'exited') {
      status = 'exited';
    }

    return {
      id: c.Id,
      name: (c.Names?.[0] || '').replace(/^\//, ''),
      image: c.Image,
      status,
      ports,
      mounts,
      createdAt: new Date(c.Created * 1000).toISOString(),
    };
  }

  private mapContainerInspect(info: Docker.ContainerInspectInfo): ContainerInfo {
    const ports: Record<string, number> = {};
    const portBindings = info.HostConfig?.PortBindings || {};
    for (const [containerPort, bindings] of Object.entries(portBindings)) {
      const bindingsArray = bindings as Array<{ HostPort?: string }> | undefined;
      const binding = bindingsArray?.[0];
      if (binding?.HostPort) {
        const port = containerPort.split('/')[0];
        ports[port] = parseInt(binding.HostPort, 10);
      }
    }

    const mounts: Array<{ source: string; destination: string }> = [];
    for (const mount of info.Mounts || []) {
      mounts.push({
        source: mount.Source || '',
        destination: mount.Destination || '',
      });
    }

    let status: 'running' | 'stopped' | 'exited' = 'stopped';
    if (info.State?.Running) {
      status = 'running';
    } else if (info.State?.Status === 'exited') {
      status = 'exited';
    }

    return {
      id: info.Id,
      name: info.Name.replace(/^\//, ''),
      image: info.Config?.Image || '',
      status,
      ports,
      mounts,
      createdAt: info.Created,
      startedAt: info.State?.StartedAt,
    };
  }

  private mapImageInfo(img: Docker.ImageInfo): ImageInfo {
    const repoTag = img.RepoTags?.[0] || 'unknown:latest';
    const [repo, tag] = repoTag.split(':');
    return {
      id: img.Id.replace('sha256:', '').substring(0, 12),
      repo,
      tag: tag || 'latest',
      size: img.Size,
      createdAt: new Date(img.Created * 1000).toISOString(),
    };
  }
}
