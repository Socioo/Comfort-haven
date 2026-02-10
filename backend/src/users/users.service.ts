import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: any): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user as any); // TypeORM save can return T or T[] based on input, identifying as any to bypass strict check if generic inference fails
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findAllByRole(role: 'user' | 'host'): Promise<User[]> {
    return this.usersRepository.find({ where: { role: role as any } });
  }
}