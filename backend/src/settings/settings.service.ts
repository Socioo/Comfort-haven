import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

const DEFAULT_SETTINGS = [
  { key: 'whatsapp', value: '', group: 'contact' },
  { key: 'email', value: '', group: 'contact' },
  { key: 'address', value: '', group: 'contact' },
  { key: 'instagram', value: '', group: 'social' },
  { key: 'tiktok', value: '', group: 'social' },
  { key: 'x', value: '', group: 'social' },
  // App Settings
  { key: 'app_name', value: 'Comfort Haven', group: 'app' },
  { key: 'support_email', value: 'support@comforthaven.com', group: 'app' },
  { key: 'maintenance_mode', value: 'false', group: 'app' },
  { key: 'bookingTimeout', value: 'true', group: 'app' },
  { key: 'autoApproveHosts', value: 'false', group: 'app' },
  { key: 'autoApproveProperties', value: 'true', group: 'app' },
  { key: 'serviceAvailability', value: 'false', group: 'app' },
  { key: 'emailNotifications', value: 'true', group: 'app' },
  { key: 'smsAlerts', value: 'false', group: 'app' },
  { key: 'pushMessages', value: 'true', group: 'app' },
  // Payment Settings
  { key: 'currency', value: 'NGN', group: 'payment' },
  { key: 'tax_rate', value: '7.5', group: 'payment' },
  { key: 'platform_fee', value: '5', group: 'payment' },
  { key: 'supportedGateways', value: 'true', group: 'payment' },
  { key: 'enableMethods', value: 'false', group: 'payment' },
  { key: 'minOrderPrice', value: 'true', group: 'payment' },
  { key: 'commissionSetup', value: 'false', group: 'payment' },
];

@Injectable()
export class SettingsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaultSettings();
  }

  private async seedDefaultSettings() {
    for (const defaults of DEFAULT_SETTINGS) {
      const existing = await this.settingsRepository.findOne({ where: { key: defaults.key } });
      if (!existing) {
        const setting = this.settingsRepository.create({
          ...defaults,
          type: (defaults as any).type || 'string'
        });
        await this.settingsRepository.save(setting);
      }
    }
  }

  async get(key: string, defaultValue: any = null) {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) return defaultValue;

    switch (setting.type) {
      case 'number': return Number(setting.value);
      case 'boolean': return setting.value === 'true' || setting.value === '1';
      case 'json': {
        try {
          return JSON.parse(setting.value);
        } catch {
          return setting.value;
        }
      }
      default: return setting.value;
    }
  }

  async set(key: string, value: any, type: string = 'string', group: string = 'app') {
    let stringValue = String(value);
    if (type === 'json' || typeof value === 'object') {
      stringValue = JSON.stringify(value);
      type = 'json';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'number') {
      type = 'number';
    }

    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = stringValue;
      setting.type = type;
      if (group) setting.group = group;
    } else {
      setting = this.settingsRepository.create({ key, value: stringValue, type, group });
    }
    return this.settingsRepository.save(setting);
  }

  async findAll() {
    return this.settingsRepository.find();
  }

  async findByGroup(group: string) {
    return this.settingsRepository.find({ where: { group } });
  }

  async findOneByKey(key: string) {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    return setting;
  }

  async updateByKey(key: string, value: string) {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      return this.settingsRepository.save(setting);
    } else {
      setting = this.settingsRepository.create({ key, value });
      return this.settingsRepository.save(setting);
    }
  }

  async updateMany(settings: { key: string; value: string }[]) {
    const results: Setting[] = [];
    for (const { key, value } of settings) {
      results.push(await this.updateByKey(key, value));
    }
    return results;
  }
}
