import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async findAll() {
    return this.settingsRepository.find();
  }

  async get(key: string, defaultValue: any = null) {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) return defaultValue;
    
    switch (setting.type) {
      case 'number': return Number(setting.value);
      case 'boolean': return setting.value === 'true';
      case 'json': return JSON.parse(setting.value);
      default: return setting.value;
    }
  }

  async set(key: string, value: any, type: string = 'string') {
    let stringValue = String(value);
    if (type === 'json') stringValue = JSON.stringify(value);
    
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = stringValue;
      setting.type = type;
    } else {
      setting = this.settingsRepository.create({ key, value: stringValue, type });
    }
    return this.settingsRepository.save(setting);
  }
}
